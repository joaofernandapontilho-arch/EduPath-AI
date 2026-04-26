import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { HelpBubble } from './HelpBubble';
import { Lesson, explainQuizError } from '../services/geminiService';
import { MASCOT_IMAGE } from '../constants';
import { cn } from '../lib/utils';

interface LessonModalProps {
  lesson: Lesson;
  onClose: () => void;
  onComplete: (xp: number) => void;
}

export function LessonModal({ lesson, onClose, onComplete }: LessonModalProps) {
  const [step, setStep] = useState<'content' | 'quiz' | 'result'>('content');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const currentQuestion = lesson.quiz[currentQuestionIdx];

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;
    setShowExplanation(true);
    
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleAskWhy = async () => {
    if (selectedOption === null) return;
    setIsAiLoading(true);
    try {
      const wrongText = currentQuestion.options[selectedOption];
      const correctText = currentQuestion.options[currentQuestion.correctAnswer];
      const explanation = await explainQuizError(currentQuestion.question, wrongText, correctText);
      setAiExplanation(explanation);
    } catch (err) {
      setAiExplanation("Tive um probleminha para explicar agora. Mas a resposta certa é a marcada em verde!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setAiExplanation(null);
    if (currentQuestionIdx < lesson.quiz.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setStep('result');
    }
  };

  const handleFinish = () => {
    onComplete(score * 10 + 20); // Base XP + bônus por acerto
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-natural-title/40 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[40px] shadow-2xl flex flex-col border-4 border-natural-border"
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b-4 border-natural-border bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-natural-primary/10 rounded-2xl flex items-center justify-center text-natural-primary shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-natural-title leading-tight tracking-tight">{lesson.title}</h3>
              <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] mt-0.5">Módulo de {step === 'content' ? 'Estudo' : 'Avaliação'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-natural-border-light rounded-2xl transition-all text-natural-muted hover:text-natural-title"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar (Visible in Quiz) */}
        {step === 'quiz' && (
          <div className="h-4 bg-natural-border-light w-full p-1 border-b-4 border-natural-border">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIdx + (showExplanation ? 1 : 0)) / lesson.quiz.length) * 100}%` }}
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-natural-bg/10">
          <AnimatePresence mode="wait">
            {step === 'content' && (
              <motion.div 
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="bg-white p-8 rounded-[32px] border-4 border-natural-border italic text-natural-title font-medium leading-relaxed shadow-sm relative">
                  <div className="absolute -top-3 -left-3 bg-natural-accent text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">“</div>
                  "{lesson.shortSummary}"
                  <HelpBubble 
                    content={`Conteúdo: ${lesson.fullContent}`}
                    unitTitle={lesson.title}
                  />
                </div>
                
                <div className="prose prose-slate max-w-none text-natural-title font-medium leading-loose text-lg pb-24 markdown-body">
                  <Markdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {lesson.fullContent}
                  </Markdown>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white to-transparent pt-20 pointer-events-none">
                  <button 
                    onClick={() => setStep('quiz')}
                    className="w-full max-w-md mx-auto pointer-events-auto py-6 bg-natural-primary text-white rounded-[28px] border-b-[8px] border-natural-primary-dark font-black text-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 shadow-2xl active:border-b-0 active:translate-y-[4px]"
                  >
                    PRATICAR CONTEÚDO
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'quiz' && (
              <motion.div 
                key={`quiz-${currentQuestionIdx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border-4 border-natural-border shadow-sm">
                  <div className="w-16 h-16 mascot-bounce overflow-hidden">
                    <img src={MASCOT_IMAGE} alt="Edu" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest leading-none mb-1">Questão {currentQuestionIdx + 1} de {lesson.quiz.length}</p>
                    <p className="text-xl font-black text-natural-title leading-tight">Vamos testar o que você aprendeu!</p>
                  </div>
                </div>
                
                <div className="text-2xl font-black text-natural-title leading-snug tracking-tight markdown-body">
                  <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {currentQuestion.question}
                  </Markdown>
                </div>
                
                <div className="grid gap-4">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !showExplanation && setSelectedOption(idx)}
                      className={cn(
                        "w-full p-6 text-left rounded-[28px] border-4 border-b-[8px] font-black transition-all text-lg flex items-center gap-6 group",
                        selectedOption === idx 
                          ? showExplanation 
                            ? idx === currentQuestion.correctAnswer 
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                              : "bg-rose-50 border-rose-500 text-rose-700"
                            : "bg-natural-primary/5 border-natural-primary text-natural-primary translate-y-[-4px]"
                          : "bg-white border-natural-border text-natural-title hover:bg-natural-bg/20"
                      )}
                    >
                      <span className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black transition-colors",
                        selectedOption === idx ? "bg-natural-primary text-white" : "bg-natural-border-light text-natural-muted group-hover:bg-natural-border"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="flex-1 markdown-body text-base font-bold">
                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {option}
                        </Markdown>
                      </div>
                    </button>
                  ))}
                </div>

                {showExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-8 rounded-[32px] flex gap-5 items-start border-4 shadow-inner",
                      selectedOption === currentQuestion.correctAnswer 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                        : "bg-rose-50 text-rose-800 border-rose-100"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      selectedOption === currentQuestion.correctAnswer ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    )}>
                      {selectedOption === currentQuestion.correctAnswer ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-xl leading-tight">
                          {selectedOption === currentQuestion.correctAnswer ? "Exato!" : "Ops, não foi dessa vez."}
                        </p>
                        
                        {selectedOption !== currentQuestion.correctAnswer && !aiExplanation && (
                          <button 
                            onClick={handleAskWhy}
                            disabled={isAiLoading}
                            className="bg-natural-primary text-white px-5 py-2 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                          >
                            {isAiLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Analisando...</span>
                              </>
                            ) : (
                              <>
                                <HelpCircle className="w-4 h-4" />
                                <span>Por que?</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {aiExplanation ? (
                        <div className="font-medium mt-4 p-6 bg-white/20 rounded-2xl border-2 border-white/30 animate-in fade-in zoom-in-95 duration-500 markdown-body text-base leading-relaxed shadow-inner font-sans">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {aiExplanation}
                          </Markdown>
                        </div>
                      ) : (
                        <div className="font-medium mt-2 leading-relaxed opacity-80 markdown-body text-base">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {currentQuestion.explanation}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="pt-6">
                  {!showExplanation ? (
                    <button 
                      onClick={handleQuizSubmit}
                      disabled={selectedOption === null}
                      className="w-full py-6 bg-natural-primary disabled:bg-natural-border-light disabled:text-natural-muted disabled:border-natural-border text-white rounded-[28px] border-b-[8px] border-natural-primary-dark font-black text-xl hover:translate-y-[-2px] transition-all shadow-2xl active:border-b-0 active:translate-y-[4px]"
                    >
                      VERIFICAR RESPOSTA
                    </button>
                  ) : (
                    <button 
                      onClick={nextQuestion}
                      className="w-full py-6 bg-emerald-500 text-white rounded-[28px] border-b-[8px] border-emerald-600 font-black text-xl hover:translate-y-[-2px] transition-all shadow-2xl active:border-b-0 active:translate-y-[4px] flex items-center justify-center gap-3"
                    >
                      {currentQuestionIdx < lesson.quiz.length - 1 ? 'PRÓXIMO' : 'RESULTADOS'}
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-10 py-10"
              >
                <div className="relative mascot-bounce">
                  <div className="w-48 h-48 bg-white rounded-[50px] shadow-2xl border-4 border-natural-border flex items-center justify-center p-6 overflow-hidden">
                    <img src={MASCOT_IMAGE} alt="Edu" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-5 py-2 rounded-2xl text-sm font-black shadow-xl border-4 border-white rotate-12">ÓTIMO!</div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-5xl font-black text-natural-title tracking-tight leading-none">Incrível!</h2>
                  <p className="text-xl font-bold text-natural-muted uppercase tracking-widest">Você completou a lição</p>
                  
                  <div className="flex items-center justify-center gap-8 mt-10">
                    <div className="bg-white p-6 rounded-[32px] border-4 border-natural-border shadow-sm min-w-[140px]">
                      <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] mb-2 leading-none">Pontos</p>
                      <p className="text-3xl font-black text-natural-accent">+{score * 10 + 20} XP</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border-4 border-natural-border shadow-sm min-w-[140px]">
                      <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] mb-2 leading-none">Acertos</p>
                      <p className="text-3xl font-black text-emerald-500">{score}/{lesson.quiz.length}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleFinish}
                  className="w-full max-w-xs py-6 bg-natural-primary text-white rounded-[28px] border-b-[8px] border-natural-primary-dark font-black text-xl hover:translate-y-[-2px] transition-all shadow-2xl active:border-b-0 active:translate-y-[4px]"
                >
                  CONTINUAR JORNADA
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
