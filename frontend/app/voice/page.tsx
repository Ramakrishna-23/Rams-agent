"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Volume2, VolumeX, Trash2, Send, Loader2, Sparkles, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────
interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ── Browser API types ──────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ── Helpers ────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

function uid() {
  return Math.random().toString(36).slice(2);
}

// ── Animated Orb Component ─────────────────────────────────────────
function VoiceOrb({
  state,
  onClick,
}: {
  state: "idle" | "listening" | "thinking" | "speaking";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="voice-orb-container"
      aria-label={state === "listening" ? "Stop listening" : "Start listening"}
    >
      <div className={`voice-orb voice-orb--${state}`}>
        <div className="voice-orb__ring voice-orb__ring--1" />
        <div className="voice-orb__ring voice-orb__ring--2" />
        <div className="voice-orb__ring voice-orb__ring--3" />
        <div className="voice-orb__core">
          {state === "listening" ? (
            <AudioWaveform className="size-8 text-white" strokeWidth={1.5} />
          ) : state === "thinking" ? (
            <Loader2 className="size-8 text-white animate-spin" strokeWidth={1.5} />
          ) : state === "speaking" ? (
            <Volume2 className="size-8 text-white" strokeWidth={1.5} />
          ) : (
            <Mic className="size-8 text-white" strokeWidth={1.5} />
          )}
        </div>
      </div>
      <span className="voice-orb__label">
        {state === "idle" && "Tap to speak"}
        {state === "listening" && "Listening…"}
        {state === "thinking" && "Thinking…"}
        {state === "speaking" && "Speaking…"}
      </span>
    </button>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: VoiceMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
        }`}
      >
        {isUser ? "U" : <Sparkles className="size-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground"
        }`}
      >
        {msg.content}
        <span className="mt-1 block text-right text-[10px] opacity-50">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function VoicePage() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Build speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    rec.onerror = () => {
      setOrbState("idle");
      isListeningRef.current = false;
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setOrbState("idle");
        // Auto-send if we have a transcript
        setTranscript((t) => {
          if (t.trim()) {
            // use setTimeout to break out of the state update cycle
            setTimeout(() => sendMessage(t.trim()), 0);
          }
          return "";
        });
      }
    };

    recognitionRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError("");

      const userMsg: VoiceMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setOrbState("thinking");
      setStreamingContent("");

      try {
        const res = await fetch(`${API_URL}/api/voice/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
          },
          body: JSON.stringify({ message: text, session_id: sessionId }),
        });

        // Extract session id from header if first message
        const newSessionId = res.headers.get("X-Session-Id");
        if (newSessionId && !sessionId) {
          setSessionId(newSessionId);
        }

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream reader");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              const payload = line.slice(5).trim();
              if (currentEvent === "token" || currentEvent === "") {
                // accumulate streamed tokens
                if (payload && payload !== "[DONE]") {
                  fullResponse += payload;
                  setStreamingContent(fullResponse);
                }
              } else if (currentEvent === "done") {
                // backend sends full response as done payload
                if (payload && payload.length > fullResponse.length) {
                  fullResponse = payload;
                }
              }
              currentEvent = "";
            } else if (line === "") {
              // blank line = end of event block
              currentEvent = "";
            }
          }
        }

        const assistantMsg: VoiceMessage = {
          id: uid(),
          role: "assistant",
          content: fullResponse.trim() || "I couldn't generate a response. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent("");

        // TTS
        if (ttsEnabled && assistantMsg.content && window.speechSynthesis) {
          setOrbState("speaking");
          const utter = new SpeechSynthesisUtterance(assistantMsg.content);
          utter.rate = 1.05;
          utter.pitch = 1;
          utter.onend = () => setOrbState("idle");
          window.speechSynthesis.speak(utter);
        } else {
          setOrbState("idle");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
        setOrbState("idle");
        setStreamingContent("");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, ttsEnabled]
  );


  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in your browser. Use the text input below.");
      return;
    }

    if (orbState === "speaking" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setOrbState("idle");
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setOrbState("idle");
    } else {
      setTranscript("");
      isListeningRef.current = true;
      setOrbState("listening");
      recognitionRef.current.start();
    }
  };

  const handleTextSend = () => {
    if (!textInput.trim()) return;
    sendMessage(textInput.trim());
    setTextInput("");
  };

  const clearSession = () => {
    // Cancel any ongoing speech
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (isListeningRef.current && recognitionRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.abort();
    }
    setMessages([]);
    setSessionId(undefined);
    setStreamingContent("");
    setTranscript("");
    setOrbState("idle");
    setError("");

    // Clear backend session
    if (sessionId) {
      fetch(`${API_URL}/api/voice/sessions/${sessionId}`, {
        method: "DELETE",
        headers: API_KEY ? { "X-API-Key": API_KEY } : {},
      }).catch(() => {});
    }
  };

  const hasSpeechSupport =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      <style>{`
        /* ── Voice Orb ── */
        .voice-orb-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          outline: none;
          background: none;
          border: none;
          padding: 0;
        }

        .voice-orb {
          position: relative;
          width: 9rem;
          height: 9rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .voice-orb__ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          opacity: 0;
        }

        .voice-orb__core {
          position: relative;
          z-index: 10;
          width: 5rem;
          height: 5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 32px rgba(99, 102, 241, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .voice-orb-container:hover .voice-orb__core {
          transform: scale(1.05);
          box-shadow: 0 0 48px rgba(99, 102, 241, 0.6);
        }

        .voice-orb__label {
          font-size: 0.875rem;
          color: var(--muted-foreground);
          font-weight: 500;
          letter-spacing: 0.02em;
          transition: color 0.2s;
        }

        /* ── Idle ── */
        .voice-orb--idle .voice-orb__core {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }

        /* ── Listening ── */
        .voice-orb--listening .voice-orb__ring--1 {
          inset: -0.5rem;
          border-color: rgba(99, 102, 241, 0.5);
          opacity: 1;
          animation: pulse-ring 1.5s ease-out infinite;
        }
        .voice-orb--listening .voice-orb__ring--2 {
          inset: -1rem;
          border-color: rgba(99, 102, 241, 0.3);
          opacity: 1;
          animation: pulse-ring 1.5s ease-out infinite 0.3s;
        }
        .voice-orb--listening .voice-orb__ring--3 {
          inset: -1.5rem;
          border-color: rgba(99, 102, 241, 0.15);
          opacity: 1;
          animation: pulse-ring 1.5s ease-out infinite 0.6s;
        }
        .voice-orb--listening .voice-orb__core {
          background: linear-gradient(135deg, #ef4444, #f97316);
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.5);
          animation: breathe 1.2s ease-in-out infinite;
        }

        /* ── Thinking ── */
        .voice-orb--thinking .voice-orb__ring--1 {
          inset: -0.5rem;
          border-color: rgba(139, 92, 246, 0.4);
          opacity: 1;
          animation: spin-ring 2s linear infinite;
        }
        .voice-orb--thinking .voice-orb__core {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          box-shadow: 0 0 40px rgba(124, 58, 237, 0.5);
        }

        /* ── Speaking ── */
        .voice-orb--speaking .voice-orb__ring--1 {
          inset: -0.5rem;
          border-color: rgba(16, 185, 129, 0.5);
          opacity: 1;
          animation: pulse-ring 0.8s ease-out infinite;
        }
        .voice-orb--speaking .voice-orb__ring--2 {
          inset: -1rem;
          border-color: rgba(16, 185, 129, 0.3);
          opacity: 1;
          animation: pulse-ring 0.8s ease-out infinite 0.2s;
        }
        .voice-orb--speaking .voice-orb__core {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.5);
          animation: breathe 0.7s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }

        /* ── Streaming cursor ── */
        .streaming-cursor::after {
          content: "▋";
          animation: blink 0.7s steps(1) infinite;
          color: var(--primary);
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] flex-col">
        {/* ── Header ── */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Voice Assistant</h1>
            <p className="text-xs text-muted-foreground">
              {hasSpeechSupport
                ? "Speak or type to chat with Rams"
                : "Type to chat with Rams (no mic detected)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTtsEnabled((v) => !v)}
              title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
            >
              {ttsEnabled ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSession}
              title="Clear conversation"
              disabled={messages.length === 0}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* ── Left: Orb + transcript ── */}
          <div className="flex w-64 shrink-0 flex-col items-center justify-center gap-6 rounded-xl border bg-card px-6 py-8">
            <VoiceOrb state={orbState} onClick={toggleListening} />

            {/* Live transcript */}
            {transcript && (
              <div className="w-full rounded-lg bg-muted px-3 py-2 text-center text-sm italic text-muted-foreground">
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="w-full rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
                {error}
              </p>
            )}

            {/* Session badge */}
            {sessionId && (
              <span className="text-[10px] text-muted-foreground/50">
                Session active
              </span>
            )}
          </div>

          {/* ── Right: Conversation ── */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
              {messages.length === 0 && !streamingContent ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20">
                    <Sparkles className="size-8 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium">Ask Rams anything</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Search your resources, get summaries, check your inbox, and more.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    {[
                      "What did I save about machine learning?",
                      "Summarise my reading list",
                      "How many items are in my inbox?",
                      "What are my most recent saves?",
                    ].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => sendMessage(hint)}
                        className="rounded-full border px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}

                  {/* Streaming bubble */}
                  {streamingContent && (
                    <div className="flex flex-row gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed">
                        <span className="streaming-cursor">{streamingContent}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Text input bar */}
            <div className="flex gap-2 border-t p-3">
              <Textarea
                id="voice-text-input"
                placeholder="Or type a message…"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSend();
                  }
                }}
                rows={1}
                className="min-h-0 resize-none"
                disabled={orbState === "thinking"}
              />
              <Button
                id="voice-send-btn"
                onClick={handleTextSend}
                disabled={!textInput.trim() || orbState === "thinking"}
                size="icon"
              >
                {orbState === "thinking" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
