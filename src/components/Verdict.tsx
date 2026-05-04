import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Share2, RotateCcw } from 'lucide-react';
import { type JudgeVerdict } from '../types';
import html2canvas from 'html2canvas';

interface VerdictProps {
  verdict: JudgeVerdict;
  onRestart: () => void;
}

export default function Verdict({ verdict, onRestart }: VerdictProps) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const shareVerdict = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0A0B',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `verdict-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const metrics: { key: keyof JudgeVerdict['funes']; label: string }[] = [
    { key: 'specificity', label: t('verdict.rubric.specificity') },
    { key: 'generalization', label: t('verdict.rubric.generalization') },
    { key: 'coherence', label: t('verdict.rubric.coherence') },
    { key: 'understanding', label: t('verdict.rubric.understanding') },
  ];

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background">
      <div
        ref={cardRef}
        className="relative max-w-4xl w-full aspect-video bg-background border border-zinc-900 p-12 flex flex-col items-center justify-between overflow-hidden"
      >
        {/* Grain Overlay for Card */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")' }}
        ></div>

        {/* Top: Rubric */}
        <div className="grid grid-cols-2 gap-24 w-full">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-funes-red font-sans">Funes</p>
            {metrics.map((m) => (
              <div
                key={m.key}
                className="flex justify-between items-center border-b border-funes-red/20 pb-1"
              >
                <span className="text-[10px] text-zinc-500 font-sans">{m.label}</span>
                <span className="font-mono text-xs text-funes-red">{verdict.funes[m.key]}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4 text-right">
            <p className="text-[10px] uppercase tracking-widest text-miras-blue font-sans">MIRAS</p>
            {metrics.map((m) => (
              <div
                key={m.key}
                className="flex justify-between items-center border-b border-miras-blue/20 pb-1 flex-row-reverse"
              >
                <span className="text-[10px] text-zinc-500 font-sans">{m.label}</span>
                <span className="font-mono text-xs text-miras-blue">{verdict.miras[m.key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: The Score Argument */}
        <div className="flex items-center justify-center gap-16 md:gap-32 py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            className="text-7xl md:text-9xl font-serif text-funes-red"
          >
            {verdict.funes.understanding}
          </motion.div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 3, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-8xl md:text-9xl font-serif text-miras-blue"
          >
            {verdict.miras.understanding}
          </motion.div>
        </div>

        {/* Bottom: The Verdict Statement */}
        <div className="text-center space-y-2">
          <p className="text-xl md:text-2xl font-serif text-bloom-white italic">
            {verdict.verdict}
          </p>
          <div className="pt-4 space-y-1">
            <p className="text-lg font-serif text-zinc-500">Pensar es olvidar.</p>
            {i18n.language !== 'es' && (
              <p className="text-[10px] text-zinc-700 font-sans italic">To think is to forget.</p>
            )}
          </div>
        </div>

        {/* QR Placeholder for Export only (mocked with a div for now) */}
        <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none hidden group-export:block">
          <div className="w-12 h-12 border border-zinc-500 flex items-center justify-center text-[8px] text-center">
            QR
            <br />
            CORE
          </div>
        </div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="flex gap-4 mt-12"
      >
        <button
          onClick={shareVerdict}
          className="flex items-center gap-2 px-6 py-3 border border-zinc-800 text-zinc-400 hover:text-bloom-white hover:border-zinc-500 transition-all font-sans text-xs uppercase tracking-widest"
        >
          <Share2 size={14} />
          {t('verdict.share')}
        </button>
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 border border-zinc-800 text-zinc-400 hover:text-bloom-white hover:border-zinc-500 transition-all font-sans text-xs uppercase tracking-widest"
        >
          <RotateCcw size={14} />
          {t('verdict.restart')}
        </button>
      </motion.div>
    </div>
  );
}
