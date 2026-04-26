import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, Play, Star } from 'lucide-react';
import { HelpBubble } from './HelpBubble';
import { LearningPath, Lesson } from '../services/geminiService';
import { MASCOT_IMAGE } from '../constants';
import { cn } from '../lib/utils';

interface PathMapProps {
  path: LearningPath;
  completedLessons: string[];
  onLessonClick: (lesson: Lesson) => void;
}

export function PathMap({ path, completedLessons, onLessonClick }: PathMapProps) {
  return (
    <div className="flex flex-col items-center gap-24 pb-32">
      {path.units.map((unit, unitIdx) => (
        <div key={unit.id} className="w-full flex flex-col items-center">
          {/* Unit Header */}
          <div className="w-full max-w-xl bg-natural-primary p-8 rounded-[40px] mb-16 shadow-xl shadow-natural-primary/20 relative border-b-[8px] border-natural-primary-dark overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="text-white space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Unidade {unitIdx + 1}</p>
                <h3 className="text-2xl font-black tracking-tight leading-none">{unit.title}</h3>
                <p className="text-sm font-bold opacity-90 mt-1">{unit.description}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                 <Star className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </div>

          {/* Lessons Path */}
          <div className="flex flex-col items-center gap-14 relative">
            {unit.lessons.map((lesson, lessonIdx) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isLocked = lessonIdx > 0 && !completedLessons.includes(unit.lessons[lessonIdx - 1].id);
              const isActive = !isCompleted && !isLocked;

              // Alternating alignment for a "winding path" feel
              const offset = (lessonIdx % 3 - 1) * 70;

              return (
                <div 
                  key={lesson.id} 
                  className="relative group flex flex-col items-center"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  {/* Tooltip Content */}
                  <div className="absolute -top-20 bg-white px-5 py-3 rounded-3xl shadow-2xl border-4 border-natural-border opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 whitespace-nowrap -translate-y-2 group-hover:translate-y-0 scale-90 group-hover:scale-100">
                    <p className="text-sm font-black text-natural-title mb-0.5">{lesson.title}</p>
                    <p className="text-[10px] font-bold text-natural-muted uppercase tracking-wider">{lesson.shortSummary}</p>
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-natural-border rotate-45" />
                  </div>

                  <motion.button
                    whileHover={!isLocked ? { scale: 1.1, translateY: -5 } : {}}
                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                    onClick={() => !isLocked && onLessonClick(lesson)}
                    className={cn(
                      "w-20 h-20 rounded-[28px] border-b-[8px] flex items-center justify-center transition-all relative z-10 shadow-xl",
                      isCompleted 
                        ? "bg-natural-accent border-natural-accent-light text-white" 
                        : isLocked
                        ? "bg-natural-border border-natural-muted text-natural-muted/50"
                        : "bg-natural-primary border-natural-primary-dark text-white ring-[10px] ring-natural-primary/10"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-8 h-8 font-black" /> : isLocked ? <Lock className="w-8 h-8" /> : <Play className="w-8 h-8 fill-white ml-1" />}
                    
                    {isActive && (
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] px-3 py-1.5 rounded-xl font-black shadow-lg animate-bounce border-2 border-white uppercase">Começar</div>
                    )}
                  </motion.button>

                  <div className="absolute -z-0 top-full h-14 w-4 flex flex-col gap-2 items-center opacity-20 mt-2 pointer-events-none">
                     <div className="w-2 h-2 rounded-full bg-natural-muted" />
                     <div className="w-2 h-2 rounded-full bg-natural-muted" />
                     <div className="w-2 h-2 rounded-full bg-natural-muted" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="w-24 h-24 bg-white rounded-full shadow-inner border-4 border-natural-border flex items-center justify-center opacity-50 overflow-hidden p-4">
        <img src={MASCOT_IMAGE} alt="Final" className="w-full h-full object-contain grayscale" referrerPolicy="no-referrer" />
      </div>
    </div>
  );
}
