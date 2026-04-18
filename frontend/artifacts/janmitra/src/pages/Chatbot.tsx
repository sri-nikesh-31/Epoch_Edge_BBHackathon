import { useState, useRef, useEffect, useCallback } from "react";
import { useSendChatMessage, useGetChatHistory, ChatMessageRequestLanguage, ChatMessageRequestUserType } from "@workspace/api-client-react";
import { useUserPreferences } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, Landmark, User, ExternalLink, WifiOff, AlertCircle } from "lucide-react";
import { Link } from "wouter";

const LANG_CODES: Record<string, string> = {
  english: "en-IN",
  hindi: "hi-IN",
  tamil: "ta-IN",
  bengali: "bn-IN",
  marathi: "mr-IN",
  telugu: "te-IN",
};

const LANG_LABELS: Record<string, string> = {
  english: "English",
  hindi: "हिन्दी",
  tamil: "தமிழ்",
  bengali: "বাংলা",
  marathi: "मराठी",
  telugu: "తెలుగు",
};

const USER_TYPE_LABELS: Record<string, string> = {
  general: "General Public",
  farmer: "Farmer",
  student: "Student",
  msme: "MSME Owner",
  salaried: "Salaried",
};

function speakText(text: string, lang: string) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[lang] ?? "en-IN";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

type InputMode = "text" | "voice";

export default function Chatbot() {
  const { sessionId, language, userType, setLanguage, setUserType } = useUserPreferences();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const {
    data: history,
    refetch,
    isError: historyError,
  } = useGetChatHistory(
    { sessionId },
    {
      query: {
        enabled: !!sessionId,
        queryKey: ["chat-history", sessionId],
        retry: 1,               // Don't hammer a missing server
        retryDelay: 2000,
      },
    }
  );

  const sendChat = useSendChatMessage();

  // True when backend is unreachable
  const isOffline = historyError;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, sendChat.isPending]);

  const playBotVoice = useCallback((text: string, msgId: number) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language] ?? "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    setSpeakingMsgId(msgId);
    setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  const submitMessage = (message: string, fromVoice: boolean) => {
    if (!message.trim()) return;
    setInput("");
    sendChat.mutate(
      { data: { message, sessionId, language, userType } },
      {
        onSuccess: (data) => {
          refetch();
          if (fromVoice && data?.response) {
            const uid = Date.now();
            setSpeakingMsgId(uid);
            setIsSpeaking(true);
            const u = speakText(data.response, language);
            u.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
            u.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
          }
        },
        onError: () => {
          // Error displayed inline — no unhandled rejection
        },
      }
    );
  };

  const handleTextSend = () => submitMessage(input, false);

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported. Please use Chrome or Edge.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = LANG_CODES[language] ?? "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      setIsRecording(false);
      setInput(transcript);
      submitMessage(transcript, true);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">

      {/* ── Offline banner ── */}
      {isOffline && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-sm text-amber-800">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>API server is offline.</strong> Chat history and responses won't load until the backend is running on port 3000.
          </span>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="border-b bg-card px-5 py-3 flex flex-wrap items-center gap-4">

        {/* Language selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Language</span>
          <Select value={language} onValueChange={(v) => setLanguage(v as ChatMessageRequestLanguage)}>
            <SelectTrigger className="h-9 w-[148px] text-sm font-medium border-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              {Object.values(ChatMessageRequestLanguage).map((l) => (
                <SelectItem key={l} value={l} className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{LANG_LABELS[l] ?? l}</span>
                    {LANG_LABELS[l] !== l && (
                      <span className="text-xs text-muted-foreground capitalize">({l})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profile selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Profile</span>
          <Select value={userType} onValueChange={(v) => setUserType(v as ChatMessageRequestUserType)}>
            <SelectTrigger className="h-9 w-[148px] text-sm font-medium border-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              {Object.values(ChatMessageRequestUserType).map((t) => (
                <SelectItem key={t} value={t} className="text-sm py-2 font-medium">
                  {USER_TYPE_LABELS[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input mode toggle */}
        <div className="ml-auto flex items-center bg-muted rounded-lg p-1 gap-0.5">
          <button
            onClick={() => { setInputMode("text"); stopSpeaking(); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              inputMode === "text"
                ? "bg-white shadow text-[hsl(224,65%,23%)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-3 h-3" />
            Text
          </button>
          <button
            onClick={() => setInputMode("voice")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              inputMode === "voice"
                ? "bg-[#FF9933] shadow text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="w-3 h-3" />
            Voice
          </button>
        </div>

        {/* Voice mode badge */}
        {inputMode === "voice" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#FF9933] bg-[#FF9933]/10 border border-[#FF9933]/25 px-2.5 py-1 rounded-full">
            <Volume2 className="w-3 h-3" />
            Bot replies in voice
          </div>
        )}
      </div>

      {/* ── Chat Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5" ref={scrollRef}>

        {/* Bot intro — always visible */}
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="w-9 h-9 rounded-full bg-[hsl(224,65%,23%)] flex items-center justify-center flex-shrink-0 shadow-md">
            <Landmark className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="bg-[hsl(224,65%,23%)] text-white rounded-2xl rounded-tl-none px-5 py-4 shadow max-w-lg">
            <p className="text-xs font-bold text-[#FF9933] mb-1.5 tracking-wide uppercase">JanMitra — RBI Policy Assistant</p>
            <p className="text-sm leading-relaxed text-white/85">
              Namaste! I help you understand RBI policies, banking rules, loan guidelines, and more — in your language.
            </p>
            <p className="text-xs text-white/50 mt-2.5 leading-relaxed">
              Select your <span className="text-white/80 font-semibold">language</span> and <span className="text-white/80 font-semibold">profile</span> above, then switch to{" "}
              <span className="text-[#FF9933] font-semibold">Voice</span> mode to ask by speaking — the bot will reply aloud.
            </p>
          </div>
        </div>

        {/* Chat history */}
        {Array.isArray(history) && history.map((msg, i) => (
          <div key={i} className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            {msg.role === "assistant" ? (
              <div className="w-8 h-8 rounded-full bg-[hsl(224,65%,23%)] flex items-center justify-center flex-shrink-0 shadow">
                <Landmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FF9933] flex items-center justify-center flex-shrink-0 shadow">
                <User className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            )}

            <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Bubble */}
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[hsl(224,65%,23%)] text-white rounded-br-none"
                  : "bg-card border text-foreground rounded-bl-none"
              }`}>
                {msg.content}
              </div>

              {/* Voice listen button — only shown for assistant messages in voice mode */}
              {msg.role === "assistant" && inputMode === "voice" && msg.id !== undefined && (
                <button
                  onClick={() =>
                    speakingMsgId === msg.id ? stopSpeaking() : playBotVoice(msg.content, msg.id!)
                  }
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    speakingMsgId === msg.id
                      ? "bg-[#FF9933] text-white border-[#FF9933]"
                      : "bg-background text-muted-foreground border-border hover:border-[#FF9933] hover:text-[#FF9933]"
                  }`}
                >
                  {speakingMsgId === msg.id ? (
                    <><VolumeX className="w-3 h-3" /> Stop</>
                  ) : (
                    <><Volume2 className="w-3 h-3" /> Listen</>
                  )}
                </button>
              )}

              {/* Related policy cards for most recent reply */}
              {msg.role === "assistant" &&
                i === (Array.isArray(history) ? history.length : 0) - 1 &&
                sendChat.data?.relatedPolicies &&
                sendChat.data.relatedPolicies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {sendChat.data.relatedPolicies.map((p) => (
                      <Link key={p.id} href={`/policies/${p.id}`}>
                        <div className="flex items-center gap-1.5 bg-card border border-l-4 border-l-[#FF9933] rounded-lg px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer shadow-sm">
                          <span className="font-medium line-clamp-1 max-w-[200px]">{p.title}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}

        {/* Thinking spinner */}
        {sendChat.isPending && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(224,65%,23%)] flex items-center justify-center flex-shrink-0 shadow">
              <Landmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="bg-card border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF9933]" />
              <span className="text-sm text-muted-foreground">JanMitra is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Send error notice ── */}
      {sendChat.isError && !sendChat.isPending && (
        <div className="mx-5 mb-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Could not reach the API server. Make sure the backend is running on port 3000.
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="border-t bg-card px-5 py-4">
        {inputMode === "voice" ? (
          /* ─ Voice mode ─ */
          <div className="flex flex-col items-center gap-3">
            {isSpeaking ? (
              <div className="flex items-center gap-2 text-sm text-[#FF9933] font-medium">
                <Volume2 className="w-4 h-4 animate-pulse" />
                Bot is speaking…
                <button
                  onClick={stopSpeaking}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Stop
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isRecording ? "Listening — speak now" : `Tap mic and ask in ${LANG_LABELS[language] ?? language}`}
              </p>
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={sendChat.isPending || isSpeaking}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse scale-110"
                  : "bg-[#FF9933] text-white hover:bg-[#e88800] hover:scale-105 active:scale-95"
              }`}
            >
              {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            {input && !sendChat.isPending && (
              <div className="w-full max-w-md bg-muted/60 rounded-xl px-4 py-2 text-sm text-foreground/70 text-center border italic">
                "{input}"
              </div>
            )}
          </div>
        ) : (
          /* ─ Text mode ─ */
          <div className="flex gap-2 max-w-4xl mx-auto w-full">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={sendChat.isPending}
              title={isRecording ? "Stop recording" : "Dictate (mic)"}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                isRecording
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-background text-muted-foreground border-border hover:border-[#FF9933] hover:text-[#FF9933]"
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTextSend()}
              placeholder={`Ask in ${LANG_LABELS[language] ?? language}…`}
              className="flex-1 h-10 border-2 focus-visible:ring-0 focus-visible:border-[hsl(224,65%,23%)]"
            />
            <Button
              onClick={handleTextSend}
              disabled={!input.trim() || sendChat.isPending}
              className="bg-[hsl(224,65%,23%)] hover:bg-[hsl(224,65%,18%)] text-white gap-2 h-10 px-5 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
