import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, Sparkles, ChevronRight, RotateCcw, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { generateFlashcards, Flashcard } from '../services/geminiService';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MASCOT_IMAGE } from '../constants';
import { cn } from '../lib/utils';

interface FlashcardsManagerProps {
  subject: string;
  onClose: () => void;
}

export function FlashcardsManager({ subject, onClose }: FlashcardsManagerProps) {
  const [view, setView] = useState<'config' | 'loading' | 'study'>('config');
  const [difficulty, setDifficulty] = useState('Iniciante');
  const [count, setCount] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    setView('loading');
    try {
      const data = await generateFlashcards(subject, difficulty, count);
      setFlashcards(data);
      setView('study');
    } catch (err) {
      alert("Erro ao gerar flashcards. Tente novamente.");
      setView('config');
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
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
        className="relative bg-white w-full max-w-2xl min-h-[500px] overflow-hidden rounded-[40px] shadow-2xl flex flex-col border-4 border-natural-border"
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b-4 border-natural-border bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-natural-accent/10 rounded-2xl flex items-center justify-center text-natural-accent shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-natural-title leading-tight tracking-tight">Flashcards</h3>
              <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] mt-0.5">{subject}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-natural-border-light rounded-2xl transition-all text-natural-muted hover:text-natural-title"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'config' && (
              <motion.div 
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 mascot-bounce overflow-hidden">
                    <img src={MASCOT_IMAGE} alt="Edu" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="text-3xl font-black text-natural-title tracking-tight">Crie seus Cartões!</h2>
                  <p className="text-natural-muted font-bold leading-relaxed max-w-sm">
                    Escolha a dificuldade e a quantidade para gerar seus flashcards personalizados com IA.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Dificuldade */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest pl-2">Dificuldade</label>
                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-natural-border-light rounded-[28px] border-2 border-natural-border">
                      {['Iniciante', 'Intermediário', 'Avançado'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={cn(
                            "py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-tighter",
                            difficulty === d ? "bg-white text-natural-primary shadow-md" : "text-natural-muted hover:text-natural-title"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest pl-2">Quantidade ({count})</label>
                    <input 
                      type="range"
                      min="5"
                      max="20"
                      step="5"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full h-8 appearance-none bg-natural-border-light rounded-full border-4 border-natural-border cursor-pointer accent-natural-primary"
                    />
                    <div className="flex justify-between px-1 text-[10px] font-black text-natural-muted">
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  className="w-full py-6 bg-natural-primary text-white rounded-[28px] border-b-[8px] border-natural-primary-dark font-black text-xl hover:translate-y-[-2px] transition-all shadow-2xl active:border-b-0 active:translate-y-[4px] flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-6 h-6" />
                  GERAR FLASHCARDS
                </button>
              </motion.div>
            )}

            {view === 'loading' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center gap-6"
              >
                <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mascot-bounce shadow-inner border-4 border-natural-border overflow-hidden p-3">
                  <img src={MASCOT_IMAGE} alt="Edu" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-natural-title uppercase tracking-tighter">Preparando Cartões...</h3>
                  <div className="flex items-center justify-center gap-2 text-natural-primary font-black uppercase tracking-widest text-[10px]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando com Gemini 3
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'study' && (
              <motion.div 
                key="study"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest">Cartão {currentIndex + 1} de {flashcards.length}</p>
                  <div className="h-3 w-32 bg-natural-border-light rounded-full p-0.5 border-2 border-natural-border">
                    <div className="h-full bg-natural-primary rounded-full" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} />
                  </div>
                </div>

                {/* Card Container */}
                <div className="perspective-1000 h-64 md:h-80">
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-full preserve-3d cursor-pointer"
                  >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-white border-4 border-natural-border rounded-[40px] shadow-xl p-10 flex flex-col items-center justify-center text-center">
                       <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest mb-4">PERGUNTA</span>
                       <div className="text-2xl font-black text-natural-title leading-tight markdown-body">
                         <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                           {flashcards[currentIndex].front}
                         </Markdown>
                       </div>
                       <div className="mt-8 text-natural-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                         <RotateCcw className="w-4 h-4" /> Toque para virar
                       </div>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 backface-hidden bg-natural-primary text-white border-4 border-natural-primary-dark rounded-[40px] shadow-xl p-10 flex flex-col items-center justify-center text-center"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                       <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">RESPOSTA</span>
                       <div className="text-2xl font-black leading-tight markdown-body">
                         <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                           {flashcards[currentIndex].back}
                         </Markdown>
                       </div>
                       <div className="mt-8 text-white/80 font-black text-[10px] uppercase tracking-widest">Toque para voltar</div>
                    </div>
                  </motion.div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handlePrev}
                    className="flex-1 py-5 bg-white text-natural-title rounded-[28px] border-4 border-b-[8px] border-natural-border font-black text-lg hover:translate-y-[-2px] transition-all active:border-b-4 active:translate-y-[2px] flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                    ANTERIOR
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex-1 py-5 bg-white text-natural-title rounded-[28px] border-4 border-b-[8px] border-natural-border font-black text-lg hover:translate-y-[-2px] transition-all active:border-b-4 active:translate-y-[2px] flex items-center justify-center gap-2"
                  >
                    PRÓXIMO
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <button 
                  onClick={() => setView('config')}
                  className="w-full text-natural-muted font-black text-[10px] uppercase tracking-[0.2em] hover:text-natural-primary transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" /> Configurar Outros
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
