import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Award, Volume2, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";
import { bhashiniService } from "../../../services/bhashini";
import { soundEffects } from "../../../utils/soundEffects";
import { useLanguage } from "../../../context/LanguageContext";
import CulturalIcon from "../../common/CulturalIcons";

const OBJECT_IMAGES = {
  gamosa: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  assam_tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
  jackfruit: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&auto=format&fit=crop&q=80",
  bamboo_house: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
  hornbill: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=80",
  bihu_dhol: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&auto=format&fit=crop&q=80",
  jaapi: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80"
};

const DEFAULT_OBJECTS = [
  { id: "gamosa", name: "Gamusa (গামোচা)", english: "Gamosa", hints: ["Red and white woven cotton towel", "Presented as honour in Rongali Bihu"] },
  { id: "assam_tea", name: "Chah (অসম চাহ)", english: "Assam Tea", hints: ["Malty morning tea grown in Brahmaputra valley", "Served with ginger and milk"] },
  { id: "jackfruit", name: "Kothal (কঁঠাল)", english: "Jackfruit", hints: ["Large spiky green fruit with golden sweet bulbs", "Beloved orchard tree fruit"] },
  { id: "bamboo_house", name: "Chang Ghar (চাং ঘৰ)", english: "Bamboo Stilt House", hints: ["Raised wooden stilt house built safe from floodwaters", "Traditional Mising architecture"] },
  { id: "hornbill", name: "Dhanesh (ধনেশ / Hornbill)", english: "Great Indian Hornbill", hints: ["Majestic forest bird with large yellow curved casque", "Celebrated in Nagaland festival"] },
  { id: "bihu_dhol", name: "Dhol (ঢোল)", english: "Bihu Dhol", hints: ["Two-sided folk drum beaten during Bihu dance", "Heartbeat of Assam"] },
  { id: "jaapi", name: "Jaapi (জাপি)", english: "Traditional Sunshade Hat", hints: ["Conical woven bamboo and tokou leaf hat", "Decorated with red and green velvet petals"] }
];

export default function RecognitionGame({ patientId, onBack, onComplete }) {
  const { language, t } = useLanguage();
  const [objects, setObjects] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [responses, setResponses] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isGameOver, setIsGameOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    let items = [];
    try {
      const config = await api.getGameConfig(patientId, "recognition", "medium");
      if (config.objects && config.objects.length >= 4) {
        items = config.objects;
      }
    } catch (e) {}

    if (!items || items.length < 4) {
      items = DEFAULT_OBJECTS;
    }

    setObjects(items);
    setCurrentIdx(0);
    setScore(0);
    setResponses([]);
    setIsGameOver(false);
    setImgError(false);
    setupRound(items, 0);
  };

  const setupRound = (allObjects, index) => {
    if (!allObjects[index]) return;
    const current = allObjects[index];
    const wrongOptions = allObjects.filter((o) => o.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 2);
    const roundOptions = [current, ...wrongOptions].sort(() => Math.random() - 0.5);

    setOptions(roundOptions);
    setSelectedId(null);
    setIsAnswered(false);
    setImgError(false);
    setStartTime(Date.now());
  };

  const handleSelect = (option) => {
    if (isAnswered) return;
    setSelectedId(option.id);
    setIsAnswered(true);

    const currentObj = objects[currentIdx];
    const isCorrect = option.id === currentObj.id;
    const reactionTime = Date.now() - startTime;

    if (isCorrect) {
      soundEffects.playMatch();
      setScore((prev) => prev + 1);
    } else {
      soundEffects.playMismatch();
    }

    const newResponses = [
      ...responses,
      {
        item_id: currentObj.id,
        prompt: Identify ,
        chosen: option.name,
        correct: isCorrect,
        reaction_time_ms: reactionTime
      }
    ];
    setResponses(newResponses);

    setTimeout(() => {
      if (currentIdx + 1 < objects.length) {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setupRound(objects, nextIdx);
      } else {
        finishGame(newResponses, score + (isCorrect ? 1 : 0));
      }
    }, 1800);
  };

  const speakHint = () => {
    const currentObj = objects[currentIdx];
    if (currentObj && currentObj.hints) {
      const hintText = currentObj.hints[0] || currentObj.description || currentObj.name;
      bhashiniService.speakText(hintText, language);
    }
  };

  const finishGame = async (finalResponses, finalScore) => {
    setIsGameOver(true);
    soundEffects.playVictory();

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    const accuracy = Math.round((finalScore / Math.max(1, objects.length)) * 100);
    const completion = 100.0;
    const compositeScore = Math.min(100, Math.max(20, Math.round(accuracy * 0.7 + completion * 0.3)));

    const submitPayload = {
      patient_id: patientId,
      game_type: "recognition",
      difficulty: "medium",
      responses: finalResponses,
      accuracy: accuracy,
      completion: completion,
      composite_score: compositeScore
    };

    try {
      if (navigator.onLine) {
        await api.submitGame(submitPayload);
      } else {
        offlineStorage.queueGameSubmit(submitPayload);
      }
    } catch (e) {
      offlineStorage.queueGameSubmit(submitPayload);
    }

    if (onComplete) onComplete(compositeScore);
  };

  if (objects.length === 0) {
    return <div className="p-8 text-center text-lg font-bold">Loading cultural objects...</div>;
  }

  const currentObj = objects[currentIdx];
  const photoUrl = OBJECT_IMAGES[currentObj.id] || OBJECT_IMAGES.gamosa;

  return (
    <div className="bg-white border-4 border-stone-300 rounded-2xl p-4 sm:p-6 max-w-3xl mx-auto shadow-sm ner-gamusa-border-top">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-200 pb-4 mb-6">
        <button
          onClick={onBack}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-lg text-stone-900"
        >
          <ArrowLeft className="w-5 h-5 text-red-700" />
          <span>{t("back_home")}</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black text-stone-900">
            {t("recognition_game")}
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Item {currentIdx + 1} of {objects.length}
          </span>
        </div>

        <button
          onClick={loadGame}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-lg text-stone-900"
        >
          <RotateCcw className="w-5 h-5 text-stone-700" />
          <span>Reset</span>
        </button>
      </div>

      {!isGameOver ? (
        <div className="max-w-xl mx-auto">
          {/* Object Visual Representation Card */}
          <div className="border-4 border-stone-300 rounded-2xl overflow-hidden mb-6 bg-amber-50/50 flex flex-col items-center shadow-sm">
            <div className="w-full h-64 flex items-center justify-center p-4 bg-white">
              {!imgError ? (
                <img
                  src={photoUrl}
                  alt="Cultural object"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <CulturalIcon id={currentObj.id} className="w-44 h-44" />
              )}
            </div>

            <div className="w-full p-3.5 bg-stone-50 border-t-2 border-stone-200 flex items-center justify-between">
              <span className="text-stone-800 font-bold text-sm sm:text-base">
                Look closely: What is this traditional item?
              </span>
              <button
                onClick={speakHint}
                className="touch-target px-3 py-1.5 text-stone-800 hover:text-red-700 flex items-center gap-1.5 font-bold text-xs bg-stone-200 hover:bg-stone-300 rounded-lg transition-colors border border-stone-300"
              >
                <Volume2 className="w-4 h-4 text-red-700" />
                <span>Hear Clue</span>
              </button>
            </div>
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-3 mb-4">
            {options.map((opt) => {
              let btnStyle = "bg-white border-stone-300 text-stone-900 hover:border-red-600 hover:bg-stone-50";

              if (isAnswered) {
                if (opt.id === currentObj.id) {
                  btnStyle = "bg-emerald-100 border-emerald-600 text-emerald-950 font-black";
                } else if (opt.id === selectedId && opt.id !== currentObj.id) {
                  btnStyle = "bg-red-100 border-red-600 text-red-950 line-through";
                } else {
                  btnStyle = "bg-stone-50 border-stone-200 text-stone-400 opacity-50";
                }
              }

              return (
                <button
                  key={opt.id}
                  data-testid={`recog-opt-${opt.id}`}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`touch-target w-full p-4 text-left border-3 rounded-xl text-xl font-bold flex items-center justify-between transition-all shadow-sm ${btnStyle}`}
                >
                  <span>{opt.name}</span>
                  {isAnswered && opt.id === currentObj.id && <CheckCircle2 className="w-7 h-7 text-emerald-700 flex-shrink-0" />}
                  {isAnswered && opt.id === selectedId && opt.id !== currentObj.id && <XCircle className="w-7 h-7 text-red-700 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Results Celebration */
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-amber-500 shadow-sm">
            <Award className="w-12 h-12" />
          </div>

          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 mb-2">
            সাধুবাদ! (Recognition Complete)
          </h3>
          <p className="text-xl text-stone-700 mb-6 font-bold">
            You accurately recognized <strong className="text-red-700 text-2xl">{score}</strong> out of {objects.length} North Eastern cultural objects.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={loadGame}
              className="touch-target-lg px-8 py-4 bg-red-700 hover:bg-red-800 text-white font-black text-xl rounded-xl border-2 border-red-950 transition-transform active:scale-95 shadow-sm"
            >
              {t("play_again")}
            </button>
            <button
              onClick={onBack}
              className="touch-target-lg px-8 py-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xl rounded-xl border-2 border-stone-400 transition-colors"
            >
              {t("back_home")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
