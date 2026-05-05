import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Globe } from "lucide-react";
import "./i18n/config";

import type {
  AppPhase,
  Scene,
  FunesEntry,
  TrialRound,
  TrialStage,
  JudgeVerdict,
  MirasBridge,
} from "./types";
import reelThresholds from "./data/reel-thresholds.json";
import { useAudio } from "./hooks/useAudio";
import {
  rewriteMirasMemoryStream,
  auditMemoryStream,
  judgeMemories,
  buildMirasBridge,
} from "./geminiService";

// Components
import Prologue from "./components/Prologue";
import Reel from "./components/Reel";
import Trial from "./components/Trial";
import Verdict from "./components/Verdict";

export default function App() {
  const { t, i18n } = useTranslation();
  const { playChime } = useAudio();

  const [phase, setPhase] = useState<AppPhase>("prologue");
  const [funesMemory, setFunesMemory] = useState<FunesEntry[]>([]);
  const [mirasMemory, setMirasMemory] = useState<string>("");
  const [mirasPreviousMemory, setMirasPreviousMemory] = useState<string>("");
  const [mirasHistory, setMirasHistory] = useState<string[]>([]);
  const [mirasBridgeBursts, setMirasBridgeBursts] = useState<MirasBridge[]>([]);
  const [isRewritingMiras, setIsRewritingMiras] = useState(false);
  const [trialRounds, setTrialRounds] = useState<TrialRound[]>([]);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Synchronized refs
  const appStartTimeRef = useRef<number>(0);
  const mirasMemoryRef = useRef<string>("");

  const resetViewportScroll = useCallback(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const getThemeParam = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("theme") || "thresholds";
  };
  const themeParam = getThemeParam();
  // V1 only supports thresholds
  const scenesToUse =
    themeParam === "thresholds" ? reelThresholds : reelThresholds;

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    setShowLanguagePicker(false);
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language || "en";
  }, [i18n.language]);

  useLayoutEffect(() => {
    resetViewportScroll();
  }, [phase, resetViewportScroll]);

  useEffect(() => {
    resetViewportScroll();
    const frameIds = [0, 1, 2].map(() =>
      window.requestAnimationFrame(resetViewportScroll),
    );
    const intervalId = window.setInterval(resetViewportScroll, 80);
    const timeoutIds = [120, 320, 720, 1400, 2400, 3600].map((delay) =>
      window.setTimeout(resetViewportScroll, delay),
    );
    const releaseIntervalId = window.setTimeout(
      () => window.clearInterval(intervalId),
      4200,
    );
    window.addEventListener("scroll", resetViewportScroll, { passive: true });

    return () => {
      frameIds.forEach(window.cancelAnimationFrame);
      timeoutIds.forEach(window.clearTimeout);
      window.clearTimeout(releaseIntervalId);
      window.clearInterval(intervalId);
      window.removeEventListener("scroll", resetViewportScroll);
    };
  }, [phase, resetViewportScroll]);

  const startReel = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    resetViewportScroll();
    appStartTimeRef.current = Date.now();
    setPhase("reel");
    [60, 160, 360, 760, 1260, 2060].forEach((delay) => {
      window.setTimeout(resetViewportScroll, delay);
    });
  };

  const onPerceive = useCallback(
    async (scene: Scene) => {
      playChime(scene.digit);

      const now = new Date();
      const entry: FunesEntry = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString() + "." + now.getMilliseconds(),
        scene_id: scene.id,
        caption: scene.caption,
        digit: scene.digit,
      };

      setFunesMemory((prev) => [entry, ...prev]);

      const translatedCaption = String(t(scene.caption, scene.caption as any));
      const eventDescription = `In scene "${translatedCaption}", the digit ${scene.digit} was perceived on ${entry.date} at ${entry.time}.`;

      setIsRewritingMiras(true);

      const erasableMemory = mirasMemoryRef.current;
      const bridge = buildMirasBridge(translatedCaption, erasableMemory);
      setMirasBridgeBursts((prev) => [bridge, ...prev].slice(0, 4));

      // Set old memory so Reel can strike it through
      if (erasableMemory) {
        setMirasHistory((prev) => [...prev.slice(-2), erasableMemory]);
      }
      setMirasPreviousMemory(erasableMemory);
      setIsRewritingMiras(true);
      // Restart streaming text
      setMirasMemory("");
      mirasMemoryRef.current = "";

      const stream = rewriteMirasMemoryStream(
        t("prompts.miras_retention"),
        erasableMemory,
        eventDescription,
      );

      try {
        let updatedMiras = "";
        for await (const chunk of stream) {
          updatedMiras += chunk;
          mirasMemoryRef.current = updatedMiras;
          setMirasMemory(updatedMiras);
          // Wait a tiny bit between chunks to mimic continuous flow
          await new Promise((r) => setTimeout(r, 20));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsRewritingMiras(false);
      }
    },
    [t, playChime],
  );

  const startTrial = async () => {
    setPhase("trial");
    const questions = [
      t("trial.questions.r1"),
      t("trial.questions.r2"),
      t("trial.questions.r3"),
      t("trial.questions.r4"),
    ];

    const allRounds: TrialRound[] = [];
    let transcript = "";
    const wait = (duration: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, duration));
    const updateRound = (roundIndex: number, patch: Partial<TrialRound>) => {
      setTrialRounds((prev) => {
        const arr = [...prev];
        if (arr[roundIndex]) {
          arr[roundIndex] = { ...arr[roundIndex], ...patch };
        }
        return arr;
      });
    };

    await wait(3000);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const funesDump = funesMemory
        .map(
          (e) =>
            `"${t(e.caption, e.caption as any)}" — digit ${e.digit} perceived on ${e.date} at ${e.time}`,
        )
        .join("\n");

      let roundCopy: TrialRound = {
        question: q,
        funesAnswer: "",
        mirasAnswer: "",
        index: i,
        stage: "framing",
      };
      setTrialRounds((prev) => [...prev, roundCopy]);

      await wait(4500);

      const processStream = async (
        stream: AsyncGenerator<string, void, unknown>,
        key: "funesAnswer" | "mirasAnswer",
      ) => {
        let buffer = "";
        for await (const chunk of stream) {
          buffer += chunk;
          const currentBuffer = buffer;
          setTrialRounds((prev) => {
            const arr = [...prev];
            if (arr[i]) {
              arr[i] = { ...arr[i], [key]: currentBuffer };
            }
            return arr;
          });
          // simulate typewriter rhythm
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        return buffer;
      };

      updateRound(i, { stage: "funes" });
      const funesStream = auditMemoryStream(
        t("prompts.auditor_query"),
        q,
        funesDump,
        i18n.language,
        "funes",
      );
      const funesAns = await processStream(funesStream, "funesAnswer");

      await wait(1800);

      updateRound(i, { stage: "miras" });
      const mirasStream = auditMemoryStream(
        t("prompts.auditor_query"),
        q,
        mirasMemoryRef.current,
        i18n.language,
        "miras",
      );
      const mirasAns = await processStream(mirasStream, "mirasAnswer");

      await wait(1800);
      const completedStage: TrialStage = "synthesis";
      updateRound(i, { stage: completedStage });

      roundCopy = {
        question: q,
        funesAnswer: funesAns,
        mirasAnswer: mirasAns,
        index: i,
        stage: completedStage,
      };
      allRounds.push(roundCopy);
      transcript += `Q: ${q}\nFunes: ${funesAns}\nMIRAS: ${mirasAns}\n\n`;

      // Pause before next question
      await wait(5500);
    }

    // After rounds, judge
    const verdictData = await judgeMemories(
      t("prompts.judge"),
      transcript,
      i18n.language,
    );
    setVerdict(verdictData);
    setPhase("verdict");
  };

  const restart = () => {
    setPhase("prologue");
    setFunesMemory([]);
    setMirasMemory("");
    setMirasPreviousMemory("");
    setMirasHistory([]);
    setMirasBridgeBursts([]);
    mirasMemoryRef.current = "";
    setTrialRounds([]);
    setVerdict(null);
  };

  return (
    <div className="relative min-h-screen w-screen bg-background overflow-hidden selection:bg-bloom-white/20">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 alive-background">
        <motion.div
          className="absolute -inset-[45%] blur-[100px] rounded-[100%] opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.4), transparent 60%)",
          }}
          animate={{
            x: ["-3%", "2%", "-3%"],
            y: ["-2%", "3%", "-2%"],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -inset-[45%] blur-[110px] rounded-[100%] opacity-20"
          style={{
            background:
              "radial-gradient(circle at 60% 40%, rgba(255, 96, 88, 0.45), transparent 52%)",
          }}
          animate={{
            x: ["2%", "-3%", "2%"],
            y: ["3%", "-2%", "3%"],
            scale: [1, 1.12, 1],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.08] mix-blend-overlay memory-grain" />

      {/* Language Picker */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {showLanguagePicker && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: -10,
                  originX: 0.5,
                  originY: 0,
                }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl min-w-[120px]"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${i18n.language === lang.code ? "text-bloom-white" : "text-zinc-400"}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setShowLanguagePicker(!showLanguagePicker)}
            className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors bg-zinc-950/70 rounded-full backdrop-blur-sm border border-white/10"
            id="language-button"
            aria-label="Select Language"
          >
            <Globe size={18} />
          </button>
        </div>
      </div>

      <div className="fixed inset-0 z-20 h-screen w-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === "prologue" && (
            <motion.div key="prologue" className="h-full w-full">
              <Prologue onBegin={startReel} />
            </motion.div>
          )}
          {phase === "reel" && (
            <motion.div key="reel" className="h-full w-full">
              <Reel
                scenes={scenesToUse as Scene[]}
                onPerceive={onPerceive}
                onComplete={startTrial}
                funesMemory={funesMemory}
                mirasMemory={mirasMemory}
                mirasPreviousMemory={mirasPreviousMemory}
                mirasHistory={mirasHistory}
                mirasBridgeBursts={mirasBridgeBursts}
                isRewritingMiras={isRewritingMiras}
              />
            </motion.div>
          )}
          {phase === "trial" && (
            <motion.div key="trial" className="h-full w-full">
              <Trial
                rounds={trialRounds}
                currentRoundIndex={trialRounds.length}
                funesMemory={funesMemory}
                mirasMemory={mirasMemory}
                mirasHistory={mirasHistory}
              />
            </motion.div>
          )}
          {phase === "verdict" && verdict && (
            <motion.div key="verdict" className="h-full w-full">
              <Verdict verdict={verdict} onRestart={restart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {(phase === "prologue" || phase === "verdict") && (
        <a
          href="https://carloscrespomacaya.com"
          target="_blank"
          rel="no-referrer"
          className="hidden sm:block fixed bottom-6 right-6 text-[10px] uppercase tracking-widest text-zinc-500 opacity-40 hover:opacity-100 transition-opacity z-50 font-sans"
        >
          A literary AI artifact by Carlos Crespo Macaya ·
          carloscrespomacaya.com
        </a>
      )}
    </div>
  );
}
