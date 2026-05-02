import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Scene, FunesEntry } from '../types';

interface ReelProps {
  scenes: Scene[];
  onCorrectClick: (entry: FunesEntry, scene: Scene) => void;
  onComplete: () => void;
  funesMemory: FunesEntry[];
  mirasMemory: string;
}

export default function Reel({ scenes, onCorrectClick, onComplete, funesMemory, mirasMemory }: ReelProps) {
  const { t } = useTranslation();
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [bloom, setBloom] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const sceneStartTimeRef = useRef(Date.now());

  const currentScene = scenes[currentSceneIndex];

  useEffect(() => {
    sceneStartTimeRef.current = Date.now();
    const timer = setTimeout(() => {
      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }, currentScene.duration_ms);

    return () => clearTimeout(timer);
  }, [currentSceneIndex, scenes, onComplete]);

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check hit
    const dist = Math.sqrt(
      Math.pow(x - currentScene.digit_position.x_pct, 2) + 
      Math.pow(y - currentScene.digit_position.y_pct, 2)
    );

    if (dist < 10) { // Tolerant hit zone
      setBloom(true);
      setTimeout(() => setBloom(false), 400);
      
      onCorrectClick({
        timestamp: Date.now() - startTime,
        scene_id: currentScene.id,
        digit: currentScene.digit,
        click_xy: { x, y },
        reaction_ms: Date.now() - sceneStartTimeRef.current
      }, currentScene);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* LEFT RAIL - FUNES */}
      <div className="w-[20%] border-r border-zinc-900 bg-background/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-900">
          <p className="text-[10px] uppercase tracking-widest text-funes-red font-sans font-medium">Funes</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 funes-scroll">
          <AnimatePresence mode="popLayout">
            {funesMemory.map((entry, i) => (
              <motion.div
                key={`${entry.timestamp}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1 - (i * 0.05), x: 0 }}
                className="font-mono text-[10px] text-funes-red/80 break-all leading-none"
              >
                [{entry.timestamp}ms] scene:{entry.scene_id} digit:{entry.digit} pos:({Math.round(entry.click_xy.x)},{Math.round(entry.click_xy.y)}) react:{entry.reaction_ms}ms
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* CENTER - REEL */}
      <div className="relative flex-1 bg-black overflow-hidden cursor-crosshair" onClick={handleSceneClick}>
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
              className="absolute font-serif select-none pointer-events-none"
              style={{
                left: `${currentScene.digit_position.x_pct}%`,
                top: `${currentScene.digit_position.y_pct}%`,
                fontSize: `${currentScene.digit_size_px}px`,
                color: currentScene.digit_color,
                transform: 'translate(-50%, -50%)',
                opacity: 0.6
              }}
            >
              {currentScene.digit}
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/20 italic font-serif">
              {currentScene.caption}
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
              className="absolute inset-0 bg-bloom-white z-50 flex items-center justify-center mix-blend-screen"
            >
              <span className="text-[20vh] font-serif text-background">{currentScene.digit}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT RAIL - MIRAS */}
      <div className="w-[20%] border-l border-zinc-900 bg-background/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-900">
          <p className="text-[10px] uppercase tracking-widest text-miras-blue font-sans font-medium">MIRAS</p>
        </div>
        <div className="flex-1 p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={mirasMemory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-sm text-miras-blue leading-relaxed text-justify"
            >
              {mirasMemory || '...'}
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-6 left-6 right-6">
             <p className="text-[10px] text-zinc-600 font-sans">{t('reel.miras_caption')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
