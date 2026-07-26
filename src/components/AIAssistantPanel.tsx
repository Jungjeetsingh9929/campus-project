import { useState } from 'react';
import { motion } from 'framer-motion';
import { answerCampusQuestion } from '../lib/campusAssistant';
import { queryAi } from '../api/campusApi';

const suggestions = [
  'Show nearest free classroom',
  'Take me to library',
  'Which building consumes most electricity?',
  'Show unresolved complaints',
  'Find nearest washroom',
  'Navigate to Block C',
  'Show Wi-Fi outage',
];

export function AIAssistantPanel() {
  const [prompt, setPrompt] = useState('Show nearest free classroom');
  const [answer, setAnswer] = useState(answerCampusQuestion('Show nearest free classroom'));

  const submit = async () => {
    const response = await queryAi(prompt);
    setAnswer(response.answer || answerCampusQuestion(prompt));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">AI assistant</h3>
          <p className="mt-1 text-sm text-slate-300">Campus-aware answers from live operational data.</p>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-100">
          Rule-based mode
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
        placeholder="Ask a campus question..."
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setPrompt(item);
              void queryAi(item).then((response) => setAnswer(response.answer || answerCampusQuestion(item)));
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-200 transition hover:bg-white/10"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Ask campus AI
        </button>
        <span className="text-xs text-slate-500">Uses the secured backend endpoint; Azure OpenAI can be enabled with provider credentials.</span>
      </div>

      <motion.div
        key={answer}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-3xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50"
      >
        {answer}
      </motion.div>
    </div>
  );
}
