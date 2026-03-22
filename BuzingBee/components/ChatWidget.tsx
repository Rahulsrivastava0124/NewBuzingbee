"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, Paperclip, X } from "lucide-react";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: string;
  isNew?: boolean;
}

const QUICK_REPLIES = [
  "🔍 Get Free Audit",
  "💻 Web Development",
  "📈 SEO Services",
  "📱 Mobile App",
  "💰 Pricing",
  "🤝 Talk to Human",
] as const;

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

const getTimestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const createMessage = (
  role: Message["role"],
  text: string,
  isNew = true,
): Message => ({
  id: crypto.randomUUID(),
  role,
  text,
  timestamp: getTimestamp(),
  isNew,
});

const initialBotMessage: Message = {
  id: "1",
  role: "bot",
  text: "Hey there! 🐝 I'm Bee from BuzingBee. Need help with SEO, ads, websites, apps, or automation?",
  timestamp: getTimestamp(),
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isMobile, setIsMobile] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [nudgeButton, setNudgeButton] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dragY = useMotionValue(0);

  const showWelcomeBanner = hasOpened && messages.length === 1;
  const showUnreadBadge = !isOpen && !hasOpened;
  const tooltipText = showPrompt
    ? "👋 Need help? Chat with Bee!"
    : "Chat with Bee";

  const containerClasses = useMemo(
    () =>
      [
        "fixed z-[80] border border-[#f0e0a0] bg-[#fffdf5] shadow-2xl backdrop-blur-sm",
        "inset-0 rounded-t-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-2xl",
      ].join(" "),
    [],
  );

  const getAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;

    const BrowserAudioContext =
      window.AudioContext ||
      (
        window as Window &
          typeof globalThis & { webkitAudioContext?: typeof AudioContext }
      ).webkitAudioContext;

    if (!BrowserAudioContext) return null;

    audioContextRef.current = new BrowserAudioContext();
    return audioContextRef.current;
  };

  const playPromptChime = async () => {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const now = audioContext.currentTime;
      const notes = [740, 932];

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const startTime = now + index * 0.12;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.045, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch {
      return;
    }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      void getAudioContext()?.resume();
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (hasOpened) return;
    const timeoutId = window.setTimeout(() => {
      setShowPrompt(true);
      setNudgeButton(true);
      void playPromptChime();
      window.setTimeout(() => setNudgeButton(false), 2400);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [hasOpened]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => inputRef.current?.focus(), 120);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    if (!initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      return;
    }
    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const closeChat = () => {
    setIsOpen(false);
    setShowPrompt(false);
  };

  const openChat = () => {
    setIsOpen(true);
    setHasOpened(true);
    setShowPrompt(false);
  };

  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  const sendMessage = async (rawText?: string) => {
    const userText = (rawText ?? input).trim();
    if (!userText || loading) return;

    setMessages((prev) => [...prev, createMessage("user", userText)]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText, sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with ${response.status}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const reply =
        typeof data.reply === "string"
          ? data.reply
          : typeof data.message === "string"
            ? data.message
            : typeof data.text === "string"
              ? data.text
              : typeof data.response === "string"
                ? data.response
                : "Thanks for reaching out! Tell me a bit more about your goals and I’ll guide you.";

      setMessages((prev) => [...prev, createMessage("bot", reply)]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage(
          "bot",
          "Oops! Something went wrong. Please try again or visit buzingbee.com/contact 🐝",
        ),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = async (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  };

  const handleChipClick = async (chip: string) => {
    setInput(chip);
    await sendMessage(chip);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            className="fixed bottom-24 right-6 z-[81] sm:bottom-24 sm:right-6"
          >
            <div className="group relative flex flex-col items-end">
              <AnimatePresence>
                {showPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute bottom-full right-0 mb-3 hidden rounded-full border border-[#f0e0a0] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1a1a1a] shadow-lg sm:block"
                  >
                    {tooltipText}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                aria-label="Open chat"
                onClick={toggleChat}
                initial={{ scale: 0 }}
                animate={
                  nudgeButton
                    ? {
                        scale: [1, 1.08, 1, 1.08, 1, 1.08, 1],
                        y: [0, -4, 0, -4, 0, -4, 0],
                      }
                    : { scale: 1, y: 0 }
                }
                transition={
                  nudgeButton
                    ? { type: "tween", duration: 1.2, ease: "easeInOut" }
                    : { type: "spring", stiffness: 260, damping: 18 }
                }
                whileHover={{ scale: 1.08, backgroundColor: "#b8780a" }}
                whileTap={{ scale: 0.95 }}
                className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#d4900a] text-white shadow-[0_18px_40px_rgba(212,144,10,0.35)] sm:h-[60px] sm:w-[60px]"
              >
                <span className="absolute inset-0 rounded-full border border-[#d4900a]/40 animate-ping" />
                {showUnreadBadge && (
                  <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                )}
                <span className="relative z-10 text-2xl">🐝</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 160 }}
            dragElastic={0.16}
            style={{ y: dragY }}
            onDragEnd={(_, info) => {
              if (isMobile && info.offset.y > 120) {
                closeChat();
              }
            }}
            initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={containerClasses}
          >
            <div className="flex h-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl">
              <div className="flex h-[72px] items-center justify-between bg-gradient-to-r from-[#1a1a1a] to-[#2d1f00] px-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#d4900a]/20 text-xl text-white">
                    <span className="absolute inset-0 rounded-full border border-[#d4900a]/40 animate-ping" />
                    <span className="relative">🐝</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Bee</div>
                    <div className="text-xs text-[#f7cf73]">
                      BuzingBee Assistant
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Minimize chat"
                    onClick={closeChat}
                    className="rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                className="flex-1 space-y-4 overflow-y-auto bg-[#fffdf5] p-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d4900a]/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
              >
                <AnimatePresence>
                  {showWelcomeBanner && (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mx-auto mb-2 max-w-[280px] rounded-2xl border border-[#f0e0a0] bg-white px-5 py-4 text-center shadow-sm"
                    >
                      <motion.div
                        animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="text-4xl"
                      >
                        🐝
                      </motion.div>
                      <div className="mt-2 text-base font-semibold text-[#1a1a1a]">
                        Hi there! 👋
                      </div>
                      <p className="mt-1 text-sm text-[#6b7280]">
                        I'm Bee, your BuzingBee assistant.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        {[
                          "🚀 Instant replies",
                          "🔒 Private",
                          "⭐ 5.0 rated",
                        ].map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#f0e0a0] bg-[#fff9ea] px-2.5 py-1 text-[11px] font-medium text-[#8d6108]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <motion.div
                        key={message.id}
                        variants={messageVariants}
                        initial={message.isNew ? "hidden" : false}
                        animate="visible"
                        exit="hidden"
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4900a]/15 text-sm text-[#8d6108]">
                            🐝
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
                        >
                          <div
                            className={
                              isUser
                                ? "rounded-2xl rounded-tr-sm bg-[#d4900a] px-4 py-3 text-sm text-white shadow-sm"
                                : "rounded-2xl rounded-tl-sm border border-[#f0e0a0] bg-white px-4 py-3 text-sm text-[#1a1a1a] shadow-sm"
                            }
                          >
                            <p className="whitespace-pre-wrap leading-6">
                              {message.text}
                            </p>
                          </div>
                          <span
                            className={`mt-1 px-1 text-xs ${isUser ? "text-amber-200" : "text-[#6b7280]"}`}
                          >
                            {message.timestamp}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex justify-start"
                  >
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4900a]/15 text-sm text-[#8d6108]">
                      🐝
                    </div>
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-[#f0e0a0] bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            className="h-2 w-2 rounded-full bg-[#d4900a]"
                            animate={
                              shouldReduceMotion ? {} : { y: [0, -6, 0] }
                            }
                            transition={{
                              duration: 0.4,
                              repeat: Infinity,
                              delay: dot * 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[#f5f0e8] bg-white px-3 py-3">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  {QUICK_REPLIES.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void handleChipClick(chip)}
                      className="whitespace-nowrap rounded-full border border-[#d4900a]/45 bg-transparent px-3 py-1.5 text-xs font-medium text-[#d4900a] transition hover:bg-amber-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    aria-label="Attach file"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#faf7ea]"
                  >
                    <Paperclip className="h-[18px] w-[18px]" />
                  </button>

                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => void handleKeyDown(event)}
                    placeholder="Ask me anything..."
                    className="h-11 flex-1 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#6b7280] focus:border-[#d4900a] focus:ring-1 focus:ring-[#f3cf73]"
                  />

                  <motion.button
                    type="submit"
                    aria-label="Send message"
                    whileTap={{ scale: 0.95 }}
                    disabled={!input.trim() || loading}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4900a] text-white transition hover:bg-[#b8780a] disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-white/70 disabled:hover:bg-[#e5e5e5]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </form>

                <div className="pt-2 text-center text-xs text-[#6b7280]">
                  🐝 Powered by BuzingBee AI · buzingbee.com
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
