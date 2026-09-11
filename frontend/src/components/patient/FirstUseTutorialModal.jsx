import React, { useState, useEffect } from "react";
import { KeyRound, MessageSquareHeart, Brain, Clock, AlertTriangle, X, ChevronRight, ChevronLeft, Volume2, CheckCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { bhashiniService } from "../../services/bhashini";
import { soundEffects } from "../../utils/soundEffects";

export default function FirstUseTutorialModal({ isOpen, onClose }) {
  const { language, t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        bhashiniService.stopSpeaking();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slides = [
    {
      id: "code_pin",
      icon: KeyRound,
      color: "bg-red-700 text-white",
      title: language === "as" ? "১. ৰোগী ক’ড আৰু গোপন PIN" : (language === "hi" ? "1. मरीज कोड और गुप्त PIN" : "1. Patient Code & Secret PIN"),
      body: language === "as"
        ? "আপোনাৰ ৬–৮ বৰ্ণৰ গোপন কোড (যেনে DEMO01) আৰু ৪-অংকৰ PIN-এ আপোনাৰ ব্যক্তিগত তথ্য আৰু স্মৃতি সুৰক্ষিত কৰি ৰাখে। ডাঙৰ স্ক্ৰীণ বুটাম ব্যৱহাৰ কৰি সহজে প্ৰৱেশ কৰক।"
        : (language === "hi"
            ? "आपका 6–8 अक्षरों का कोड (जैसे DEMO01) और 4-अंकों का PIN आपकी निजी जानकारी को सुरक्षित रखता है। बड़े कीपैड से आसानी से लॉगिन करें।"
            : "Your 6–8 character patient code (e.g. DEMO01) and 4-digit PIN keep your clinical profile safe. Easily enter using the large on-screen keypad."),
      narration: language === "as"
        ? "আপোনাৰ গোপন ক’ড আৰু পিনৰ জৰিয়তে আপোনাৰ স্মৃতি সুৰক্ষিত থাকে।"
        : (language === "hi"
            ? "आपका कोड और पिन आपकी व्यक्तिगत जानकारी को सुरक्षित रखता है।"
            : "Your confidential patient code and PIN keep your memory aids safe.")
    },
    {
      id: "sathi_ai",
      icon: MessageSquareHeart,
      color: "bg-red-800 text-white",
      title: language === "as" ? "২. সাথী — মৰমিয়াল AI বন্ধু" : (language === "hi" ? "2. साथी — संवेदनशील AI संगी" : "2. Sathi — AI Voice Companion"),
      body: language === "as"
        ? "যিকোনো সময়তে মাইক্ৰ'ফোন চুই অসমীয়া, হিন্দী বা ইংৰাজীত কথা পাতক। সাথীয়ে আপোনাৰ আজিৰ ঔষধ, পৰিয়াল আৰু পুৰণি আনন্দময় স্মৃতিৰ কথা ক'ব।"
        : (language === "hi"
            ? "किसी भी समय माइक छूकर अपनी भाषा में बात करें। साथी आपकी दिनचर्या, परिवार और सुखद स्मृतियों में हमेशा आपका मार्गदर्शन करेगा।"
            : "Tap the microphone anytime to speak naturally in Assamese, Hindi, or English. Sathi answers questions about medications, family members, and grounding memories."),
      narration: language === "as"
        ? "সাথী আপোনাৰ লগত কথা পাতিবলৈ সদায় সাজু আছে।"
        : (language === "hi"
            ? "साथी आपसे बात करने के लिए हमेशा तत्पर है।"
            : "Sathi is always here to listen and talk with you gently.")
    },
    {
      id: "games",
      icon: Brain,
      color: "bg-amber-700 text-white",
      title: language === "as" ? "৩. মনৰ ব্যায়াম আৰু খেল" : (language === "hi" ? "3. मानसिक अभ्यास और खेल" : "3. Cognitive Games & Memory Match"),
      body: language === "as"
        ? "স্মৃতি মিলোৱা খেল (Memory Match), দিনচৰ্যাৰ ক্ৰম আৰু অসমীয়া বস্তু চিনাক্তকৰণ খেল খেলক। প্ৰতিটো খেলত আৰম্ভণিতে ৩ ছেকেণ্ডৰ পৰ্যবেক্ষণ সুযোগ থাকে।"
        : (language === "hi"
            ? "स्मृति मिलान और सांस्कृतिक पहचान खेल खेलें। खेल शुरू होने से पहले 3 सेकंड तक सभी कार्ड देखकर याद रखने का अवसर मिलता है।"
            : "Enjoy Memory Match, Daily Routine Sequencing, and Cultural Recognition. Each game includes an initial 3-second preview so you can easily memorize item locations."),
      narration: language === "as"
        ? "মনৰ সজীৱতাৰ বাবে প্রতিদিনে স্মৃতি খেলবোৰ খেলক।"
        : (language === "hi"
            ? "मस्तिष्क की ताजगी के लिए प्रतिदिन खेल खेलें।"
            : "Play gentle cognitive games daily to keep your mind active.")
    },
    {
      id: "reminders",
      icon: Clock,
      color: "bg-emerald-700 text-white",
      title: language === "as" ? "৪. আজিৰ সময়সূচী আৰু ঔষধ" : (language === "hi" ? "4. आज की दिनचर्या और दवाइयाँ" : "4. Daily Routine & Medications"),
      body: language === "as"
        ? "পুৱাৰ চাহ, দুপৰীয়াৰ আহাৰ আৰু প্ৰয়োজনীয় ঔষধৰ তালিকা চাওক। মাত শুনিবলৈ স্পীকাৰ বুটাম চুব পাৰে আৰু কাম শেষ হ'লে টিক মাৰ্ক দিয়ক।"
        : (language === "hi"
            ? "दवाइयों और चाय-नाश्ते का समय देखें। आवाज में सुनने के लिए स्पीकर बटन दबाएं और कार्य पूरा होने पर टिक लगाएं।"
            : "Check your morning tea, meals, and medications. Tap the speaker icon on any reminder to hear it spoken aloud, and tap to check it off."),
      narration: language === "as"
        ? "আজিৰ ঔষধ আৰু সময়সূচী নিয়মমতে পালন কৰক।"
        : (language === "hi"
            ? "अपनी दिनचर्या और दवाइयों का समय पर पालन करें।"
            : "Keep track of your daily routine and medications on time.")
    },
    {
      id: "sos",
      icon: AlertTriangle,
      color: "bg-red-700 text-white",
      title: language === "as" ? "৫. জৰুৰীকালীন SOS বুটাম" : (language === "hi" ? "5. आपातकालीन SOS बटन" : "5. Emergency SOS Safety"),
      body: language === "as"
        ? "ওপৰৰ সোঁফালৰ ৰঙা SOS বুটামটোৱে আপোনাৰ পৰিয়াল আৰু শুশ্ৰূষাকাৰীলৈ তাৎক্ষণিক সংকেত আৰু GPS অৱস্থান প্ৰেৰণ কৰে। কোনো ভয় নাখাব, সহায় সদায় আপোনাৰ লগত আছে।"
        : (language === "hi"
            ? "ऊपरी लाल SOS बटन दबाते ही आपके परिवार और देखभालकर्ता को आपकी लोकेशन के साथ सूचना पहुँच जाती है।"
            : "The persistent top-right red SOS button immediately dispatches an alert with your GPS coordinates to your registered family emergency contact."),
      narration: language === "as"
        ? "বিপদ বা বিভ্ৰান্তি অনুভৱ হ'লে জৰুৰীকালীন এছ অ' এছ বুটাম চুব পাৰে।"
        : (language === "hi"
            ? "किसी भी आपात स्थिति में लाल एसओएस बटन दबाएं।"
            : "In any emergency or confusion, tap the red SOS button for immediate family support.")
    }
  ];

  const slide = slides[currentSlide];
  const IconComp = slide.icon;

  const handleNext = () => {
    soundEffects.playFlip();
    bhashiniService.stopSpeaking();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    soundEffects.playFlip();
    bhashiniService.stopSpeaking();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSpeakSlide = () => {
    bhashiniService.speakText(slide.narration || slide.body, language);
  };

  const handleComplete = () => {
    bhashiniService.stopSpeaking();
    soundEffects.playMatch();
    try {
      localStorage.setItem("smriti_tutorial_seen", "true");
    } catch (e) {}
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-white border-4 border-red-700 rounded-2xl max-w-xl w-full p-6 sm:p-8 flex flex-col justify-between ner-gamusa-border-top shadow-2xl text-stone-900 animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-200 pb-4 mb-5">
          <div className="flex items-center gap-2 text-stone-600 text-sm font-bold">
            <span>{t("tutorial_title")}</span>
            <span>•</span>
            <span className="font-mono text-red-700 font-black">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>

          <button
            onClick={() => {
              bhashiniService.stopSpeaking();
              onClose();
            }}
            className="touch-target p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 border border-stone-300"
            aria-label="Close tutorial"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="text-center py-4">
          <div className={`w-20 h-20 ${slide.color || "bg-red-700 text-white"} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border-2 border-white ring-4 ring-stone-200`}>
            <IconComp className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h3 id="tutorial-modal-title" className="text-2xl sm:text-3xl font-black text-stone-900 mb-3 leading-tight">
            {slide.title}
          </h3>

          <p className="text-lg sm:text-xl text-stone-700 font-medium leading-relaxed max-w-md mx-auto mb-6">
            {slide.body}
          </p>

          <button
            onClick={handleSpeakSlide}
            className="touch-target inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-900 rounded-xl font-bold text-base transition-colors"
            aria-label="Listen to spoken audio"
          >
            <Volume2 className="w-5 h-5 text-red-700" />
            <span>{t("hear_audio")}</span>
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-2 my-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                soundEffects.playFlip();
                setCurrentSlide(idx);
              }}
              aria-label={`Slide ${idx + 1}`}
              className={`h-3 rounded-full transition-all ${currentSlide === idx ? "w-8 bg-red-700" : "w-3 bg-stone-300 hover:bg-stone-400"}`}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-stone-200 gap-3">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="touch-target px-5 py-3 border-2 border-stone-400 rounded-xl font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-30 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{t("prev_slide")}</span>
          </button>

          {currentSlide < slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="touch-target-lg px-7 py-3 bg-red-700 hover:bg-red-800 text-white font-black text-lg rounded-xl border-2 border-red-950 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <span>{t("next_slide")}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="touch-target-lg px-7 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg rounded-xl border-2 border-emerald-950 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{t("got_it")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
