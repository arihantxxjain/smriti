import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Award, Volume2 } from "lucide-react";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";
import { bhashiniService } from "../../../services/bhashini";
import { useLanguage } from "../../../context/LanguageContext";

// High-resolution real cultural imagery representations
const OBJECT_IMAGES = {
  gamosa: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  assam_tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
  jackfruit: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&auto=format&fit=crop&q=80",
  bamboo_house: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
  hornbill: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=80",
  bihu_dhol: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&auto=format&fit=crop&q=80",
  jaapi: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80"
};

export default function RecognitionGame({ patientId, onBack, onComplete }) {
  const { language } = useLanguage();
  const [objects, setObjects] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [responses, setResponses] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      const config = await api.getGameConfig(patientId, "recognition", "medium");
      if (config.objects && config.objects.length > 0) {
        setObjects(config.objects);
        setupRound(config.objects, 0);
      }
    } catch (e) {
      // Offline fallback
      const fallback = [
        { id: "gamosa", name: "Gamusa (গামোচা)", english: "Gamosa", hints: ["Red and white woven cloth", "Worn in Rongali Bihu"] },
        { id: "assam_tea", name: "Chah (অসম চাহ)", english: "Assam Tea", hints: ["Warm morning cup", "Grown in Assam tea gardens"] },
        { id: "jackfruit", name: "Kothal (কঁঠাল)", english: "Jackfruit", hints: ["Large sweet orchard fruit", "Golden sweet bulbs"] },
        { id: "bihu_dhol", name: "Dhol (ঢোল)", english: "Bihu Dhol", hints: ["Folk drum played in Bihu"] }
      ];
      setObjects(fallback);
      setupRound(fallback, 0);
    }
    setCurrentIdx(0);
    setScore(0);
    setResponses([]);
    setIsGameOver(false);
  };

  const setupRound = (allObjects, index) => {
    if (!allObjects[index]) return;
    const current = allObjects[index];
    const wrongOptions = allObjects.filter((o) => o.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 2);
    const roundOptions = [current, ...wrongOptions].sort(() => Math.random() - 0.5);

    setOptions(roundOptions);
    setSelectedId(null);
    setIsAnswered(false);
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
      setScore((prev) => prev + 1);
    }

    const newResponses = [
      ...responses,
      {
        item_id: currentObj.id,
        prompt: `Identify ${currentObj.name}`,
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
    <div className="bg-white border-2 border-stone-300 rounded-lg p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b-2 border-stone-200 pb-4 mb-6">
        <button
          onClick={onBack}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-md text-stone-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <h2 className="text-2xl font-black text-stone-900">
          Cultural Recognition (চিনাকি বস্তুৰ খেল)
        </h2>

        <span className="text-base font-bold bg-stone-100 px-3 py-1 border border-stone-300 rounded text-stone-800">
          Item {currentIdx + 1} / {objects.length}
        </span>
      </div>

      {!isGameOver ? (
        <div className="max-w-xl mx-auto">
          {/* Object Photo */}
          <div className="border-4 border-stone-400 rounded-lg overflow-hidden mb-6 bg-stone-100 flex flex-col items-center">
            <img
              src={photoUrl}
              alt="Cultural object to recognize"
              className="w-full h-64 object-cover"
            />
            <div className="w-full p-3 bg-stone-50 border-t-2 border-stone-300 flex items-center justify-between">
              <span className="text-stone-700 font-bold text-sm">Look closely: What is this traditional item?</span>
              <button
                onClick={speakHint}
                className="touch-target p-2 text-stone-700 hover:text-red-700 flex items-center gap-1 font-bold text-xs bg-stone-200 hover:bg-stone-300 rounded"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear Clue</span>
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-4">
            {options.map((opt) => {
              let btnStyle = "bg-white border-stone-400 text-stone-900 hover:border-red-600 hover:bg-stone-50";

              if (isAnswered) {
                if (opt.id === currentObj.id) {
                  btnStyle = "bg-emerald-100 border-emerald-700 text-emerald-950 font-black";
                } else if (opt.id === selectedId && opt.id !== currentObj.id) {
                  btnStyle = "bg-red-100 border-red-700 text-red-950 line-through";
                } else {
                  btnStyle = "bg-stone-50 border-stone-300 text-stone-400 opacity-60";
                }
              }

              return (
                <button
                  key={opt.id}
                  data-testid={`recog-opt-${opt.id}`}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`touch-target w-full p-4 text-left border-3 rounded-lg text-xl font-bold flex items-center justify-between transition-all ${btnStyle}`}
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
        <div className="text-center py-10">
          <Award className="w-20 h-20 text-amber-600 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-stone-900 mb-2">
            সাধুবাদ! (Recognition Complete)
          </h3>
          <p className="text-xl text-stone-700 mb-6 font-medium">
            You accurately recognized <strong>{score} out of {objects.length}</strong> North Eastern cultural objects.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={loadGame}
              className="touch-target px-8 py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-lg rounded-md border-2 border-red-900"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="touch-target px-8 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-lg rounded-md border-2 border-stone-400"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
