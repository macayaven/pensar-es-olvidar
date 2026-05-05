import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { hasUsableApiKey, setApiKey } from "../geminiService";

interface PrologueProps {
  onBegin: () => void;
}

export default function Prologue({ onBegin }: PrologueProps) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<
    "quote" | "intro" | "ready" | "missing_key"
  >("quote");
  const [displayQuote, setDisplayQuote] = useState("");
  const [displayIntro, setDisplayIntro] = useState("");
  const [tempKey, setTempKey] = useState("");

  const hasKey =
    hasUsableApiKey() || (tempKey.startsWith("AIza") && tempKey.length > 20);

  const spanishQuote =
    "Pensar es olvidar diferencias, es generalizar, abstraer.";
  const translatedQuote = t("prologue.quote");
  const translatedIntro = t("prologue.intro");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayQuote(spanishQuote.slice(0, index + 1));
      index++;
      if (index >= spanishQuote.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("intro"), 1000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === "intro") {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayIntro(translatedIntro.slice(0, index + 1));
        index++;
        if (index >= translatedIntro.length) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase(hasKey ? "ready" : "missing_key");
          }, 500);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [phase, translatedIntro, hasKey]);

  useEffect(() => {
    if (phase === "missing_key" && hasKey) {
      setPhase("ready");
    }
  }, [hasKey, phase]);

  const handleBegin = () => {
    if (tempKey && hasKey) {
      setApiKey(tempKey);
    }
    onBegin();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 pt-16 pb-12 text-center"
    >
      <div className="space-y-6 sm:space-y-8 w-full">
        <div className="space-y-4">
          <h1 className="prologue-quote mx-auto min-h-[5.6rem] max-w-4xl font-serif text-[clamp(2.2rem,6vw,4.25rem)] leading-[1.02] text-bloom-white sm:min-h-[7rem]">
            <span className="relative z-10 inline text-bloom-white">
              {displayQuote}
            </span>
            {phase === "quote" && displayQuote.length > 0 && (
              <span className="relative z-10 inline-block animate-pulse text-bloom-white">
                |
              </span>
            )}
          </h1>
          {i18n.language !== "es" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: phase !== "quote" ? 0.6 : 0 }}
              className="text-base sm:text-lg text-zinc-400 font-sans italic"
            >
              {translatedQuote}
            </motion.p>
          )}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== "quote" ? 0.4 : 0 }}
            className="text-sm text-zinc-500 font-sans"
          >
            {t("prologue.attribution")}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase !== "quote" ? 1 : 0 }}
          className="pt-4 sm:pt-8 min-h-16 flex items-center justify-center"
        >
          <p className="text-sm sm:text-base text-zinc-400 font-sans opacity-65 max-w-2xl">
            {displayIntro}
            {phase === "intro" && <span className="animate-pulse">|</span>}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "ready" && (
            <motion.div
              key="ready-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 pt-4"
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-zinc-600 font-sans">
                {t("prologue.instruction")}
              </p>
              <button
                id="begin-button"
                onClick={handleBegin}
                className="px-12 py-4 border border-zinc-800 text-bloom-white hover:border-zinc-500 hover:bg-zinc-900 transition-all font-sans tracking-widest uppercase text-xs"
              >
                {t("prologue.begin")}
              </button>
            </motion.div>
          )}

          {phase === "missing_key" && (
            <motion.div
              key="missing-key-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-8 max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left shadow-2xl backdrop-blur-xl"
            >
              <h3 className="mb-2 font-serif text-xl tracking-wide text-bloom-white">
                Welcome
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-zinc-400">
                To experience this piece, please provide your Gemini API key. In
                Google AI Studio, ensure your key is set in the <b>Secrets</b>{" "}
                menu. For local deployments, set the <code>GEMINI_API_KEY</code>{" "}
                environment variable.
              </p>
              <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                If you are viewing a personal demo, you may paste a temporary
                key below. It will only be used for this session and never
                stored.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value.trim())}
                  className="flex-1 rounded-lg border border-zinc-800 bg-black/50 px-4 py-2 font-mono text-sm text-zinc-300 placeholder-zinc-700 outline-none focus:border-zinc-500 focus:bg-zinc-900"
                />
                <button
                  onClick={handleBegin}
                  disabled={!hasKey}
                  className="rounded-lg bg-zinc-800 px-4 py-2 font-sans text-xs uppercase tracking-widest text-bloom-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800"
                >
                  Start
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
