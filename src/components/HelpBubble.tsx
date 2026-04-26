import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { explainSimply } from '../services/geminiService';
import { MASCOT_IMAGE } from '../constants';
import { cn } from '../lib/utils';

interface HelpBubbleProps {
  content: string;
  unitTitle: string;
}

export function HelpBubble({ content, unitTitle }: HelpBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    if (!explanation) {
      setIsLoading(true);
      try {
        const text = await explainSimply(content);
        setExplanation(text);
      } catch (err) {
        setExplanation("Ops, tive um probleminha. Tente de novo!");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-natural-border text-natural-muted hover:text-natural-primary hover:border-natural-primary rounded-full transition-all group z-10"
      >
        <HelpCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Não entendeu?</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-natural-title/30 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-[32px] shadow-2xl border-4 border-natural-border p-8 flex flex-col overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-6 shrink-0">
                <div className="w-16 h-16 bg-natural-border-light rounded-2xl flex items-center justify-center mascot-bounce p-2 shrink-0 border-2 border-natural-border overflow-hidden">
                  <img src={MASCOT_IMAGE} alt="Edu" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-natural-title leading-tight">Edu explica:</h4>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mt-1">{unitTitle}</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="ml-auto p-2 hover:bg-natural-border-light rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-natural-muted" />
                </button>
              </div>

              <div className="relative flex-1 overflow-y-auto custom-scrollbar pr-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 text-natural-primary animate-spin" />
                    <p className="text-[10px] font-black text-natural-primary uppercase tracking-[0.2em]">Pensando em algo simples...</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-slate max-w-none text-natural-title font-medium text-base leading-relaxed markdown-body"
                  >
                    <Markdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {explanation}
                    </Markdown>
                  </motion.div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t-2 border-natural-border-light flex justify-end shrink-0">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-natural-border-light text-natural-title font-black text-xs rounded-xl hover:bg-natural-border transition-all uppercase tracking-widest"
                >
                  Entendi!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
