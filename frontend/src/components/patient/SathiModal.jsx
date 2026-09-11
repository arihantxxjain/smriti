import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, X, AlertCircle, Heart, Sparkles, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";
import { bhashiniService } from "../../services/bhashini";
import { soundEffects } from "../../utils/soundEffects";
import { useLanguage } from "../../context/LanguageContext";

export default function SathiModal({ patientId, patientName = "Elder", isOpen, onClose }) {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      sender: "sathi",
      text: language === "as" 
        ? `নমস্কাৰ ${patientName} ডাঙৰীয়া! মই আপোনাৰ বন্ধু সাথী। আজি আপোনাৰ মনটো কেনে লাগিছে?` 
        : (language === "hi" 
            ? `नमस्ते ${patientName} जी! मैं आपका संगी साथी हूँ। आज आप कैसा महसूस कर रहे हैं?` 
            : `Namaskar ${patientName}! I am your companion Sathi. How are you feeling today?`),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [distressAlertNotice, setDistressAlertNotice] = useState(false);
  const [micError, setMicError] = useState(null);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    {
      label: language === "as" ? "💊 মোৰ ঔষধ কি?" : language === "hi" ? "💊 मेरी दवाई क्या है?" : "💊 What are my medicines?",
      query: language === "as" ? "মোৰ আজিৰ ঔষধ কি কি?" : language === "hi" ? "मेरी आज की दवाइयाँ क्या हैं?" : "What medicines do I take today?"
    },
    {
      label: language === "as" ? "👨‍👩‍👧 মোৰ পৰিয়াল কোন?" : language === "hi" ? "👨‍👩‍👧 मेरा परिवार कौन है?" : "👨‍👩‍👧 Who is my family?",
      query: language === "as" ? "মোৰ পৰিয়ালৰ সদস্যসকল কোন?" : language === "hi" ? "मेरे परिवार के सदस्य कौन हैं?" : "Tell me about my family members."
    },
    {
      label: language === "as" ? "🏡 মই ক'ত থাকোঁ?" : language === "hi" ? "🏡 मैं कहाँ रहता हूँ?" : "🏡 Where do I live?",
      query: language === "as" ? "মোৰ ঘৰ ক'ত?" : language === "hi" ? "मेरा घर कहाँ है?" : "Where is my home located?"
    },
    {
      label: language === "as" ? "🎮 এটা খেল খেলোঁচোন" : language === "hi" ? "🎮 एक खेल खेलते हैं" : "🎮 Let's play a game",
      query: language === "as" ? "মই স্মৃতি খেলিব বিচাৰোঁ" : language === "hi" ? "मैं मेमोरी गेम खेलना चाहता हूँ" : "What games can we play together?"
    }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend = inputText) => {
    const clean = textToSend.trim();
    if (!clean || isSending) return;

    soundEffects.playTap();

    const userMsg = {
      sender: "patient",
      text: clean,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);
    setMicError(null);

    try {
      const res = await api.chatSathi({
        patient_id: patientId,
        message: clean,
        language: language
      });

      const replyText = res.reply || (language === "as" ? "মই সদায় আপোনাৰ লগত আছো।" : "I am always here with you.");
      const sathiMsg = {
        sender: "sathi",
        text: replyText,
        distress: res.distress_flagged || false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      soundEffects.playChime();
      setMessages((prev) => [...prev, sathiMsg]);

      if (res.distress_flagged) {
        setDistressAlertNotice(true);
      }

      // Automatically speak Sathi's response
      playTTS(replyText);
    } catch (e) {
      // Calm static fallback message, NEVER raw error!
      const fallbackText = language === "as"
        ? "মই আপোনাৰ লগত আছো। আপুনি আপোনাৰ নিজৰ ঘৰতে সুৰক্ষিত আছে। চিন্তা নকৰিব।"
        : (language === "hi"
            ? "मैं आपके साथ हूँ। आप अपने घर पर सुरक्षित हैं। बिल्कुल चिंता न करें।"
            : "I am right here with you. You are safe at home. Everything is well.");

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
    setIsSpeaking(true);
    bhashiniService.speakText(text, language, () => {
      setIsSpeaking(false);
    });
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      soundEffects.playTap();
      bhashiniService.stopListening();
      setIsListening(false);
    } else {
      setMicError(null);
      soundEffects.playMicStart();
      setIsListening(true);
      
      const recognition = bhashiniService.startListening({
        language: language,
        onResult: (spokenText) => {
          setIsListening(false);
          if (spokenText) {
            setInputText(spokenText);
            handleSendMessage(spokenText);
          }
        },
        onError: (err) => {
          setIsListening(false);
          if (err === "not-allowed" || err === "permission-denied") {
            setMicError(t("mic_blocked_hint"));
          } else if (err === "no-speech") {
            setMicError("No speech heard. Please tap Speak and try again.");
          } else {
            setMicError("Microphone input was interrupted. You can also type below.");
          }
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      if (!recognition) {
        setIsListening(false);
        setMicError(t("browser_no_mic"));
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
      <div className="bg-white border-4 border-red-700 rounded-2xl max-w-2xl w-full flex flex-col h-[88vh] shadow-2xl overflow-hidden ner-gamusa-border-top text-stone-900">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-50 via-stone-50 to-amber-50 border-b-2 border-stone-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-xl shadow-md">
              <Heart className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-stone-900">
                  {t("sathi_title")}
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  Context-Aware
                </span>
              </div>
              <p className="text-sm font-medium text-stone-600">
                {t("sathi_subtitle")}
              </p>
            </div>
          </div>

          <button
            data-testid="close-sathi-btn"
            onClick={() => {
              soundEffects.playTap();
              bhashiniService.stopSpeaking();
              bhashiniService.stopListening();
              onClose();
            }}
            className="touch-target p-2 text-stone-700 hover:text-red-700 hover:bg-red-50 rounded-xl border-2 border-stone-300 transition-colors"
            aria-label="Close Sathi dialogue"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Distress Notice Banner if triggered */}
        {distressAlertNotice && (
          <div className="bg-red-50 border-b-2 border-red-300 p-3 text-red-950 text-sm font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
              <span>Caregiver notified of discomfort or confusion. Reassuring support is active.</span>
            </div>
            <button
              onClick={() => setDistressAlertNotice(false)}
              className="text-xs uppercase underline ml-2 text-red-800 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Microphone Warning Banner if blocked */}
        {micError && (
          <div className="bg-amber-50 border-b-2 border-amber-300 p-3 text-amber-950 text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span>{micError}</span>
            </div>
            <button
              onClick={() => setMicError(null)}
              className="text-xs underline text-amber-900 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="bg-stone-100/90 px-4 py-2 border-b border-stone-200 overflow-x-auto flex gap-2 items-center text-xs font-semibold text-stone-700 scrollbar-none">
          <span className="text-stone-500 uppercase tracking-wide shrink-0">Suggestions:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.query)}
              className="shrink-0 bg-white hover:bg-red-50 hover:text-red-900 hover:border-red-300 px-3 py-1.5 rounded-full border border-stone-300 shadow-sm transition-all"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div ref={messagesEndRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm border-2 ${
                  msg.sender === "patient"
                    ? "bg-stone-900 text-white border-stone-950"
                    : msg.distress
                    ? "bg-amber-50 text-stone-900 border-red-600 ring-2 ring-red-300"
                    : "bg-white text-stone-900 border-red-200 shadow"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                    {msg.sender === "patient" ? patientName : "Sathi (সাথী)"}
                  </span>
                  <span className="text-xs opacity-60 font-mono">{msg.time}</span>
                </div>
                <p className="text-xl font-bold leading-relaxed">{msg.text}</p>

                {msg.sender === "sathi" && (
                  <button
                    onClick={() => playTTS(msg.text)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4 text-red-700" />
                    <span>Hear Audio</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl border-2 border-stone-300 text-sm font-bold text-stone-600 shadow-sm flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                <span>Sathi is thinking & checking context...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t-2 border-stone-300 space-y-2">
          {/* Active Listening Visualizer Bar */}
          {isListening && (
            <div className="flex items-center justify-between bg-red-700 text-white px-4 py-2.5 rounded-xl shadow-inner animate-pulse">
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-1 h-6">
                  <span className="w-1.5 h-3 bg-white rounded-full animate-wave-1"></span>
                  <span className="w-1.5 h-6 bg-white rounded-full animate-wave-2"></span>
                  <span className="w-1.5 h-4 bg-white rounded-full animate-wave-3"></span>
                  <span className="w-1.5 h-6 bg-white rounded-full animate-wave-4"></span>
                  <span className="w-1.5 h-2 bg-white rounded-full animate-wave-5"></span>
                </div>
                <span className="text-sm font-black tracking-wide">
                  Listening to your voice... Speak clearly into your microphone
                </span>
              </div>
              <button
                onClick={toggleVoiceInput}
                className="text-xs uppercase font-bold bg-white text-red-800 px-2 py-1 rounded shadow"
              >
                Stop
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Mic button with huge tap target & lively style */}
            <button
              data-testid="sathi-mic-btn"
              onClick={toggleVoiceInput}
              aria-label={isListening ? "Stop listening" : "Start speaking"}
              className={`touch-target-lg px-5 py-3 rounded-xl border-2 font-bold text-lg flex items-center justify-center transition-all shadow-sm ${
                isListening
                  ? "bg-red-700 text-white border-red-950 ring-4 ring-red-300 animate-pulse"
                  : "bg-gradient-to-r from-red-50 to-amber-50 hover:from-red-100 hover:to-amber-100 text-red-900 border-red-300 active:scale-95"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6 mr-2 text-white" />
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
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={t("type_message")}
              className="flex-1 touch-target border-2 border-stone-300 hover:border-stone-400 rounded-xl px-4 py-3 text-lg font-medium text-stone-900 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-200 transition-all"
            />

            {/* Send button */}
            <button
              data-testid="sathi-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="touch-target px-6 py-3 bg-red-700 hover:bg-red-800 active:scale-95 disabled:opacity-40 text-white font-bold text-lg rounded-xl border-2 border-red-950 flex items-center justify-center shadow-md transition-all"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

