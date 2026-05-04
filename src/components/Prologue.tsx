import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface PrologueProps {
  onBegin: () => void;
}

export default function Prologue({ onBegin }: PrologueProps) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<'quote' | 'intro' | 'ready'>('quote');
  const [displayQuote, setDisplayQuote] = useState('');
  const [displayIntro, setDisplayIntro] = useState('');

  const spanishQuote = "Pensar es olvidar diferencias, es generalizar, abstraer.";
  const translatedQuote = t('prologue.quote');
  const translatedIntro = t('prologue.intro');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayQuote(spanishQuote.slice(0, index + 1));
      index++;
      if (index >= spanishQuote.length) {
        clearInterval(interval);
        setTimeout(() => setPhase('intro'), 1000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === 'intro') {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayIntro(translatedIntro.slice(0, index + 1));
        index++;
        if (index >= translatedIntro.length) {
          clearInterval(interval);
          setTimeout(() => setPhase('ready'), 500);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [phase, translatedIntro]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-6 text-center"
    >
      <div className="space-y-8 w-full">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-serif text-bloom-white leading-tight">
            {displayQuote}
            {phase === 'quote' && <span className="animate-pulse">|</span>}
          </h1>
          {i18n.language !== 'es' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: phase !== 'quote' ? 0.6 : 0 }}
              className="text-lg text-zinc-400 font-sans italic"
            >
              {translatedQuote}
            </motion.p>
          )}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== 'quote' ? 0.4 : 0 }}
            className="text-sm text-zinc-500 font-sans"
          >
            {t('prologue.attribution')}
          </motion.p>
        </div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: phase !== 'quote' ? 1 : 0 }}
           className="pt-8 h-12 flex items-center justify-center"
        >
          <p className="text-sm text-zinc-400 font-sans opacity-60">
             {displayIntro}
             {phase === 'intro' && <span className="animate-pulse">|</span>}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'ready' ? 1 : 0 }}
          className="space-y-6 pt-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 font-sans">
            {t('prologue.instruction')}
          </p>
          <button
            id="begin-button"
            onClick={onBegin}
            className="px-12 py-4 border border-zinc-800 text-bloom-white hover:border-zinc-500 hover:bg-zinc-900 transition-all font-sans tracking-widest uppercase text-xs"
          >
            {t('prologue.begin')}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
