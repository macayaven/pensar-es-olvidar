import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Scene, FunesEntry } from '../types';

interface ReelProps {
  scenes: Scene[];
  onPerceive: (scene: Scene) => Promise<void>;
  onComplete: () => void;
  funesMemory: FunesEntry[];
  mirasMemory: string;
  mirasPreviousMemory: string;
  mirasHistory: string[];
  isRewritingMiras: boolean;
}

export default function Reel({ scenes, onPerceive, onComplete, funesMemory, mirasMemory, mirasPreviousMemory, mirasHistory, isRewritingMiras }: ReelProps) {
  const { t } = useTranslation();
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [bloom, setBloom] = useState(false);
  const [perceiving, setPerceiving] = useState(false);

  const currentScene = scenes[currentSceneIndex];

  const onPerceiveRef = useRef(onPerceive);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onPerceiveRef.current = onPerceive;
    onCompleteRef.current = onComplete;
  }, [onPerceive, onComplete]);

  useEffect(() => {
    let active = true;
    setPerceiving(false);

    const runScene = async () => {
      // 1. Let scene settle briefly
      await new Promise(r => setTimeout(r, 800));
      if (!active) return;
      
      // 2. Automated perception flash
      setBloom(true);
      setPerceiving(true);
      setTimeout(() => setBloom(false), 400);
      
      // 3. Process perception
      await onPerceiveRef.current(currentScene);
      if (!active) return;
      
      // 4. Wait for processing to complete visually
      await new Promise(r => setTimeout(r, 3500));
      if (!active) return;
      
      // 5. Advance
      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
      } else {
        onCompleteRef.current();
      }
    };
    
    runScene();
    return () => { active = false; };
  }, [currentSceneIndex, scenes]);

  return (
    <div className="flex h-full w-full">
      {/* LEFT RAIL - FUNES */}
      <div className="w-[35%] border-r border-zinc-900 bg-background/50 flex flex-col overflow-hidden backdrop-blur-md relative z-20">
        <div className="p-4 border-b border-zinc-900 sticky top-0 z-10 bg-background/90 backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-widest text-funes-red opacity-70" style={{ fontVariant: 'small-caps' }}>
            {t('reel.funes_header')}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 funes-scroll relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-funes-red/20 -z-10" />
          <AnimatePresence mode="popLayout">
            {funesMemory.map((entry, i) => (
              <motion.div
                key={`${entry.date}-${entry.time}-${i}`}
                initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(255,248,231,1)' }}
                animate={{ opacity: 1 - (i * 0.05), x: 0, backgroundColor: 'rgba(255,248,231,0)' }}
                transition={{ backgroundColor: { duration: 0.8 } }}
                className="font-mono text-xs text-funes-red/80 break-words leading-tight p-2 pl-6 rounded-sm relative"
              >
                <div className="absolute left-[0.25rem] mt-1 w-2 h-2 rounded-full bg-funes-red/60" />
                "{t(entry.caption, entry.caption as any)}" — digit {entry.digit} perceived on {entry.date} at {entry.time}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* CENTER - REEL */}
      <div className={`relative flex-1 bg-black overflow-hidden select-none cursor-default`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: currentScene.background_gradient }}
          >
            <div 
              className="absolute font-serif select-none pointer-events-none drop-shadow-2xl"
              style={{
                left: `${currentScene.digit_position.x_pct}%`,
                top: `${currentScene.digit_position.y_pct}%`,
                fontSize: `${currentScene.digit_size_px * 5}px`,
                color: currentScene.digit_color,
                transform: 'translate(-50%, -50%)',
                opacity: 0.95
              }}
            >
              {currentScene.digit}
            </div>
            
            <AnimatePresence>
              {/* point removed */}
            </AnimatePresence>
            
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-2xl md:text-3xl lg:text-4xl text-white/80 italic font-serif text-center w-[120%] px-4 drop-shadow-2xl leading-tight mix-blend-screen">
              {t(currentScene.caption, currentScene.caption as any)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bloom Effect */}
        <AnimatePresence>
          {bloom && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bloom-white z-50 flex items-center justify-center mix-blend-screen pointer-events-none"
            >
              <span className="text-[20vh] font-serif text-background">{currentScene.digit}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT RAIL - MIRAS */}
      <div className="w-[35%] border-l border-zinc-900 bg-background/50 flex flex-col overflow-hidden backdrop-blur-md relative z-20">
        <div className="p-4 border-b border-zinc-900 sticky top-0 z-10 bg-background/90 backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-widest text-miras-blue opacity-70" style={{ fontVariant: 'small-caps' }}>
            {t('reel.miras_header')}
          </p>
        </div>
        <div className="flex-1 p-6 relative overflow-y-auto funes-scroll">
          <div className="font-serif text-[15px] text-miras-blue leading-relaxed text-justify space-y-4 pb-20 relative">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-miras-blue/20 -z-10" />

            <AnimatePresence initial={false}>
              {mirasHistory.map((hist, i) => {
                 // Fades out the older the history is
                 const reversedIndex = mirasHistory.length - 1 - i;
                 // Don't show previously if it's currently being rewritten (it's handled below)
                 if (isRewritingMiras && reversedIndex === 0) return null;
                 
                 // Collapse anything older than 1 completely
                 if (reversedIndex > 0) return null;
                 
                 return (
                   <motion.div
                     key={`hist-${i}`}
                     initial={{ opacity: 0, height: 0, marginTop: 0 }}
                     animate={{ opacity: 0.3, height: 'auto', marginTop: 16 }}
                     exit={{ opacity: 0, height: 0, marginTop: 0, paddingBottom: 0 }}
                     className="line-through pl-6 relative overflow-hidden"
                   >
                     <div className="absolute left-[-1rem] mt-2 w-2 h-2 rounded-full bg-miras-blue/40" />
                     {hist}
                   </motion.div>
                 );
              })}
            
              {isRewritingMiras && mirasPreviousMemory && (
                <motion.div
                  key="rewriting"
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="opacity-30 line-through pl-6 relative overflow-hidden"
                >
                  <div className="absolute left-[-1rem] mt-2 w-2 h-2 rounded-full bg-miras-blue/60" />
                  {mirasPreviousMemory}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              className="text-zinc-200 pl-6 relative"
            >
              <div className="absolute left-[-1rem] mt-2 w-3 h-3 rounded-full bg-miras-blue outline outline-2 outline-offset-2 outline-miras-blue/30" />
              {mirasMemory || (!isRewritingMiras && mirasPreviousMemory ? mirasPreviousMemory : '...')}
            </motion.div>
          </div>
          
          <div className="absolute bottom-6 left-6 right-6">
             <p className="text-xs text-zinc-600 font-sans">{t('reel.miras_caption')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
