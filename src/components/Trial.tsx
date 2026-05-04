import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TrialRound, FunesEntry } from '../types';

interface TrialProps {
  rounds: TrialRound[];
  currentRoundIndex: number;
  funesMemory: FunesEntry[];
  mirasMemory: string;
  mirasHistory: string[];
}

export default function Trial({ rounds, currentRoundIndex, funesMemory, mirasMemory, mirasHistory }: TrialProps) {
  const { t } = useTranslation();
  
  // We want to show the round currently being streamed or just finished (the last item in the array).
  const displayIndex = Math.max(0, rounds.length - 1);
  const currentRound = rounds[displayIndex];

  const isFunesUsed = (entry: FunesEntry, answer: string) => {
    if (!answer) return false;
    const ansLower = answer.toLowerCase();
    const captionWord = entry.caption.split(' ')[0]?.toLowerCase() || '';
    return (
      answer.includes(entry.time) || 
      answer.includes(entry.date) || 
      (captionWord.length > 3 && ansLower.includes(captionWord)) ||
      ansLower.includes(`digit ${entry.digit}`)
    );
  };

  const getMirasHighlight = (text: string, answer: string) => {
    if (!answer || answer.length < 5) return text;
    // Just a visual effect: if Miras is answering, make the latest memory glow.
    return text;
  };

  return (
    <div className="flex h-full w-full bg-background">
        {/* LEFT RAIL - FUNES ANSWERS/MEMORY */}
      <div className="w-[35%] border-r border-zinc-900 flex flex-col relative pt-12 bg-background/50 backdrop-blur-md">
        <div className="absolute top-0 w-full p-4 border-b border-zinc-900 bg-background/90 z-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-funes-red opacity-70" style={{ fontVariant: 'small-caps' }}>
            {t('reel.funes_header')}
          </p>
        </div>

        {/* Funes Memory Readout */}
        <div className="h-1/2 overflow-y-auto p-4 border-b border-zinc-900 border-dashed funes-scroll relative bg-background/30 backdrop-blur-sm">
          <div className="space-y-1 relative z-10 w-full font-mono text-[9px] uppercase tracking-wide">
            <div className="grid grid-cols-[3fr_1fr_2fr_3fr] gap-2 pb-2 mb-2 border-b border-zinc-800 text-funes-red/30">
              <span>Artifact</span>
              <span>Value</span>
              <span>Date</span>
              <span>Timestamp</span>
            </div>
            {funesMemory.map((entry, i) => {
              const used = currentRound && isFunesUsed(entry, currentRound.funesAnswer);
              return (
                <div 
                  key={i} 
                  className={`grid grid-cols-[3fr_1fr_2fr_3fr] gap-2 items-center min-h-6 break-words leading-tight transition-all duration-500 rounded-sm
                    ${used ? 'text-funes-red bg-funes-red/10 scale-105 shadow-[0_0_15px_rgba(200,50,50,0.2)] px-2 py-1 -mx-2' : 'text-funes-red/40'}
                  `}
                >
                  <span className="truncate" title={t(entry.caption, entry.caption as any)}>"{t(entry.caption, entry.caption as any)}"</span>
                  <span className="tabular-nums">[{entry.digit}]</span>
                  <span className="tabular-nums">{entry.date}</span>
                  <span className="tabular-nums opacity-60 text-[8px]">{entry.time}</span>
                </div>
              );
            })}
          </div>
          {/* Scanning line for effect */}
          {currentRound && currentRound.funesAnswer.length > 0 && currentRound.funesAnswer.length < 50 && (
             <motion.div 
               className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-funes-red/10 to-transparent pointer-events-none"
               initial={{ top: 0 }}
               animate={{ top: '100%' }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             />
          )}
        </div>

        {/* Funes Output */}
        <div className="h-1/2 overflow-y-auto p-8 relative flex flex-col">
          <span className="text-[10px] uppercase text-zinc-600 mb-4 inline-block font-sans tracking-widest">Accessing Record</span>
          <AnimatePresence mode="wait">
            {currentRound && (
              <motion.div
                key={`funes-${displayIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs text-funes-red leading-relaxed"
              >
                {currentRound.funesAnswer}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CENTER - QUESTION */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 relative">
        <div className="absolute top-12 text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-sans">
          {t('trial.round', { round: displayIndex + 1 })}
        </div>
        
        <AnimatePresence mode="wait">
          {currentRound ? (
            <motion.h2 
              key={`q-${displayIndex}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-3xl font-serif text-bloom-white text-center italic max-w-xl"
            >
              {currentRound.question}
            </motion.h2>
          ) : (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-3xl font-serif text-bloom-white text-center italic max-w-xl"
            >
              ...
            </motion.div>
          )}
        </AnimatePresence>

        {!currentRound && (
          <div className="mt-8 text-[10px] text-zinc-700 animate-pulse font-sans">
            Interrogating memories...
          </div>
        )}
      </div>

      {/* RIGHT RAIL - MIRAS ANSWERS/MEMORY */}
      <div className="w-[35%] border-l border-zinc-900 flex flex-col relative pt-12 bg-background/50 backdrop-blur-md">
        <div className="absolute top-0 w-full p-4 border-b border-zinc-900 bg-background/90 z-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-miras-blue opacity-70" style={{ fontVariant: 'small-caps' }}>
            {t('reel.miras_header')}
          </p>
        </div>

        {/* Miras Memory Readout */}
        <div className="h-1/2 overflow-y-auto p-6 border-b border-zinc-900 border-dashed funes-scroll relative bg-background/30 backdrop-blur-sm">
          <div className="font-serif text-[13px] text-miras-blue/50 leading-relaxed text-justify space-y-4 relative z-10 w-full pl-6">
            <div className="absolute left-[8px] top-0 bottom-0 w-px bg-miras-blue/10" />
            {mirasHistory.length > 0 && (
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/80 z-10 pointer-events-none" />
                <div className="line-through opacity-20 text-[11px] max-h-24 overflow-hidden blur-[0.5px]">
                  {mirasHistory[mirasHistory.length - 1]}
                </div>
              </div>
            )}
            <div className={`transition-all duration-700 p-4 rounded-xl relative ${currentRound && currentRound.mirasAnswer.length > 5 ? 'text-miras-blue shadow-[0_0_30px_rgba(100,150,255,0.15)] bg-miras-blue/10 scale-105' : 'text-miras-blue/70 bg-miras-blue/5'}`}>
              <div className="absolute left-[-24px] top-4 w-2 h-2 rounded-full bg-miras-blue shadow-[0_0_10px_rgba(100,150,255,0.8)]" />
              {mirasMemory}
            </div>
          </div>
          {/* Scanning line for effect */}
          {currentRound && currentRound.mirasAnswer.length > 0 && currentRound.mirasAnswer.length < 50 && (
             <motion.div 
               className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-miras-blue/10 to-transparent pointer-events-none"
               initial={{ top: 0 }}
               animate={{ top: '100%' }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             />
          )}
        </div>

        {/* Miras Output */}
        <div className="h-1/2 overflow-y-auto p-8 relative flex flex-col">
          <span className="text-[10px] uppercase text-zinc-600 mb-4 inline-block font-sans tracking-widest">Synthesized Response</span>
          <AnimatePresence mode="wait">
            {currentRound && (
              <motion.div
                key={`miras-${displayIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs text-miras-blue leading-relaxed"
              >
                {currentRound.mirasAnswer}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
