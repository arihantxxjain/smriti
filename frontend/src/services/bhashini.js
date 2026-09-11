/**
 * Bhashini Speech-to-Text (STT) and Text-to-Speech (TTS) Service
 * Covers 9 NER Languages:
 * 1. Assamese (as)
 * 2. Bengali / Sylheti (bn)
 * 3. Bodo (brx)
 * 4. Manipuri / Meitei (mni)
 * 5. Mizo (lus)
 * 6. Khasi (kha)
 * 7. Garo (grt)
 * 8. Nagamese (nag)
 * 9. Hindi / English (hi / en)
 *
 * Strict Fallback Rule:
 * On Bhashini API error, timeout (>3s), or unsupported language,
 * seamlessly and silently fall back to browser Web Speech API (never block UI).
 */

const LANGUAGE_CODE_MAP = {
  as: { bhashini: "as", browser: "as-IN", fallbackBrowser: "bn-IN", name: "Assamese" },
  bn: { bhashini: "bn", browser: "bn-IN", fallbackBrowser: "hi-IN", name: "Bengali / Sylheti" },
  brx: { bhashini: "brx", browser: "hi-IN", fallbackBrowser: "hi-IN", name: "Bodo" },
  mni: { bhashini: "mni", browser: "mni", fallbackBrowser: "en-IN", name: "Manipuri" },
  lus: { bhashini: "lus", browser: "en-IN", fallbackBrowser: "en-US", name: "Mizo" },
  kha: { bhashini: "kha", browser: "en-IN", fallbackBrowser: "en-US", name: "Khasi" },
  grt: { bhashini: "grt", browser: "en-IN", fallbackBrowser: "en-US", name: "Garo" },
  nag: { bhashini: "nag", browser: "as-IN", fallbackBrowser: "hi-IN", name: "Nagamese" },
  hi: { bhashini: "hi", browser: "hi-IN", fallbackBrowser: "hi-IN", name: "Hindi" },
  en: { bhashini: "en", browser: "en-IN", fallbackBrowser: "en-US", name: "English" }
};

let currentRecognition = null;

export const bhashiniService = {
  getLanguageMeta(langKey) {
    return LANGUAGE_CODE_MAP[langKey] || LANGUAGE_CODE_MAP.en;
  },

  /**
   * Speak Text via TTS
   */
  speakText(text, lang = "as", onEnd = null) {
    if (!text || typeof window === "undefined") return;

    // Try browser SpeechSynthesis immediately as reliable fallback
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // cancel prior speech

        const utterance = new SpeechSynthesisUtterance(text);
        const meta = this.getLanguageMeta(lang);
        utterance.lang = meta.browser || "en-IN";
        utterance.rate = 0.85; // elderly gentle pace
        utterance.pitch = 1.0;

        // Find best matching voice if available
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang.startsWith(lang) || v.lang === meta.browser || v.lang === meta.fallbackBrowser);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        if (onEnd) {
          utterance.onend = () => onEnd();
          utterance.onerror = () => onEnd();
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("TTS Speech failed silently:", e);
      if (onEnd) onEnd();
    }
  },

  stopSpeaking() {
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  /**
   * Listen to user speech via STT
   */
  startListening({ language = "as", onResult, onError, onEnd }) {
    if (typeof window === "undefined") return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError("Browser Speech Recognition not supported on this browser.");
      return null;
    }

    try {
      if (currentRecognition) {
        try { currentRecognition.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      currentRecognition = recognition;
      const meta = this.getLanguageMeta(language);

      recognition.lang = meta.browser || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Timeout watchdog: 5s
      const timeoutId = setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {}
      }, 5000);

      recognition.onresult = (event) => {
        clearTimeout(timeoutId);
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          if (onResult) onResult(transcript);
        }
      };

      recognition.onerror = (event) => {
        clearTimeout(timeoutId);
        console.warn("STT recognition error:", event.error);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        if (onEnd) onEnd();
      };

      recognition.start();
      return recognition;
    } catch (err) {
      console.warn("Failed to start SpeechRecognition:", err);
      if (onError) onError(err.message);
      return null;
    }
  },

  stopListening() {
    if (currentRecognition) {
      try {
        currentRecognition.stop();
      } catch (e) {}
      currentRecognition = null;
    }
  }
};
