import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Share2, RotateCcw, Check, X } from "lucide-react";
import { JudgeVerdict } from "../types";

interface VerdictProps {
  verdict: JudgeVerdict;
  onRestart: () => void;
}

type MetricKey =
  | "specificity"
  | "generalization"
  | "coherence"
  | "understanding";

export default function Verdict({ verdict, onRestart }: VerdictProps) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const localizedFallback = t("fallbacks.judge", {
    returnObjects: true,
  }) as NonNullable<JudgeVerdict["analysis"]>;
  const analysis = { ...localizedFallback, ...verdict.analysis };
  const evidence = analysis.evidence?.length
    ? analysis.evidence.slice(0, 3)
    : localizedFallback.evidence;

  const shareVerdict = async () => {
    const textToShare = `Pensar es olvidar.\n${analysis.title || verdict.verdict}\n\n${analysis.synthesis}\n\nhttps://funes.app`; // Provide a canonical URL if appropriate

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Pensar es olvidar",
          text: textToShare,
          url: window.location.origin,
        });
        setShareStatus("copied");
      } else {
        await navigator.clipboard.writeText(
          `${textToShare}\n${window.location.origin}`,
        );
        setShareStatus("copied");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setShareStatus("error");
      }
    }

    setTimeout(() => setShareStatus("idle"), 3000);
  };

  const metrics: Array<{ key: MetricKey; label: string }> = [
    { key: "specificity", label: t("verdict.rubric.specificity") },
    { key: "generalization", label: t("verdict.rubric.generalization") },
    { key: "coherence", label: t("verdict.rubric.coherence") },
    { key: "understanding", label: t("verdict.rubric.understanding") },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div
        ref={cardRef}
        className="relative flex h-[calc(100vh-6rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-zinc-900 bg-black/40 p-6 shadow-[0_0_120px_rgba(30,30,35,0.4)] backdrop-blur-3xl sm:p-8 lg:p-12"
      >
        {/* Visual Grains/Atmosphere */}
        <div className="absolute inset-0 pointer-events-none memory-grain opacity-[0.08]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_74%_24%,rgba(107,140,174,0.12),transparent_45%),radial-gradient(circle_at_24%_32%,rgba(184,84,80,0.1),transparent_40%)]" />

        <header className="relative z-10 shrink-0 border-b border-white/5 pb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-[clamp(2.25rem,5vw,4.5rem)] italic leading-[1.1] text-bloom-white"
          >
            Pensar es olvidar.
          </motion.h1>

          {i18n.language !== "es" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 font-sans text-xs uppercase tracking-[0.3em] text-zinc-500/80"
            >
              {t("prologue.quote")}
            </motion.p>
          )}

          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600">
              the artifact of your gaze
            </p>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl font-serif text-xl text-zinc-400"
            >
              {analysis.title || verdict.verdict}
            </motion.h2>
          </div>
        </header>

        <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pt-8 pb-4 pr-2 funes-scroll">
          <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              {/* Synthesis Card */}
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  interpretation
                </p>
                <p className="font-serif text-[clamp(1.25rem,2.2vw,2.25rem)] leading-[1.4] text-bloom-white/90">
                  {analysis.synthesis}
                </p>
              </div>

              {/* Evidence Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                {evidence.map((item, index) => (
                  <motion.div
                    key={`${item}-${index}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + 0.1 * index }}
                    className="rounded-2xl border border-white/5 bg-black/40 p-5"
                  >
                    <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                      trace {index + 1}
                    </p>
                    <p className="font-serif text-sm leading-relaxed text-zinc-400">
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Thesis */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 border-dashed">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  thesis
                </p>
                <p className="font-serif text-lg leading-relaxed text-zinc-300">
                  {analysis.thesis}
                </p>
              </div>
            </div>

            {/* Sidebar Interpretation */}
            <div className="space-y-4">
              <MemoryInterpretation
                name="Funes"
                tone="funes"
                reading={analysis.funesReading}
                metrics={metrics}
                scores={verdict.funes}
                fallback="Funes preserves the world too completely to form a world."
              />
              <MemoryInterpretation
                name="MIRAS"
                tone="miras"
                reading={analysis.mirasReading}
                metrics={metrics}
                scores={verdict.miras}
                fallback="MIRAS loses particulars in order to keep the shape."
              />
            </div>
          </section>
        </main>

        <footer className="relative z-10 mt-auto flex shrink-0 flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 sm:flex-row">
          <div className="flex gap-4">
            <button
              onClick={shareVerdict}
              disabled={shareStatus !== "idle"}
              className="group flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-3.5 font-sans text-xs uppercase tracking-[0.25em] text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-bloom-white disabled:pointer-events-none disabled:opacity-80"
            >
              {shareStatus === "idle" ? (
                <>
                  <Share2
                    size={14}
                    className="transition-transform group-hover:scale-110"
                  />
                  {t("verdict.share")}
                </>
              ) : shareStatus === "copied" ? (
                <>
                  <Check size={14} className="text-green-500" />
                  Verdict copied
                </>
              ) : (
                <>
                  <X size={14} className="text-red-500" />
                  Share unavailable
                </>
              )}
            </button>
            <button
              onClick={onRestart}
              className="group flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-3.5 font-sans text-xs uppercase tracking-[0.25em] text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-bloom-white"
            >
              <RotateCcw
                size={14}
                className="transition-transform group-hover:rotate-12"
              />
              {t("verdict.restart")}
            </button>
          </div>

          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-700">
              A literary AI artifact by Carlos Crespo Macaya
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MemoryInterpretation({
  name,
  tone,
  reading,
  metrics,
  scores,
  fallback,
}: {
  name: string;
  tone: "funes" | "miras";
  reading?: string;
  metrics: Array<{ key: MetricKey; label: string }>;
  scores: Record<string, any>;
  fallback: string;
}) {
  const isFunes = tone === "funes";

  return (
    <div
      className={`rounded-3xl border ${isFunes ? "border-funes-red/20" : "border-miras-blue/20"} bg-black/40 p-5`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3
          className={`font-mono text-xs uppercase tracking-[0.2em] ${isFunes ? "text-funes-red" : "text-miras-blue"}`}
        >
          {name}
        </h3>
        <div className="flex gap-1.5">
          {metrics.map((m) => (
            <div
              key={m.key}
              title={`${m.label}: ${scores[m.key]}`}
              className={`h-1.5 w-1.5 rounded-full ${scores[m.key] > 70 ? (isFunes ? "bg-funes-red" : "bg-miras-blue") : "bg-zinc-800"}`}
            />
          ))}
        </div>
      </div>
      <p className="font-serif text-sm leading-relaxed text-zinc-400">
        {reading || fallback}
      </p>
    </div>
  );
}
