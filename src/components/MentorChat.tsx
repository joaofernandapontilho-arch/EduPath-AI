import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, askStudyMentor } from '../services/geminiService';
import { cn } from '../lib/utils';

interface MentorChatProps {
  context: string;
}

export function MentorChat({ context }: MentorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await askStudyMentor(query, context, messages);
      const mentorMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, mentorMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Desculpe, me perdi nos meus livros aqui. Pode perguntar de novo?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isMaximized ? 'calc(100vw - 64px)' : '380px',
              height: isMaximized ? 'calc(100vh - 120px)' : '550px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-4 border-natural-border flex flex-col mb-4 overflow-hidden transition-all duration-300 ease-in-out",
              isMaximized ? "fixed inset-8 bottom-32 z-[70] m-auto" : "relative"
            )}
          >
            {/* Header */}
            <div className="p-5 bg-natural-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Mentor Edu</h3>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Online para você</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title={isMaximized ? "Restaurar" : "Maximizar"}
                >
                  {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => { setIsOpen(false); setIsMaximized(false); }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-natural-bg/10"
            >
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-natural-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-natural-primary" />
                  </div>
                  <p className="text-sm font-bold text-natural-muted leading-relaxed px-6">
                    Olá! Eu sou o Edu. Tenho o contexto de tudo o que você está estudando. O que quer saber ou praticar?
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium leading-relaxed markdown-body break-words overflow-x-hidden w-full",
                    msg.role === 'user' 
                      ? "bg-natural-primary text-white rounded-tr-none" 
                      : "bg-white border-2 border-natural-border text-natural-title rounded-tl-none shadow-sm"
                  )}>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </Markdown>
                  </div>
                  <span className="text-[9px] font-bold text-natural-muted uppercase mt-1 px-1">
                    {msg.role === 'user' ? 'Você' : 'Edu'}
                  </span>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-natural-muted px-2">
                  <Loader2 className="w-4 h-4 animate-spin text-natural-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Edu está pensando...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSend}
              className="p-4 bg-white border-t-2 border-natural-border"
            >
              <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pergunte qualquer coisa..."
                  className="w-full bg-natural-bg border-4 border-natural-border rounded-xl px-5 py-3 pr-14 text-sm font-bold focus:outline-none focus:border-natural-primary transition-all placeholder:text-natural-muted/50"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-natural-primary text-white rounded-lg disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-2xl relative group",
          isOpen ? "bg-natural-title text-white rotate-90" : "bg-natural-primary text-white hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8 group-hover:animate-bounce" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-natural-accent border-2 border-white rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
}
