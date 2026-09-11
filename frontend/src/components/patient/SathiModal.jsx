import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, X, AlertCircle, Heart } from "lucide-react";
import { api } from "../../services/api";
import { bhashiniService } from "../../services/bhashini";
import { useLanguage } from "../../context/LanguageContext";

export default function SathiModal({ patientId, patientName = "Elder", isOpen, onClose }) {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      sender: "sathi",
      text: t("sathi_greeting", { name: patientName }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [distressAlertNotice, setDistressAlertNotice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const closeSathi = () => {
    bhashiniService.stopSpeaking();
    bhashiniService.stopListening();
    setIsListening(false);
    onClose();
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return undefined;
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSathi();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend = inputText) => {
    const clean = textToSend.trim();
    if (!clean || isSending) return;

    const userMsg = {
      sender: "patient",
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const res = await api.chatSathi({
        patient_id: patientId,
        message: clean,
        language: language
      });

      const replyText = res.reply || t("sathi_default_reply");
      const sathiMsg = {
        sender: "sathi",
        text: replyText,
        distress: res.distress_flagged || false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, sathiMsg]);

      if (res.distress_flagged) {
        setDistressAlertNotice(true);
      }

      // Automatically speak Sathi's response
      playTTS(replyText);
    } catch (e) {
      // Calm static fallback message, NEVER raw error!
      const fallbackText = t("sathi_fallback");

      setMessages((prev) => [
        ...prev,
        {
          sender: "sathi",
          text: fallbackText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      playTTS(fallbackText);
    } finally {
      setIsSending(false);
    }
  };

  const playTTS = (text) => {
    setVoiceNotice("Reading Sathi's reply aloud.");
    setIsSpeaking(true);
    bhashiniService.speakText(text, language, () => {
      setIsSpeaking(false);
      setVoiceNotice("Audio finished. You can replay it anytime.");
    });
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      bhashiniService.stopListening();
      setIsListening(false);
      setVoiceNotice("Listening stopped. You can type your message instead.");
    } else {
      setVoiceNotice("Listening now. Speak clearly, then wait for your words to appear.");
      setIsListening(true);
      const recognition = bhashiniService.startListening({
        language: language,
        onResult: (spokenText) => {
          setInputText(spokenText);
          setIsListening(false);
          handleSendMessage(spokenText);
        },
        onError: (err) => {
          console.warn("STT speech error:", err);
          setIsListening(false);
          const message = String(err || "").toLowerCase();
          if (message.includes("not-allowed") || message.includes("permission")) {
            setVoiceNotice("Microphone permission was not granted. Please allow it in your browser, or type your message below.");
          } else if (message.includes("not supported")) {
            setVoiceNotice("Voice input is not supported in this browser. Please type your message below.");
          } else if (message.includes("no-speech")) {
            setVoiceNotice("We did not hear speech. Please try again or type your message.");
          } else {
            setVoiceNotice("Voice input could not start. Please try again or type your message.");
          }
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
      if (!recognition) {
        setIsListening(false);
        setVoiceNotice("Voice input is unavailable here. Please type your message below.");
      }
    }
  };

  return (
    <div
      data-testid="sathi-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
    >
      <div className="bg-white border-4 border-red-700 rounded-lg max-w-2xl w-full flex flex-col h-[85vh] ner-gamusa-border-top text-stone-900">
        {/* Header */}
        <div className="p-4 bg-stone-50 border-b-2 border-stone-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-xl">
              <Heart className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900">
                {t("sathi_title")}
              </h2>
              <p className="text-sm font-medium text-stone-600">
                {t("sathi_subtitle")}
              </p>
            </div>
          </div>

          <button
            data-testid="close-sathi-btn"
            onClick={closeSathi}
            className="touch-target p-2 text-stone-700 hover:text-red-700 hover:bg-stone-200 rounded-md border-2 border-stone-300"
            aria-label="Close Sathi dialogue"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Distress Notice Banner if triggered */}
        {distressAlertNotice && (
          <div className="bg-red-50 border-b-2 border-red-300 p-3 text-red-950 text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
              <span>{t("caregiver_notified")}</span>
            </div>
            <button
              onClick={() => setDistressAlertNotice(false)}
              className="text-xs uppercase underline ml-2 text-red-800"
            >
              {t("dismiss")}
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">{voiceNotice}</div>
        {voiceNotice && (
          <div className="mx-4 mt-3 rounded border-2 border-blue-300 bg-blue-50 p-3 text-sm font-bold text-blue-950" role="status">
            {voiceNotice}
          </div>
        )}
        <div ref={messagesEndRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-xl border-3 ${
                  msg.sender === "patient"
                    ? "bg-stone-900 text-white border-stone-950"
                    : msg.distress
                    ? "bg-amber-50 text-stone-900 border-red-600 ring-2 ring-red-300"
                    : "bg-white text-stone-900 border-red-700"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                    {msg.sender === "patient" ? patientName : "Sathi"}
                  </span>
                  <span className="text-xs opacity-60 font-mono">{msg.time}</span>
                </div>
                <p className="text-xl font-bold leading-relaxed">{msg.text}</p>

                {msg.sender === "sathi" && (
                  <button
                    onClick={() => playTTS(msg.text)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded border border-red-300"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isSpeaking ? t("reading") : t("hear_audio")}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-lg border-2 border-stone-300 text-sm font-bold text-stone-600 animate-pulse">
                {t("sathi_responding")}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t-2 border-stone-300">
          <div className="flex items-center gap-3">
            {/* Mic button with huge tap target */}
            <button
              data-testid="sathi-mic-btn"
              onClick={toggleVoiceInput}
              aria-label={isListening ? "Stop listening" : "Start speaking"}
              className={`touch-target-lg px-5 py-3 rounded-lg border-2 font-bold text-lg flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-700 text-white border-red-900 animate-bounce"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-400"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6 mr-2" />
                  <span>{t("listening")}</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 mr-2 text-red-700" />
                  <span>{t("speak_now")}</span>
                </>
              )}
            </button>

            {/* Text Input */}
            <input
              data-testid="sathi-input"
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={t("type_message")}
              className="flex-1 touch-target border-2 border-stone-400 rounded-lg px-4 py-2 text-lg font-medium text-stone-900 focus:outline-none focus:border-red-700"
            />

            {/* Send button */}
            <button
              data-testid="sathi-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="touch-target px-6 py-3 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white font-bold text-lg rounded-lg border-2 border-red-950 flex items-center justify-center"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
