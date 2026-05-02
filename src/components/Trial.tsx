import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TrialRound } from '../types';

interface TrialProps {
  rounds: TrialRound[];
  currentRoundIndex: number;
}

export default function Trial({ rounds, currentRoundIndex }: TrialProps) {
  const { t } = useTranslation();

  // currentRoundIndex is the number of rounds completed/in-progress.
  // App.tsx updates rounds array as they complete.
  // We want to show the one being currently "processed" or the last one if all done.
  const displayIndex = Math.min(currentRoundIndex, 3);
  const currentRound = rounds[displayIndex];

  return (
    <div className="flex h-full w-full bg-background">
      {/* LEFT RAIL - FUNES ANSWERS */}
      <div className="w-[30%] border-r border-zinc-900 flex flex-col pt-20">
        <div className="px-8 space-y-6">
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

        <h2 className="text-3xl font-serif text-bloom-white text-center italic max-w-xl">
          {currentRound?.question || '...'}
        </h2>

        {!currentRound && (
          <div className="mt-8 text-[10px] text-zinc-700 animate-pulse font-sans">
            Interrogating memories...
          </div>
        )}
      </div>

      {/* RIGHT RAIL - MIRAS ANSWERS */}
      <div className="w-[30%] border-l border-zinc-900 flex flex-col pt-20">
        <div className="px-8 space-y-6">
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
