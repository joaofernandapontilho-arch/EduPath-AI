import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function cleanJsonResponse(text: string): string {
  if (!text) return "";
  
  // 1. Basic trimming of markdown bits
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/g, "").replace(/```\s*$/g, "").trim();
  }
  
  // Try to find the JSON boundaries
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }
  
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  // 2. Try parsing directly - if it works, the AI did a good job and we shouldn't touch it
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (initialError) {
    console.warn("JSON direct parse failed, applying surgical fixes...", initialError);
    
    // 3. Fix raw backslashes that break JSON (common in LaTeX)
    // We escape backslashes that are NOT part of a valid escape sequence
    // JSON valid: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
    cleaned = cleaned.replace(/\\(?![/\\bfnrtu"]|u[a-fA-F0-9]{4})/g, "\\\\");

    // 4. Handle literal control characters (like actual newlines in strings)
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (match) => {
      if (match === '\n') return '\\n';
      if (match === '\r') return '\\r';
      if (match === '\t') return '\\t';
      return ' ';
    });

    // Final attempt
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (finalError) {
      console.error("JSON fix failed, returning raw cleaned string:", finalError);
      return cleaned; 
    }
  }
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  shortSummary: string;
  fullContent: string;
  quiz: QuizQuestion[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface LearningPath {
  id: string;
  subject: string;
  units: Unit[];
}

export interface LearningPathHistory {
  path: LearningPath;
  completedLessons: string[];
  lastAccessed: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export async function generateLearningPath(content: string, type: 'text' | 'pdf' | 'youtube'): Promise<LearningPath> {
  const isUrl = type === 'youtube' || content.startsWith('http');
  
  const prompt = `
    Analise o seguinte conteúdo de estudo (${type}):
    "${content.substring(0, 15000)}" 

    ${isUrl ? 'Pesquise sobre este conteúdo para entender os pontos principais e o contexto.' : ''}
    
    Crie uma trilha de aprendizado gamificada baseada neste conteúdo. 
    A trilha deve ser dividida em pelo menos 2 Unidades. Cada unidade deve conter 3 lições.
    
    REGRAS PARA O CONTEÚDO:
    1. LaTeX OBRIGATÓRIO: Use LaTeX ($...$ ou $$...$$) para TODAS as fórmulas matemáticas, expoentes e equações.
    2. PROGRAMAÇÃO: Use blocos de código (\`\`\`linguagem ... \`\`\`) e backticks (\`termo\`) para código. NUNCA misture LaTeX com código.
    3. QUIZ: Cada lição deve ter um 'quiz' com 4 questões. Cada questão tem 'question', 'options' (4 strings), 'correctAnswer' (0-3) e 'explanation'.
    4. ESCAPE DE JSON: Garanta que barras invertidas sejam escapadas se forem parte do texto (ex: "\\\\frac").
  `;

  try {
    console.log(`Iniciando geração de trilha para: ${type}`);
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            units: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  lessons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        shortSummary: { type: Type.STRING },
                        fullContent: { type: Type.STRING },
                        quiz: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              question: { type: Type.STRING },
                              options: { type: Type.ARRAY, items: { type: Type.STRING } },
                              correctAnswer: { type: Type.NUMBER },
                              explanation: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctAnswer", "explanation"]
                          }
                        }
                      },
                      required: ["id", "title", "shortSummary", "fullContent", "quiz"]
                    }
                  }
                },
                required: ["id", "title", "description", "lessons"]
              }
            }
          },
          required: ["subject", "units"]
        }
      }
    });

    const text = result.text;
    if (!text) throw new Error("O modelo não retornou conteúdo.");
    
    const cleanedText = cleanJsonResponse(text);
    const data = JSON.parse(cleanedText);
    
    // Ensure IDs exist
    if (!data.id) data.id = crypto.randomUUID();
    data.units.forEach((u: any, ui: number) => {
      if (!u.id) u.id = `u${ui + 1}`;
      u.lessons.forEach((l: any, li: number) => {
        if (!l.id) l.id = `l${ui + 1}-${li + 1}`;
      });
    });

    return data as LearningPath;
  } catch (error) {
    console.error("Erro ao gerar trilha:", error);
    throw new Error(`Falha ao gerar a trilha: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

export async function generateMindMap(subject: string, content: string): Promise<MindMapNode> {
  const prompt = `
    Crie um mapa mental estruturado e hierárquico sobre o assunto: "${subject}".
    Use este conteúdo como base: "${content.substring(0, 8000)}"

    O mapa mental deve ter:
    - Um nó central (o assunto).
    - Pelo menos 4 ramos principais (tópicos chave).
    - Pelo menos 2 a 3 sub-ramos para cada ramo principal com detalhes, conceitos ou fórmulas.

    Retorne APENAS um JSON válido seguindo esta estrutura:
    {
      "id": "root",
      "label": "Assunto Central",
      "children": [
        {
          "id": "topic1",
          "label": "Ramo Principal 1",
          "children": [
            { "id": "sub1", "label": "Detalhe 1" },
            { "id": "sub2", "label": "Detalhe 2" }
          ]
        }
      ]
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = result.text;
    if (!text) throw new Error("Falha ao obter mapa mental.");
    
    const cleanedText = cleanJsonResponse(text);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Mind Map Error:", error);
    throw new Error("Não foi possível gerar o mapa mental.");
  }
}

export async function explainQuizError(question: string, wrongAnswer: string, correctAnswer: string): Promise<string> {
  const prompt = `
    O usuário errou uma questão no quiz e precisa de ajuda simplificada.
    
    QUESTÃO: "${question}"
    RESPOSTA MARCADA (ERRADA): "${wrongAnswer}"
    RESPOSTA CORRETA: "${correctAnswer}"

    INSTRUÇÕES DE FORMATAÇÃO (MUITO IMPORTANTE):
    - NÃO use barras invertidas (\) para escapar símbolos de moeda como o real (R$). Use apenas "R$".
    - Para qualquer termo matemático, expoente ou equação, use EXCLUSIVAMENTE LaTeX com delimitadores de cifrão: $...$. Exemplo: "$x^2$", "$150 - 60 = 90$".
    - Se for programação, use \`backticks\` para código e blocos de código se necessário. NUNCA misture LaTeX com código.
    - Garanta espaços adequados entre negritos e o texto ao redor (ex: "**Por que** isso acontece?" e não "**Por que**isso acontece?").
    - O conteúdo deve ser amigável, como o "Edu", o professor coruja.
    - Explique de forma muito simples o provável erro e como chegar na resposta certa.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return result.text || "Ops! Não consegui pensar em uma explicação agora.";
  } catch (error) {
    console.error("Quiz Error Explanation Error:", error);
    return "Tive um problema ao conectar com minha sabedoria de coruja. Tente de novo!";
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function askStudyMentor(
  query: string, 
  context: string, 
  history: ChatMessage[]
): Promise<string> {
  const systemPrompt = `
    Você é o "Edu", um Mentor de Estudos amigável e encorajador.
    
    CONTEXTO DO ESTUDO ATUAL:
    "${context.substring(0, 10000)}"

    SUA MISSÃO:
    - Ajude o usuário a entender o conteúdo acima.
    - NÃO dê apenas a resposta pronta; peça para ele pensar, use analogias e incentive o raciocínio.
    - Se o assunto for programação, forneça exemplos de código claros em blocos Markdown.
    - Se for matemática, use LaTeX ($...$).
    - Mantenha um tom de professor mentor que quer ver o aluno crescer.
    - Use o histórico da conversa para manter a continuidade.
  `;

  try {
    const historyText = history.map(m => `${m.role === 'user' ? 'Aluno' : 'Mentor'}: ${m.content}`).join('\n');
    const prompt = `
      ${systemPrompt}
      
      HISTÓRICO DA CONVERSA:
      ${historyText}
      
      NOVA PERGUNTA DO ALUNO:
      "${query}"
      
      RESPONDA COMO EDU (MENTOR):
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return result.text || "Desculpe, me perdi na minha sabedoria aqui. Pode repetir?";
  } catch (error) {
    console.error("Mentor Chat Error:", error);
    return "Ops! Tive um pequeno problema na minha bússola de mentor. Pode repetir a pergunta?";
  }
}
export async function explainSimply(content: string): Promise<string> {
  const prompt = `
    "${content}"

    REGRAS:
    - Use analogias simples do cotidiano.
    - Evite termos técnicos complexos. Se precisar usar um, explique-o com palavras fáceis.
    - Se houver código, use \`backticks\` para destacá-lo.
    - Seja amigável, direto e encorajador.
    - Use Markdown para formatação se necessário.
    - O tom deve ser estilo "Edu", o mascote coruja amigável.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return result.text || "Não consegui simplificar agora, tente novamente!";
  } catch (error) {
    console.error("Simple Explanation Error:", error);
    return "Ops! Tive um problema ao simplificar isso. Pode tentar de novo?";
  }
}

export async function generateFlashcards(subject: string, difficulty: string, count: number): Promise<Flashcard[]> {
  const prompt = `
    Crie ${count} flashcards de estudo sobre o assunto: "${subject}".
    Nível de dificuldade solicitado: ${difficulty} (Iniciante, Intermediário ou Avançado).
    
    Cada flashcard deve ter uma pergunta/termo no 'front' e uma resposta/explicação concisa no 'back'.
    O tom deve ser educativo e encorajador, estilo Duolingo.
    - IMPORTANTE PARA JSON: Qualquer barra invertida (\) usada em LaTeX (ex: \frac, \sqrt) DEVE ser escapada com outra barra invertida (ex: \\frac, \\sqrt) para que o JSON seja válido.
    Se o assunto envolver matemática ou fórmulas, utilize obrigatoriamente LaTeX com delimitadores $...$ para inline e $$...$$ para blocos.

    Retorne APENAS um JSON válido seguindo esta estrutura:
    {
      "flashcards": [
        { "front": "Pergunta ou Termo", "back": "Resposta ou Explicação" }
      ]
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = result.text;
    if (!text) throw new Error("Não foi possível obter resposta.");
    
    const cleanedText = cleanJsonResponse(text);
    const data = JSON.parse(cleanedText);
    return data.flashcards;
  } catch (error) {
    console.error("Flashcard Error:", error);
    throw new Error("Não foi possível gerar os flashcards.");
  }
}
