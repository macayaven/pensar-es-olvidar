import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { TrialRound, TrialStage, FunesEntry } from '../types';

interface TrialProps {
  rounds: TrialRound[];
  currentRoundIndex: number;
  funesMemory: FunesEntry[];
  mirasMemory: string;
  mirasHistory: string[];
}

const STAGES: TrialStage[] = ['framing', 'funes', 'miras', 'synthesis'];

function toRoman(num: number): string {
  const map: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  let result = '';
  for (const key in map) {
    while (num >= map[key]) {
      result += key;
      num -= map[key];
    }
  }
  return result;
}

export default function Trial({ rounds, currentRoundIndex, funesMemory, mirasMemory, mirasHistory }: TrialProps) {
  const { t } = useTranslation();
  const displayIndex = Math.max(0, rounds.length - 1);
  const currentRound = rounds[displayIndex];
  const latestMirasGhost = mirasHistory[mirasHistory.length - 1];
  const stage = currentRound?.stage ?? 'framing';
  const roundNumber = (currentRound?.index ?? displayIndex) + 1;
  const roundKey = `r${roundNumber}`;
  const romanRound = toRoman(roundNumber);

  const isFunesUsed = (entry: FunesEntry, answer: string) => {
    if (!answer) return false;
    const translatedCaption = String(t(entry.caption, entry.caption as any)).toLowerCase();
    const answerLower = answer.toLowerCase();
    const captionTokens = translatedCaption.split(/\s+/).filter(token => token.length > 4);

    return (
      answer.includes(entry.time) ||
      answer.includes(entry.date) ||
      captionTokens.some(token => answerLower.includes(token)) ||
      answerLower.includes(`digit ${entry.digit}`) ||
      answerLower.includes(`[${entry.digit}]`)
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-background/75">
      <header className="shrink-0 border-b border-zinc-900 bg-black/40 px-6 py-6 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_1.1fr_280px]">
          <section className="flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                {t('trial.round', { round: toRoman(displayIndex) })}
              </span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <AnimatePresence mode="wait">
              {currentRound && (
                <motion.h2
                  key={currentRound.question}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] text-bloom-white"
                >
                  {currentRound.question}
                </motion.h2>
              )}
            </AnimatePresence>
          </section>

          <section className="rounded-lg border border-bloom-white/10 bg-black/20 px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-600">
              {currentRound ? t('trial.success_label') : t('trial.opening.rule_label')}
            </p>
            <p className="mt-2 font-serif text-base leading-snug text-bloom-white/78 sm:text-lg">
              {currentRound ? t(`trial.success.${roundKey}`) : t('trial.opening.rule')}
            </p>
          </section>

          <StageMeter active={stage} />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.1fr_1.1fr_280px]">
        <section className="grid min-h-0 grid-rows-[1.2fr_0.8fr] border-b border-zinc-900 bg-funes-red/[0.03] lg:border-b-0 lg:border-r">
          <div className="min-h-0 overflow-y-auto border-b border-dashed border-funes-red/15 p-4 funes-scroll sm:p-5 lg:p-6">
            <MemoryBrief
              tone="funes"
              title={t('trial.access.funes.title')}
              body={t('trial.access.funes.body')}
              active={stage === 'funes'}
            />
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {funesMemory.map((entry, idx) => {
                const used = currentRound && isFunesUsed(entry, currentRound.funesAnswer);
                const serial = (idx + 1).toString().padStart(3, "0");
                return (
                  <motion.div
                    key={`${entry.scene_id}-${entry.time}`}
                    layout
                    className={`group relative overflow-hidden rounded-lg border p-3.5 transition-all duration-500 ${
                      used
                        ? "border-funes-red/60 bg-funes-red/10 text-funes-red shadow-[0_0_30px_rgba(184,84,80,0.15)]"
                        : "border-funes-red/5 bg-black/40 text-funes-red/30"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.2em] opacity-60">
                      <span>FOLIO_{serial}</span>
                      <span>MEMORY_{serial}</span>
                    </div>
                    <p
                      className="truncate font-serif text-xs text-bloom-white/80"
                      title={t(entry.caption, entry.caption as any)}
                    >
                      {t(entry.caption, entry.caption as any)}
                    </p>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-3 w-0.5 ${used ? "bg-funes-red/40" : "bg-funes-red/10"}`}
                          />
                        ))}
                      </div>
                      <p className="font-serif text-3xl leading-none tabular-nums opacity-90">
                        {entry.digit}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-5 funes-scroll lg:p-7">
            <AnswerHeading
              tone="funes"
              label={t('trial.answer.funes.label')}
              body={t('trial.answer.funes.body')}
              active={stage === 'funes'}
            />
            <AnimatePresence mode="wait">
              {currentRound && (
                <motion.div
                  key={`funes-${displayIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="font-mono text-sm leading-relaxed text-funes-red">
                    {currentRound.funesAnswer || (stage === 'framing' ? t('trial.waiting.funes') : t('trial.answering'))}
                  </p>
                  {(stage === 'funes' || stage === 'miras' || stage === 'synthesis') && currentRound.funesAnswer && (
                    <Shortcoming tone="funes" text={t('trial.shortcoming.funes')} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="grid min-h-0 grid-rows-[1.2fr_0.8fr] bg-miras-blue/[0.03]">
          <div className="min-h-0 overflow-y-auto border-b border-dashed border-miras-blue/15 p-4 funes-scroll sm:p-5 lg:p-6">
            <MemoryBrief
              tone="miras"
              title={t('trial.access.miras.title')}
              body={t('trial.access.miras.body')}
              active={stage === 'miras'}
            />
            <div className="mt-4 space-y-3">
              {latestMirasGhost && (
                <div className="relative max-h-20 overflow-hidden rounded-lg border border-miras-blue/10 bg-black/20 p-3 font-serif text-sm leading-relaxed text-miras-blue/35 line-through">
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
                  {latestMirasGhost}
                </div>
              )}

              <motion.div
                layout
                className={`rounded-lg border p-4 transition-all duration-500 ${
                  stage === 'miras' || stage === 'synthesis'
                    ? 'border-miras-blue/55 bg-miras-blue/15 text-miras-blue shadow-[0_0_24px_rgba(80,120,184,0.22)]'
                    : 'border-miras-blue/5 border-dashed bg-transparent text-miras-blue/20'
                }`}
              >
                <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em]">
                  <span>active abstraction</span>
                  <span className="flex h-2 w-2 rounded-full bg-miras-blue/40" />
                </div>
                <p className="font-serif text-[15px] leading-relaxed italic">
                  {mirasMemory || "Looking for pattern..."}
                </p>
              </motion.div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-5 funes-scroll lg:p-7">
            <AnswerHeading
              tone="miras"
              label={t('trial.answer.miras.label')}
              body={t('trial.answer.miras.body')}
              active={stage === 'miras'}
            />
            <AnimatePresence mode="wait">
              {currentRound && (
                <motion.div
                  key={`miras-${displayIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="font-mono text-sm leading-relaxed text-miras-blue">
                    {currentRound.mirasAnswer || (stage === 'miras' ? t('trial.answering') : t('trial.waiting.miras'))}
                  </p>
                  {(stage === 'miras' || stage === 'synthesis') && currentRound.mirasAnswer && (
                    <Shortcoming tone="miras" text={t('trial.shortcoming.miras')} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
          <div className="hidden lg:block bg-black/10 h-full border-l border-zinc-900" />
      </main>
    </div>
  );
}

function StageMeter({ active }: { active: TrialStage }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-lg border border-bloom-white/10 bg-black/20 p-4">
      <div className="flex h-full flex-col justify-center gap-4">
        {STAGES.map((s, i) => (
          <div key={s} className="group relative flex items-center gap-3">
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <div
                className={`h-px w-full transition-all duration-700 ${
                  STAGES.indexOf(active) >= i ? 'bg-bloom-white/40' : 'bg-white/5'
                }`}
              />
              <motion.div
                animate={{
                  scale: active === s ? [1, 1.2, 1] : 1,
                  backgroundColor: active === s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)',
                }}
                className={`absolute h-1.5 w-1.5 rounded-full ${
                  active === s ? 'shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''
                }`}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-mono text-[9px] uppercase tracking-widest transition-colors duration-500 ${
                  active === s ? 'text-bloom-white' : 'text-zinc-600'
                }`}
              >
                {t(`trial.stages.${s}.label`)}
              </span>
              {active === s && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-1 font-serif text-[11px] leading-tight text-white/40"
                >
                  {t(`trial.stages.${s}.body`)}
                </motion.p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MemoryBrief({ tone, title, body, active }: { tone: 'funes' | 'miras'; title: string; body: string; active: boolean }) {
  return (
    <div className={`transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <h3 className={`font-mono text-[10px] uppercase tracking-[0.25em] ${tone === 'funes' ? 'text-funes-red' : 'text-miras-blue'}`}>
        {title}
      </h3>
      <p className="mt-1 font-serif text-xs leading-relaxed text-zinc-400">
        {body}
      </p>
    </div>
  );
}

function AnswerHeading({ tone, label, body, active }: { tone: 'funes' | 'miras'; label: string; body: string; active: boolean }) {
  return (
    <div className={`transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <div className="flex items-center gap-3">
        <h3 className={`font-mono text-[11px] uppercase tracking-[0.2em] ${tone === 'funes' ? 'text-funes-red' : 'text-miras-blue'}`}>
          {label}
        </h3>
        {active && (
          <motion.div
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`h-1 w-1 rounded-full ${tone === 'funes' ? 'bg-funes-red' : 'bg-miras-blue'}`}
          />
        )}
      </div>
      <p className="mt-1 font-serif text-[11px] italic leading-tight text-zinc-500">
        {body}
      </p>
    </div>
  );
}

function Shortcoming({ tone, text }: { tone: 'funes' | 'miras'; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`mt-4 rounded border px-3 py-2 ${
        tone === 'funes' ? 'border-funes-red/20 bg-funes-red/5 text-funes-red/60' : 'border-miras-blue/20 bg-miras-blue/5 text-miras-blue/60'
      }`}
    >
      <p className="font-serif text-[10px] leading-snug">
        {text}
      </p>
    </motion.div>
  );
}
