import { useState, useEffect } from 'react';
import { Sparkles, Trophy, BookOpen, User, Github, Flame, Layers, History, ChevronRight, GraduationCap, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { InputZone } from './components/InputZone';
import { PathMap } from './components/PathMap';
import { LessonModal } from './components/LessonModal';
import { FlashcardsManager } from './components/FlashcardsManager';
import { LearningPath, Lesson, generateLearningPath, LearningPathHistory, MindMapNode, generateMindMap } from './services/geminiService';
import { MindMap } from './components/MindMap';
import { MentorChat } from './components/MentorChat';
import { MASCOT_IMAGE } from './constants';
import { cn } from './lib/utils';

export default function App() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [isMindMapLoading, setIsMindMapLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<LearningPathHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Carregar progresso salvo
  useEffect(() => {
    const savedPath = localStorage.getItem('edupath_current');
    const savedXP = localStorage.getItem('edupath_xp');
    const savedCompleted = localStorage.getItem('edupath_completed');
    const savedStreak = localStorage.getItem('edupath_streak');
    const lastVisit = localStorage.getItem('edupath_last_visit');
    const savedHistory = localStorage.getItem('edupath_history');
    
    if (savedPath) setPath(JSON.parse(savedPath));
    if (savedXP) setXp(parseInt(savedXP));
    if (savedCompleted) setCompletedLessons(JSON.parse(savedCompleted));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    // Lógica de Streak simples
    const today = new Date().toDateString();
    if (lastVisit && lastVisit !== today) {
       const lastDate = new Date(lastVisit);
       const diff = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
       if (diff > 1.5) {
         setStreak(0);
       }
    }
    localStorage.setItem('edupath_last_visit', today);
  }, []);

  // Salvar progresso
  useEffect(() => {
    if (path) {
      localStorage.setItem('edupath_current', JSON.stringify(path));
      
      // Update history with latest progress
      setHistory(prev => {
        const existingIdx = prev.findIndex(h => h.path.id === path.id);
        const historyItem: LearningPathHistory = {
          path,
          completedLessons,
          lastAccessed: new Date().toISOString()
        };
        
        if (existingIdx >= 0) {
          const newHistory = [...prev];
          newHistory[existingIdx] = historyItem;
          // Sort by lastAccessed
          return newHistory.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
        } else {
          return [historyItem, ...prev];
        }
      });
    }
    localStorage.setItem('edupath_xp', xp.toString());
    localStorage.setItem('edupath_completed', JSON.stringify(completedLessons));
    localStorage.setItem('edupath_streak', streak.toString());
  }, [path, xp, completedLessons, streak]);

  useEffect(() => {
    localStorage.setItem('edupath_history', JSON.stringify(history));
  }, [history]);

  const handleProcessContent = async (content: string, type: 'text' | 'pdf' | 'youtube') => {
    setIsProcessing(true);
    try {
      const newPath = await generateLearningPath(content, type);
      setPath(newPath);
      setMindMapData(null);
      setCompletedLessons([]);
      if (streak === 0) setStreak(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Algo deu errado ao processar seu conteúdo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectHistory = (historyItem: LearningPathHistory) => {
    setPath(historyItem.path);
    setMindMapData(null);
    setCompletedLessons(historyItem.completedLessons);
    setIsHistoryOpen(false);
  };

  const handleCompleteLesson = (lessonXp: number) => {
    if (activeLesson && !completedLessons.includes(activeLesson.id)) {
      setCompletedLessons(prev => [...prev, activeLesson.id]);
      setXp(prev => prev + lessonXp);
      // Incrementar streak se completar primeira lição do dia (simplificado)
      setStreak(prev => (prev === 0 ? 1 : prev));
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg font-sans selection:bg-natural-primary/20 antialiased">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar Navigation */}
        <aside className="lg:w-72 lg:fixed lg:h-full bg-white border-b lg:border-r border-natural-border p-8 flex lg:flex-col z-40">
          <div className="flex items-center gap-4 lg:mb-12">
            <div className="w-12 h-12 bg-natural-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-natural-primary/20 font-black text-2xl">
              E
            </div>
            <div>
              <h1 className="text-xl font-black text-natural-title tracking-tighter leading-none">EduPath</h1>
              <p className="text-[10px] font-black text-natural-primary uppercase tracking-widest mt-1">Learning AI</p>
            </div>
          </div>

          <nav className="hidden lg:flex flex-col gap-3 flex-1">
             <button 
              onClick={() => { setPath(null); setIsHistoryOpen(false); }}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all group",
                !path && !isHistoryOpen ? "bg-natural-primary text-white shadow-xl shadow-natural-primary/20" : "text-natural-muted hover:bg-natural-border-light"
              )}
             >
                <Sparkles className={cn("w-5 h-5", !path && !isHistoryOpen ? "text-white" : "text-natural-primary")} />
                <span>Início</span>
             </button>

             <button 
              onClick={() => { setIsHistoryOpen(true); setActiveLesson(null); }}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all group mt-1",
                isHistoryOpen ? "bg-natural-primary text-white shadow-xl shadow-natural-primary/20" : "text-natural-muted hover:bg-natural-border-light"
              )}
             >
                <History className={cn("w-5 h-5", isHistoryOpen ? "text-white" : "text-natural-primary")} />
                <span>Suas Trilhas</span>
             </button>
             
             {path && (
               <>
                 <button 
                  onClick={() => setIsFlashcardsOpen(true)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all group text-natural-muted hover:bg-natural-border-light mt-1"
                 >
                    <Layers className="w-5 h-5 text-natural-accent" />
                    <span>Flashcards</span>
                 </button>

                 <button 
                  onClick={async () => {
                    if (mindMapData) {
                      // Already generated, just open (handled by state)
                    } else {
                      setIsMindMapLoading(true);
                      try {
                        const allContent = path.units.flatMap(u => u.lessons.map(l => l.fullContent)).join('\n');
                        const map = await generateMindMap(path.subject, allContent);
                        setMindMapData(map);
                      } catch (err) {
                        alert("Não foi possível gerar o mapa mental agora.");
                      } finally {
                        setIsMindMapLoading(false);
                      }
                    }
                  }}
                  disabled={isMindMapLoading}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all group text-natural-muted hover:bg-natural-border-light mt-1 disabled:opacity-50"
                 >
                    <Share2 className={cn("w-5 h-5 text-natural-primary", isMindMapLoading && "animate-pulse")} />
                    <span>{isMindMapLoading ? "Gerando..." : "Mapa Mental"}</span>
                 </button>
               </>
             )}
             
             <div className="mt-8 mb-4 px-5 text-[10px] font-black text-natural-muted uppercase tracking-[0.2em]">Seu Progresso</div>
             
             <div className="flex items-center gap-4 px-5 py-4 bg-natural-bg rounded-2xl border border-natural-border shadow-sm">
                <div className="w-10 h-10 bg-natural-accent/10 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-natural-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-natural-muted leading-none">Pontuação</p>
                  <p className="font-black text-natural-title text-sm">{xp} XP</p>
                </div>
             </div>

             <div className="flex items-center gap-4 px-5 py-4 bg-natural-bg rounded-2xl border border-natural-border shadow-sm mt-2">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-natural-muted leading-none">Sequência</p>
                  <p className="font-black text-natural-title text-sm">{streak} Dias</p>
                </div>
             </div>
          </nav>

          <div className="mt-auto hidden lg:block p-4 bg-natural-bg rounded-2xl border border-natural-border">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mascot-bounce shadow-sm overflow-hidden p-1">
                 <img src={MASCOT_IMAGE} alt="Mascote" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[11px] font-black text-natural-title">Dica do Edu</span>
                 <span className="text-[10px] font-bold text-natural-muted">Estude 15 min hoje!</span>
               </div>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 bg-natural-bg natural-dots min-h-screen">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
            <AnimatePresence mode="wait">
              {isHistoryOpen ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 bg-natural-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-natural-primary/20">
                        <History className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-natural-title tracking-tight leading-tight">Suas Trilhas</h2>
                        <p className="text-sm font-bold text-natural-muted">Histórico de aprendizado salvo localmente</p>
                     </div>
                  </div>

                  {history.length === 0 ? (
                    <div className="bg-white p-12 rounded-[40px] border-4 border-natural-border shadow-sm text-center">
                      <div className="w-24 h-24 bg-natural-bg rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="w-12 h-12 text-natural-border" />
                      </div>
                      <h3 className="text-xl font-black text-natural-title mb-2">Nenhuma trilha ainda</h3>
                      <p className="text-natural-muted font-bold mb-8">Crie sua primeira trilha agora mesmo!</p>
                      <button 
                        onClick={() => { setIsHistoryOpen(false); setPath(null); }}
                        className="bg-natural-primary text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-natural-primary/20 hover:scale-105"
                      >
                        Começar Agora
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {history.map((item) => (
                        <button
                          key={item.path.id || item.lastAccessed}
                          onClick={() => handleSelectHistory(item)}
                          className="group bg-white p-6 rounded-[32px] border-4 border-natural-border shadow-sm flex items-center gap-6 text-left transition-all hover:border-natural-primary hover:-translate-y-1"
                        >
                          <div className="w-16 h-16 bg-natural-bg rounded-2xl flex items-center justify-center group-hover:bg-natural-primary/10 transition-colors">
                            <BookOpen className="w-8 h-8 text-natural-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-natural-title leading-tight mb-1 group-hover:text-natural-primary transition-colors">{item.path.subject}</h3>
                            <div className="flex items-center gap-4 text-[11px] font-bold text-natural-muted uppercase tracking-wider">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-natural-bg rounded-lg border border-natural-border">
                                {item.path.units.reduce((acc, u) => acc + u.lessons.length, 0)} Lições
                              </span>
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-natural-bg rounded-lg border border-natural-border">
                                {Math.round((item.completedLessons.length / item.path.units.reduce((acc, u) => acc + u.lessons.length, 0)) * 100)}% Concluído
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-natural-border group-hover:text-natural-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : !path ? (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center text-center space-y-12 py-12"
                >
                  <div className="relative mascot-bounce">
                    <div className="w-44 h-44 bg-white rounded-[44px] shadow-2xl border-4 border-natural-border flex items-center justify-center p-4 overflow-hidden">
                      <img src={MASCOT_IMAGE} alt="Edu" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-natural-accent text-white px-5 py-2 rounded-2xl text-[12px] font-black shadow-xl border-4 border-natural-bg rotate-12">OI!</div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-5xl lg:text-7xl font-black text-natural-title leading-tight tracking-tighter">
                      Aprenda sem <br />
                      <span className="text-natural-primary">esforço, só com a IA.</span>
                    </h2>
                    <p className="text-lg lg:text-xl text-natural-muted font-bold max-w-2xl mx-auto leading-relaxed">
                      Cole um link do YouTube ou envie um PDF e veja a mágica acontecer. <br className="hidden lg:block"/>
                      Trilhas personalizadas em segundos.
                    </p>
                  </div>

                  <InputZone onProcess={handleProcessContent} isProcessing={isProcessing} />
                </motion.div>
              ) : (
                <motion.div
                  key="path"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-12"
                >
                  <div className="bg-white p-8 rounded-[40px] border-4 border-natural-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                     <div className="flex-1">
                        <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] mb-2 block">Assunto da Trilha</span>
                        <h2 className="text-3xl font-black text-natural-title tracking-tight leading-tight">{path.subject}</h2>
                     </div>

                     <div className="flex items-center gap-6 border-natural-border md:border-l-2 md:pl-8">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest leading-none mb-1">Seu Progresso</p>
                            <p className="text-2xl font-black text-natural-primary">{Math.round((completedLessons.length / path.units.reduce((acc, u) => acc + u.lessons.length, 0)) * 100)}%</p>
                        </div>
                        <div className="w-32 h-5 bg-natural-border-light rounded-full overflow-hidden border-2 border-natural-border p-1">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedLessons.length / path.units.reduce((acc, u) => acc + u.lessons.length, 0)) * 100}%` }}
                                className="h-full bg-natural-primary rounded-full"
                            />
                        </div>
                     </div>
                  </div>

                  <PathMap 
                    path={path} 
                    completedLessons={completedLessons} 
                    onLessonClick={setActiveLesson} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {activeLesson && (
          <LessonModal 
            lesson={activeLesson}
            onClose={() => setActiveLesson(null)}
            onComplete={handleCompleteLesson}
          />
        )}

        {isFlashcardsOpen && path && (
          <FlashcardsManager 
            subject={path.subject}
            onClose={() => setIsFlashcardsOpen(false)}
          />
        )}

        {mindMapData && (
          <MindMap 
            data={mindMapData}
            onClose={() => setMindMapData(null)}
          />
        )}

        {path && (
          <MentorChat 
            context={path.units.flatMap(u => u.lessons.map(l => l.fullContent)).join('\n')} 
          />
        )}
      </AnimatePresence>

      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
         <div className="bg-natural-surface/90 backdrop-blur-md text-natural-title px-6 py-3 rounded-2xl shadow-xl flex items-center gap-6 pointer-events-auto border-2 border-natural-border">
            <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-natural-primary" />
                <span className="text-xs font-black uppercase tracking-tighter italic">Lvl 1 - Iniciante</span>
            </div>
            <div className="w-1 h-1 bg-natural-border rounded-full" />
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-natural-muted" />
                <span className="text-xs font-black uppercase tracking-tighter italic">Usuário</span>
            </div>
         </div>
      </footer>
    </div>
  );
}

