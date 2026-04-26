import React from 'react';
import { motion } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, Maximize, Share2 } from 'lucide-react';
import { MindMapNode } from '../services/geminiService';

interface MindMapProps {
  data: MindMapNode;
  onClose: () => void;
}

const MapNode = ({ node, level = 0, index = 0 }: { node: MindMapNode; level?: number; index?: number }) => {
  const isRoot = level === 0;
  const isLevel1 = level === 1;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: level * 0.1 + index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`px-8 py-5 rounded-[32px] border-4 shadow-xl text-center min-w-[220px] max-w-[320px] transition-all duration-300 ${
          isRoot 
            ? 'bg-natural-primary text-white border-white/20 shadow-[0_20px_50px_-12px_rgba(34,197,94,0.4)] z-20 text-xl font-black' 
            : isLevel1
            ? 'bg-white text-natural-title border-natural-primary/30 font-black text-lg shadow-lg hover:border-natural-primary'
            : 'bg-white/90 backdrop-blur-sm text-natural-muted border-natural-border/50 font-bold text-base shadow-md hover:border-natural-muted'
        }`}
      >
        {node.label}
      </motion.div>

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-20 relative">
          {/* Vertical stem from parent */}
          <div className="w-1.5 h-20 bg-natural-border/40 rounded-full" />
          
          <div className="flex items-start gap-16 relative px-10">
             {/* Horizontal bridge connecting siblings */}
             {node.children.length > 1 && (
               <div className="absolute top-0 left-[12%] right-[12%] h-1.5 bg-natural-border/40 rounded-full" />
             )}
             
             {node.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center relative">
                   {/* Vertical dash to child */}
                   <div className="w-1.5 h-10 bg-natural-border/40 rounded-full" />
                   <MapNode node={child} level={level + 1} index={idx} />
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function MindMap({ data, onClose }: MindMapProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0C121E]/90 backdrop-blur-xl p-4 md:p-8"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#F8FAFC] w-full h-full rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.4)] border-[6px] border-white/10 flex flex-col overflow-hidden relative"
      >
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none natural-dots" />

        {/* Floating Header */}
        <div className="absolute top-10 left-10 right-10 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-6 bg-white/80 backdrop-blur-md px-10 py-6 rounded-[32px] border-4 border-natural-border shadow-2xl pointer-events-auto">
             <div className="w-16 h-16 bg-natural-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-natural-primary/30">
                <Share2 className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-natural-title tracking-tight leading-tight">Mapa Mental Dinâmico</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-natural-primary animate-pulse" />
                  <p className="text-xs font-bold text-natural-muted uppercase tracking-[0.2em]">Visualização Panorâmica</p>
                </div>
             </div>
          </div>
          
          <button 
             onClick={onClose}
             className="w-20 h-20 bg-white/80 backdrop-blur-md hover:bg-white rounded-[28px] flex items-center justify-center transition-all border-4 border-natural-border shadow-2xl hover:scale-105 active:scale-95 text-natural-title pointer-events-auto"
          >
             <X className="w-10 h-10" />
          </button>
        </div>

        {/* Navigation Indicator */}
        <div className="absolute bottom-12 left-12 z-20 hidden lg:flex items-center gap-4 bg-white/60 backdrop-blur px-6 py-4 rounded-2xl border-2 border-natural-border/30">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-natural-primary/40" />)}
          </div>
          <span className="text-xs font-black text-natural-muted uppercase tracking-widest">Scrole para zoom • Arraste para navegar</span>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden">
          <TransformWrapper
            initialScale={0.8}
            centerOnInit={true}
            minScale={0.1}
            maxScale={3}
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Embedded Controls */}
                <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-30">
                   <button 
                    onClick={() => zoomIn(0.3)}
                    className="w-16 h-16 bg-white hover:bg-natural-bg rounded-2xl shadow-2xl border-4 border-natural-border flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-0 text-natural-title"
                   >
                     <ZoomIn className="w-8 h-8" />
                   </button>
                   <button 
                    onClick={() => zoomOut(0.3)}
                    className="w-16 h-16 bg-white hover:bg-natural-bg rounded-2xl shadow-2xl border-4 border-natural-border flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-0 text-natural-title"
                   >
                     <ZoomOut className="w-8 h-8" />
                   </button>
                   <button 
                    onClick={() => resetTransform()}
                    className="w-16 h-16 bg-white hover:bg-natural-bg rounded-2xl shadow-2xl border-4 border-natural-border flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-0 text-natural-title"
                   >
                     <Maximize className="w-8 h-8" />
                   </button>
                </div>

                <TransformComponent 
                  wrapperClass="!w-full !h-full" 
                  contentClass="!min-w-full !min-h-full !flex !items-center !justify-center"
                >
                  <div className="p-[400px] min-w-[3000px] min-h-[2000px] flex items-center justify-center">
                    <MapNode node={data} />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </motion.div>
    </motion.div>
  );
}
