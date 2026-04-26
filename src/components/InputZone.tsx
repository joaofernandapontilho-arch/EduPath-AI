import React, { useState, useRef } from 'react';
import { Youtube, FileText, Send, Sparkles, Loader2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { extractTextFromPDF } from '../lib/pdfUtils';
import { MASCOT_IMAGE } from '../constants';
import { cn } from '../lib/utils';

interface InputZoneProps {
  onProcess: (content: string, type: 'text' | 'pdf' | 'youtube') => Promise<void>;
  isProcessing: boolean;
}

export function InputZone({ onProcess, isProcessing }: InputZoneProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'youtube' | 'pdf'>('youtube');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && activeTab !== 'pdf') return;
    await onProcess(inputValue, activeTab);
    setInputValue('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await extractTextFromPDF(file);
        await onProcess(text, 'pdf');
      } catch (err) {
        alert('Erro ao ler PDF. Certifique-se que é um arquivo válido.');
      }
    }
  };

  const tabs = [
    { id: 'youtube', icon: Youtube, label: 'YouTube', placeholder: 'Cole o link do vídeo...' },
    { id: 'text', icon: Send, label: 'Texto', placeholder: 'Cole suas anotações...' },
    { id: 'pdf', icon: FileText, label: 'PDF', placeholder: 'Seu arquivo PDF...' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-[40px] shadow-2xl shadow-natural-primary/5 border-4 border-natural-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b-4 border-natural-border bg-natural-border-light p-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-[24px] font-black text-sm transition-all uppercase tracking-tighter",
                activeTab === tab.id 
                  ? "bg-white text-natural-primary shadow-md" 
                  : "text-natural-muted hover:text-natural-title"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-natural-primary" : "text-natural-muted")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-8">
           {activeTab === 'pdf' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 flex flex-col items-center justify-center border-4 border-dashed border-natural-border bg-natural-bg/20 rounded-3xl cursor-pointer hover:bg-natural-bg/50 transition-all group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform overflow-hidden p-2">
                  <img src={MASCOT_IMAGE} alt="PDF" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <p className="text-sm font-black text-natural-title uppercase tracking-tighter">Escolher Arquivo PDF</p>
                <p className="text-[10px] text-natural-muted mt-2 font-bold uppercase tracking-widest leading-none">Max 10MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden" 
                />
              </div>
           ) : (
             <form onSubmit={handleSubmit} className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={tabs.find(t => t.id === activeTab)?.placeholder}
                  className="w-full h-36 bg-transparent text-natural-title placeholder:text-natural-muted font-bold text-lg resize-none focus:outline-none"
                  disabled={isProcessing}
                />
                <div className="absolute bottom-0 right-0 p-1">
                   <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!inputValue.trim() || isProcessing}
                    className={cn(
                      "px-8 py-5 rounded-3xl font-black text-lg flex items-center gap-3 transition-all shadow-xl",
                      inputValue.trim() && !isProcessing
                        ? "bg-natural-primary text-white hover:bg-natural-primary-dark shadow-natural-primary/20"
                        : "bg-natural-border-light text-natural-muted cursor-not-allowed"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        CRIANDO...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        CRIAR
                      </>
                    )}
                  </motion.button>
                </div>
             </form>
           )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 opacity-30 grayscale transition-all duration-500">
        <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em]">IA Power</p>
        <div className="w-1 h-1 bg-natural-muted rounded-full" />
        <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em]">Game Based</p>
        <div className="w-1 h-1 bg-natural-muted rounded-full" />
        <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em]">Safe & Fast</p>
      </div>
    </div>
  );
}
