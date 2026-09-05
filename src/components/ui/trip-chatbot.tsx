'use client';
import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, SkipForward, Check, Bot, RotateCcw, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type QType = 'text' | 'chips' | 'monthGrid' | 'durationChips' | 'groupPicker' | 'multiChips';

interface Option { label: string; value: string | number; emoji?: string }
interface Question {
  id: string;
  bot: string;
  type: QType;
  field: string;
  options?: Option[];
  placeholder?: string;
  optional?: boolean;
}
interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

export interface ChatbotUpdate {
  departureCity?: string;
  purpose?: string;
  travelMonth?: string;
  duration?: number;
  groupSize?: number;
  interests?: string[];
  specialRequirements?: string;
}

// ─── Question bank ────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const INTEREST_EMOJI: Record<string, string> = {
  Beaches:'🏖️', Temples:'⛩️', Shopping:'🛍️', Nightlife:'🌃', Food:'🍜',
  Museums:'🏛️', Nature:'🌿', Sports:'⚽', Spa:'💆', Architecture:'🏗️',
  Photography:'📸', Diving:'🤿',
};

const QUESTIONS: Question[] = [
  {
    id: 'departure',
    bot: "Hi! I'm **Voyago AI** ✈️ — your personal travel planner.\n\nLet's craft your perfect trip together! First — which city will you be **departing from**?",
    type: 'text',
    field: 'departureCity',
    placeholder: 'e.g. Mumbai, Dubai, London…',
  },
  {
    id: 'purpose',
    bot: "Great! What's the **main purpose** of your trip? 🌍",
    type: 'chips',
    field: 'purpose',
    options: [
      { label: 'Leisure & Relaxation', value: 'leisure',   emoji: '🏖️' },
      { label: 'Adventure & Thrill',   value: 'adventure', emoji: '🏔️' },
      { label: 'Culture & History',    value: 'culture',   emoji: '🏛️' },
      { label: 'Honeymoon / Romance',  value: 'honeymoon', emoji: '💑' },
      { label: 'Family Holiday',       value: 'family',    emoji: '👨‍👩‍👧' },
      { label: 'Solo Exploration',     value: 'solo',      emoji: '🧍' },
      { label: 'Business + Leisure',   value: 'business',  emoji: '💼' },
      { label: 'Group Trip',           value: 'group',     emoji: '🎉' },
    ],
  },
  {
    id: 'month',
    bot: "When are you planning to travel? 📅",
    type: 'monthGrid',
    field: 'travelMonth',
  },
  {
    id: 'duration',
    bot: "How long is your trip going to be? 🗓️",
    type: 'durationChips',
    field: 'duration',
    options: [
      { label: '3 days',  value: 3,  emoji: '⚡' },
      { label: '5 days',  value: 5,  emoji: '🌟' },
      { label: '7 days',  value: 7,  emoji: '🌍' },
      { label: '10 days', value: 10, emoji: '🔥' },
      { label: '14 days', value: 14, emoji: '💎' },
      { label: '21 days', value: 21, emoji: '🏆' },
    ],
  },
  {
    id: 'groupSize',
    bot: "How many travelers will be joining this trip? 👥",
    type: 'groupPicker',
    field: 'groupSize',
  },
  {
    id: 'interests',
    bot: "What experiences excite you the most? Select **all that apply** 🎯",
    type: 'multiChips',
    field: 'interests',
    options: Object.keys(INTEREST_EMOJI).map(k => ({ label: k, value: k, emoji: INTEREST_EMOJI[k] })),
  },
  {
    id: 'specific',
    bot: "Last one! 🗺️\n\nDo you have a **specific destination** in mind, or any previous trip whose experience you'd love to recreate?\n\nYou can also mention special requirements, accessibility needs, or must-see landmarks.",
    type: 'text',
    field: 'specialRequirements',
    placeholder: 'e.g. Maldives beach, Bali temples, Paris honeymoon… or describe a past trip you loved',
    optional: true,
  },
];

// ─── Render bold markdown in bot messages ────────────────────────────────────
function BotMarkdown({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-bold text-white">{p}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface TripChatbotProps {
  onUpdate: (updates: Partial<ChatbotUpdate>) => void;
  onComplete?: () => void;
}

export function TripChatbot({ onUpdate, onComplete }: TripChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [groupCount, setGroupCount] = useState(2);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [lockedQuestions, setLockedQuestions] = useState<Set<number>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addBotMsg = useCallback((text: string, delay = 700) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { id: `bot-${Date.now()}`, role: 'bot', text }]);
      setIsTyping(false);
    }, delay);
  }, []);

  const addUserMsg = (text: string) => {
    setMessages(m => [...m, { id: `user-${Date.now()}`, role: 'user', text }]);
  };

  // Boot: show first question on mount
  useEffect(() => {
    const t = setTimeout(() => addBotMsg(QUESTIONS[0].bot, 400), 200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll — scoped inside the chat container only
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus text input when question type is text
  useEffect(() => {
    if (!isTyping && !isDone && QUESTIONS[currentQ]?.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [currentQ, isTyping, isDone]);

  const advance = useCallback((qIdx: number) => {
    setLockedQuestions(s => new Set(s).add(qIdx));
    const next = qIdx + 1;
    if (next >= QUESTIONS.length) {
      setIsDone(true);
      setTimeout(() => {
        addBotMsg("🎉 **Perfect!** I have everything I need.\n\nHit **Find My Destinations** below — your AI-curated recommendations are ready!", 500);
        onComplete?.();
      }, 300);
    } else {
      setCurrentQ(next);
      setTimeout(() => addBotMsg(QUESTIONS[next].bot), 400);
    }
  }, [addBotMsg, onComplete]);

  const handleAnswer = useCallback((field: string, value: unknown, display: string, qIdx: number) => {
    onUpdate({ [field]: value } as Partial<ChatbotUpdate>);
    addUserMsg(display);
    advance(qIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance, onUpdate]);

  const handleTextSubmit = () => {
    const q = QUESTIONS[currentQ];
    const val = textInput.trim();
    if (!val && !q.optional) return;
    handleAnswer(q.field, val, val || '⏭ Skipped', currentQ);
    setTextInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTextSubmit();
  };

  const handleMultiDone = () => {
    if (multiSelected.length === 0) return;
    const q = QUESTIONS[currentQ];
    handleAnswer(q.field, multiSelected, multiSelected.join(', '), currentQ);
    setMultiSelected([]);
  };

  const handleGroupConfirm = () => {
    handleAnswer('groupSize', groupCount, `${groupCount} ${groupCount === 1 ? 'traveler' : 'travelers'}`, currentQ);
  };

  const q = QUESTIONS[currentQ];
  const isLocked = lockedQuestions.has(currentQ);

  // ─── Input area renderer ─────────────────────────────────────────────────
  function renderInput() {
    if (isDone || isTyping || isLocked) return null;

    if (q.type === 'text') {
      return (
        <motion.div key="text-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mt-3">
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={q.placeholder}
            className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
          {q.optional && (
            <button
              onClick={() => handleAnswer(q.field, '', '⏭ Skipped', currentQ)}
              className="px-3 py-2 rounded-2xl bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-muted/80 transition-colors shrink-0"
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>
          )}
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() && !q.optional}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-all shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </motion.div>
      );
    }

    if (q.type === 'chips' || q.type === 'durationChips') {
      return (
        <motion.div key="chips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mt-3">
          {(q.options || []).map(opt => (
            <motion.button
              key={String(opt.value)}
              onClick={() => handleAnswer(q.field, opt.value, `${opt.emoji ?? ''} ${opt.label}`.trim(), currentQ)}
              className="px-4 py-2.5 rounded-2xl border border-border bg-card text-sm font-medium hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-300 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {opt.emoji && <span>{opt.emoji}</span>}
              {opt.label}
            </motion.button>
          ))}
        </motion.div>
      );
    }

    if (q.type === 'monthGrid') {
      return (
        <motion.div key="month-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2 mt-3">
          {MONTHS.map(m => (
            <motion.button
              key={m}
              onClick={() => handleAnswer('travelMonth', m, `📅 ${m}`, currentQ)}
              className="py-2 rounded-xl border border-border bg-card text-xs font-semibold hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {m.slice(0, 3)}
            </motion.button>
          ))}
        </motion.div>
      );
    }

    if (q.type === 'groupPicker') {
      return (
        <motion.div key="group-picker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mt-3 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setGroupCount(c => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/70 font-bold text-xl flex items-center justify-center transition-colors"
            >−</button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-black">{groupCount}</div>
              <div className="text-xs text-muted-foreground">{groupCount === 1 ? 'Solo traveler' : 'travelers'}</div>
            </div>
            <button
              onClick={() => setGroupCount(c => Math.min(20, c + 1))}
              className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/70 font-bold text-xl flex items-center justify-center transition-colors"
            >+</button>
          </div>
          <button
            onClick={handleGroupConfirm}
            className="px-5 py-3 rounded-2xl text-white font-bold text-sm flex items-center gap-2 shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          >
            <Check className="w-4 h-4" /> Confirm
          </button>
        </motion.div>
      );
    }

    if (q.type === 'multiChips') {
      return (
        <motion.div key="multi-chips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(q.options || []).map(opt => {
              const sel = multiSelected.includes(String(opt.value));
              return (
                <motion.button
                  key={String(opt.value)}
                  onClick={() => setMultiSelected(s =>
                    sel ? s.filter(x => x !== opt.value) : [...s, String(opt.value)]
                  )}
                  className={`px-3 py-2 rounded-2xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
                    sel
                      ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                      : 'border-border bg-card hover:border-violet-400/50'
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {opt.emoji && <span>{opt.emoji}</span>}
                  {opt.label}
                  {sel && <Check className="w-3 h-3" />}
                </motion.button>
              );
            })}
          </div>
          <button
            onClick={handleMultiDone}
            disabled={multiSelected.length === 0}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
            style={{ background: multiSelected.length > 0 ? 'linear-gradient(135deg, #6C63FF, #06B6D4)' : undefined }}
          >
            <ChevronRight className="w-4 h-4" />
            Done — {multiSelected.length > 0 ? `${multiSelected.length} selected` : 'select at least 1'}
          </button>
        </motion.div>
      );
    }

    return null;
  }

  // ─── Progress bar ────────────────────────────────────────────────────────
  const progress = isDone ? 100 : Math.round((currentQ / QUESTIONS.length) * 100);

  return (
    <div className="rounded-2xl border border-border overflow-hidden flex flex-col bg-card" style={{ minHeight: 460 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(6,182,212,0.06))' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />
          </div>
          <div>
            <div className="font-bold text-sm">Voyago AI Planner</div>
            <div className="text-[10px] text-muted-foreground">
              {isDone ? '✅ All done!' : `Question ${Math.min(currentQ + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}
            </div>
          </div>
        </div>
        {!isDone && (
          <button
            onClick={() => {
              setMessages([]);
              setCurrentQ(0);
              setIsTyping(false);
              setLockedQuestions(new Set());
              setMultiSelected([]);
              setTextInput('');
              setGroupCount(2);
              setTimeout(() => addBotMsg(QUESTIONS[0].bot, 300), 100);
            }}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #6C63FF, #06B6D4)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin" style={{ maxHeight: 320 }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mr-2 mt-1 text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'bot'
                    ? 'bg-muted text-foreground rounded-tl-sm'
                    : 'text-white rounded-tr-sm'
                }`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }
                  : {}}
              >
                {msg.role === 'bot'
                  ? <BotMarkdown text={msg.text} />
                  : msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground/60"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 border-t border-border pt-3">
        <AnimatePresence mode="wait">
          {renderInput()}
        </AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 py-3 px-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-emerald-400">Trip profile complete!</div>
              <div className="text-xs text-muted-foreground">Scroll down and submit to see AI recommendations</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
