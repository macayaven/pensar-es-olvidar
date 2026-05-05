import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import type { Scene, FunesEntry, MirasBridge } from "../types";

interface ReelProps {
  scenes: Scene[];
  onPerceive: (scene: Scene) => Promise<void>;
  onComplete: () => void;
  funesMemory: FunesEntry[];
  mirasMemory: string;
  mirasPreviousMemory: string;
  mirasHistory: string[];
  mirasBridgeBursts: MirasBridge[];
  isRewritingMiras: boolean;
}

export default function Reel({
  scenes,
  onPerceive,
  onComplete,
  funesMemory,
  mirasMemory,
  mirasPreviousMemory,
  mirasHistory,
  mirasBridgeBursts,
  isRewritingMiras,
}: ReelProps) {
  const { t } = useTranslation();
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [bloom, setBloom] = useState(false);

  const currentScene = scenes[currentSceneIndex];
  const latestFunes = funesMemory[0];
  const priorFunes = funesMemory.slice(1, 9);
  const lastMirasGhost = isRewritingMiras
    ? mirasPreviousMemory
    : mirasHistory[mirasHistory.length - 1];

  const onPerceiveRef = useRef(onPerceive);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onPerceiveRef.current = onPerceive;
    onCompleteRef.current = onComplete;
  }, [onPerceive, onComplete]);

  useEffect(() => {
    let active = true;

    const runScene = async () => {
      await new Promise((r) => setTimeout(r, 700));
      if (!active) return;

      setBloom(true);
      window.setTimeout(() => setBloom(false), 420);

      await onPerceiveRef.current(currentScene);
      if (!active) return;

      await new Promise((r) => setTimeout(r, 2800));
      if (!active) return;

      if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex((prev) => prev + 1);
      } else {
        onCompleteRef.current();
      }
    };

    runScene();
    return () => {
      active = false;
    };
  }, [currentSceneIndex, currentScene, scenes.length]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <motion.div
        key={`scene-bg-${currentScene.id}`}
        className="absolute inset-0 opacity-70"
        style={{ background: currentScene.background_gradient }}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 0.72, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,248,231,0.09),transparent_36%),linear-gradient(90deg,rgba(184,84,80,0.18),transparent_42%,transparent_58%,rgba(107,140,174,0.18))]" />

      <div className="relative z-10 grid h-full grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_minmax(320px,460px)_1fr]">
        {/* FUNES PANEL */}
        <section className="min-h-0 border-r border-zinc-900/80 bg-background/60 backdrop-blur-xl">
          <div className="flex h-full min-h-0 flex-col">
            <RailHeader label={t("reel.funes_header")} tone="funes" />

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 funes-scroll">
              <AnimatePresence mode="wait">
                {latestFunes ? (
                  <motion.div
                    key={`${latestFunes.scene_id}-${latestFunes.time}`}
                    initial={{
                      opacity: 0,
                      y: 10,
                      backgroundColor: "rgba(255,248,231,0.38)",
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      backgroundColor: "rgba(255,248,231,0)",
                    }}
                    transition={{ duration: 0.65 }}
                    className="rounded-3xl border border-funes-red/25 bg-funes-red/10 p-5 shadow-[0_0_35px_rgba(184,84,80,0.08)]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-funes-red/55">
                        FOLIO_{funesMemory.length.toString().padStart(3, "0")}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-funes-red/55">
                        TRACE_{funesMemory.length.toString().padStart(3, "0")}
                      </p>
                    </div>
                    <p className="font-serif text-3xl leading-tight text-bloom-white">
                      "{t(latestFunes.caption, latestFunes.caption as any)}"
                    </p>
                    <div className="mt-6 flex items-end justify-between">
                      <span className="font-mono text-xs uppercase tracking-widest text-funes-red/60">
                        digit
                      </span>
                      <span className="font-serif text-8xl leading-none text-funes-red">
                        {latestFunes.digit}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex min-h-[18rem] items-center justify-center rounded-3xl border border-dashed border-funes-red/15 text-center font-mono text-[10px] uppercase tracking-[0.26em] text-funes-red/35"
                  >
                    awaiting first mark
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 space-y-3">
                {priorFunes.map((entry, i) => (
                  <motion.div
                    key={`${entry.scene_id}-${entry.time}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: Math.max(0.3, 0.78 - i * 0.06), x: 0 }}
                    className="rounded-2xl border border-funes-red/10 bg-black/20 px-4 py-3.5 font-mono text-[10px] leading-tight text-funes-red/55"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-funes-red/70">
                      <span className="tabular-nums">[{entry.digit}]</span>
                      <span className="uppercase tracking-widest text-[9px] opacity-80">
                        FOLIO_
                        {(funesMemory.length - 1 - i)
                          .toString()
                          .padStart(3, "0")}
                      </span>
                    </div>
                    <p className="font-serif text-base leading-tight text-bloom-white/70">
                      "{t(entry.caption, entry.caption as any)}"
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FACT ORBIT (CENTER) */}
        <section className="relative flex min-h-0 items-center justify-center overflow-hidden bg-black/40 py-4 lg:py-6">
          <FactOrbit scene={currentScene} facts={funesMemory} bloom={bloom} />
        </section>

        {/* MIRAS PANEL */}
        <section className="min-h-0 border-l border-zinc-900/80 bg-background/60 backdrop-blur-xl">
          <div className="flex h-full min-h-0 flex-col">
            <RailHeader label={t("reel.miras_header")} tone="miras" />
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 funes-scroll">
              <div className="relative space-y-6">
                {/* 1. Revised Memory (at the top) */}
                {mirasPreviousMemory && (
                  <div className="relative space-y-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-miras-blue/40 px-1">
                      {t("reel.labels.revised_memory")}
                    </p>
                    <div className="rounded-2xl border border-miras-blue/10 bg-miras-blue/5 p-4 font-serif text-sm leading-relaxed text-miras-blue/60 italic opacity-80">
                      {mirasPreviousMemory}
                    </div>
                  </div>
                )}

                {/* 2. Current Question (immediately below) */}
                <div className="relative space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-miras-blue/40 px-1">
                    {t("reel.labels.current_question")}
                  </p>
                  <motion.div
                    layout
                    className="relative rounded-[2rem] border border-miras-blue/25 bg-miras-blue/10 p-6 shadow-[0_0_60px_rgba(107,140,174,0.1)]"
                  >
                    <div className="absolute -left-1 top-8 h-4 w-1 rounded-full bg-miras-blue" />
                    <p className="font-serif text-2xl leading-tight text-bloom-white">
                      {mirasMemory || "..."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-miras-blue/50">
                        bounded abstraction
                      </p>
                      {isRewritingMiras && (
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="h-1.5 w-1.5 rounded-full bg-miras-blue"
                        />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* 3. Bridge Answers / Fading Bridges */}
                <div className="relative pt-2">
                  <div className="absolute left-[7px] top-0 bottom-0 w-px bg-miras-blue/10" />
                  <BridgeBursts
                    bursts={mirasBridgeBursts}
                    isActive={isRewritingMiras}
                  />
                </div>

                {/* 4. Erased Prior Trace (after bridge stack) */}
                <AnimatePresence initial={false}>
                  {lastMirasGhost && (
                    <motion.div
                      key={`miras-ghost-${mirasHistory.length}-${isRewritingMiras}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 0.3, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative overflow-hidden pl-6 pt-2"
                    >
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-miras-blue/30">
                        {t("reel.labels.erased_trace")}
                      </p>
                      <div className="rounded-xl border border-miras-blue/5 bg-black/10 p-3 font-serif text-xs leading-relaxed text-miras-blue/40 line-through">
                        {lastMirasGhost}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function RailHeader({
  label,
  tone,
}: {
  label: string;
  tone: "funes" | "miras";
}) {
  const isFunes = tone === "funes";
  return (
    <header className="shrink-0 border-b border-white/5 bg-black/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2
          className={`font-mono text-xs font-medium uppercase tracking-[0.35em] ${isFunes ? "text-funes-red" : "text-miras-blue"}`}
        >
          {label}
        </h2>
        <div
          className={`h-1 w-8 rounded-full ${isFunes ? "bg-funes-red/30" : "bg-miras-blue/30"}`}
        />
      </div>
    </header>
  );
}

function FactOrbit({
  scene,
  facts,
  bloom,
}: {
  scene: Scene;
  facts: FunesEntry[];
  bloom: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative flex aspect-square w-full max-w-[260px] items-center justify-center lg:max-w-[300px]">
      <motion.div
        animate={{
          scale: bloom ? 1.08 : 1,
          opacity: bloom ? 0.9 : 0.6,
        }}
        className="absolute inset-0 rounded-full border border-white/5 bg-gradient-to-br from-white/5 to-transparent shadow-[0_0_80px_rgba(255,255,255,0.02)]"
      />

      {/* Central Visual Artifact */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 1.1, rotate: 10 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex h-36 w-36 items-center justify-center"
        >
          <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
          <div className="relative flex flex-col items-center justify-center text-center select-none">
            <div className="font-serif text-[7rem] font-light leading-none text-bloom-white/20">
              {scene.id.replace("thr_", "").replace(/^0+/, "") || "0"}
            </div>
            <div className="mt-4 font-serif text-sm italic tracking-widest text-bloom-white/80 drop-shadow-md">
              {t(scene.caption, scene.caption as any)}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Orbiting Metadata */}
      {facts.slice(0, 5).map((f, i) => {
        const serial = (facts.length - i).toString().padStart(3, "0");
        return (
          <motion.div
            key={`${f.scene_id}-${f.time}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 - i * 0.08 }}
            className="absolute font-mono text-[8px] uppercase tracking-[0.4em] text-zinc-500"
            style={{
              transform: `rotate(${i * 72}deg) translateY(-110px) rotate(-${i * 72}deg)`,
            }}
          >
            WITNESS_{serial}
          </motion.div>
        );
      })}
    </div>
  );
}

function BridgeBursts({
  bursts,
  isActive,
}: {
  bursts: MirasBridge[];
  isActive: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="my-2 space-y-3 pl-1">
      <AnimatePresence>
        {bursts.slice(-3).map((bridge, i) => (
          <motion.div
            key={`${bridge.timestamp}`}
            initial={{ opacity: 0, x: -8, height: 0 }}
            animate={{ opacity: 1 - i * 0.25, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 10 }}
            className="group relative flex flex-col gap-1 rounded-xl border border-miras-blue/10 bg-miras-blue/5 py-2 pl-6 pr-3 shadow-sm"
          >
            <div className="absolute left-[-2px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-miras-blue shadow-[0_0_8px_rgba(107,140,174,0.5)]" />
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-miras-blue/40">
              {t("reel.labels.bridge_answer")}
            </p>
            <p className="font-serif text-[13px] leading-tight text-miras-blue/80">
              {bridge.answer}
            </p>
          </motion.div>
        ))}
        {isActive && bursts.length === 0 && (
          <div className="flex flex-col gap-2 py-4 pl-6 opacity-30">
            <div className="h-0.5 w-12 bg-miras-blue/20 animate-pulse" />
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-miras-blue/40">
              {t("reel.labels.fading_bridges")}
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
