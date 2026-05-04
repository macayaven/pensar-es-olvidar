import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';
import './i18n/config';

import {
  type AppPhase,
  type Scene,
  type FunesEntry,
  type TrialRound,
  type JudgeVerdict,
} from './types';
import reelThresholds from './data/reel-thresholds.json';
import { useAudio } from './hooks/useAudio';
import { rewriteMirasMemory, auditMemory, judgeMemories } from './geminiService';
import { localeToLanguageName } from './i18n/languageNames';

// Components
import Prologue from './components/Prologue';
import Reel from './components/Reel';
import Trial from './components/Trial';
import Verdict from './components/Verdict';

export default function App() {
  const { t, i18n } = useTranslation();
  const { playChime } = useAudio();

  const [phase, setPhase] = useState<AppPhase>('prologue');
  const [funesMemory, setFunesMemory] = useState<FunesEntry[]>([]);
  const [mirasMemory, setMirasMemory] = useState<string>('');
  const [trialRounds, setTrialRounds] = useState<TrialRound[]>([]);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: '中文' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'pt', label: 'Português' },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setShowLanguagePicker(false);
  };

  const startReel = () => setPhase('reel');

  const onCorrectClick = useCallback(
    async (entry: FunesEntry, scene: Scene) => {
      playChime(entry.digit);
      setFunesMemory((prev) => [entry, ...prev]);

      const eventDescription = `In scene "${scene.caption}", the digit ${entry.digit} was perceived at (${entry.click_xy.x}%, ${entry.click_xy.y}%).`;
      const newMiras = await rewriteMirasMemory(
        mirasMemory,
        eventDescription,
        localeToLanguageName(i18n.language),
      );
      setMirasMemory(newMiras);
    },
    [mirasMemory, i18n.language, playChime],
  );

  const startTrial = async () => {
    setPhase('trial');
    const language = localeToLanguageName(i18n.language);
    const questions = [
      t('trial.questions.r1'),
      t('trial.questions.r2'),
      t('trial.questions.r3'),
      t('trial.questions.r4'),
    ];

    const allRounds: TrialRound[] = [];

    for (const q of questions) {
      const funesDump = funesMemory
        .map((e) => `Time ${e.timestamp}: Saw ${e.digit} in scene ${e.scene_id}`)
        .join(', ');

      const [funesAns, mirasAns] = await Promise.all([
        auditMemory(q, funesDump, language),
        auditMemory(q, mirasMemory, language),
      ]);

      const round = { question: q, funesAnswer: funesAns, mirasAnswer: mirasAns };
      allRounds.push(round);
      setTrialRounds((prev) => [...prev, round]);

      // Wait ~12 seconds per round as per spec
      await new Promise((resolve) => setTimeout(resolve, 12000));
    }

    // After rounds, judge
    const transcript = allRounds
      .map(
        (r, i) =>
          `Round ${i + 1}: Q: ${r.question}\nFunes: ${r.funesAnswer}\nMIRAS: ${r.mirasAnswer}`,
      )
      .join('\n\n');
    const verdictData = await judgeMemories(transcript, language);
    setVerdict(verdictData);
    setPhase('verdict');
  };

  const restart = () => {
    setPhase('prologue');
    setFunesMemory([]);
    setMirasMemory('');
    setTrialRounds([]);
    setVerdict(null);
  };

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden selection:bg-bloom-white/20">
      {/* Background Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")' }}
      ></div>

      {/* Language Picker */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setShowLanguagePicker(!showLanguagePicker)}
          className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors"
          id="language-button"
        >
          <Globe size={20} />
        </button>
        <AnimatePresence>
          {showLanguagePicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl min-w-[120px]"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${i18n.language === lang.code ? 'text-bloom-white' : 'text-zinc-400'}`}
                >
                  {lang.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'prologue' && (
          <motion.div key="prologue" className="h-full">
            <Prologue onBegin={startReel} />
          </motion.div>
        )}
        {phase === 'reel' && (
          <motion.div key="reel" className="h-full">
            <Reel
              scenes={reelThresholds as Scene[]}
              onCorrectClick={onCorrectClick}
              onComplete={startTrial}
              funesMemory={funesMemory}
              mirasMemory={mirasMemory}
            />
          </motion.div>
        )}
        {phase === 'trial' && (
          <motion.div key="trial" className="h-full">
            <Trial rounds={trialRounds} currentRoundIndex={trialRounds.length} />
          </motion.div>
        )}
        {phase === 'verdict' && verdict && (
          <motion.div key="verdict" className="h-full">
            <Verdict verdict={verdict} onRestart={restart} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {(phase === 'prologue' || phase === 'verdict') && (
        <a
          href="https://carloscrespomacaya.com"
          target="_blank"
          rel="no-referrer"
          className="absolute bottom-6 right-6 text-[10px] uppercase tracking-widest text-zinc-500 opacity-40 hover:opacity-100 transition-opacity z-50 font-sans"
        >
          A literary AI artifact by Carlos Crespo Macaya · carloscrespomacaya.com
        </a>
      )}
    </div>
  );
}
