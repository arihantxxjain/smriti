import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle, RotateCcw, Sun, Coffee, Pill, Utensils, Footprints, Moon, Check, AlertCircle, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";
import { soundEffects } from "../../../utils/soundEffects";
import { useLanguage } from "../../../context/LanguageContext";

const STEP_ICONS = {
  Sun: Sun,
  Coffee: Coffee,
  Pill: Pill,
  Utensils: Utensils,
  Footprints: Footprints,
  Moon: Moon
};

export default function RoutineSequencingGame({ patientId, onBack, onComplete }) {
  const { t } = useLanguage();
  const [steps, setSteps] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    let initialSteps = [];
    try {
      const config = await api.getGameConfig(patientId, "daily_routine", "medium");
      if (config.steps && config.steps.length >= 4) {
        initialSteps = config.steps;
      }
    } catch (e) {}

    if (!initialSteps || initialSteps.length < 4) {
      initialSteps = [
        { id: "s1", label: "Wake up & morning stretch (06:15)", order: 1, icon: "Sun" },
        { id: "s2", label: "Fresh morning ginger Assam tea", order: 2, icon: "Coffee" },
        { id: "s3", label: "Take morning Donepezil medication (08:00)", order: 3, icon: "Pill" },
        { id: "s4", label: "Midday lunch & quiet rest (13:00)", order: 4, icon: "Utensils" },
        { id: "s5", label: "Evening walk around garden (16:45)", order: 5, icon: "Footprints" },
        { id: "s6", label: "Bedtime BP tablet & rest (21:30)", order: 6, icon: "Moon" }
      ];
    }

    const scrambled = [...initialSteps].sort(() => Math.random() - 0.5);
    setSteps(scrambled);
    setStartTime(Date.now());
    setIsSubmitted(false);
    setScore(0);
  };

  const moveStep = (index, direction) => {
    if (isSubmitted) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    soundEffects.playFlip();

    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;
    setSteps(newSteps);
  };

  const handleCheckOrder = async () => {
    setIsSubmitted(true);
    const reactionTime = Date.now() - startTime;

    let correctCount = 0;
    steps.forEach((step, idx) => {
      if (step.order === idx + 1) {
        correctCount += 1;
      }
    });

    const accuracy = Math.round((correctCount / Math.max(1, steps.length)) * 100);
    const completion = 100.0;
    const compositeScore = Math.min(100, Math.max(30, Math.round(accuracy * 0.75 + completion * 0.25)));
    setScore(compositeScore);

    if (compositeScore >= 70) {
      soundEffects.playVictory();
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } else {
      soundEffects.playMatch();
    }

    const submitPayload = {
      patient_id: patientId,
      game_type: "daily_routine",
      difficulty: "medium",
      responses: steps.map((s, idx) => ({
        item_id: s.id,
        prompt: Step ,
        chosen: s.label,
        correct: s.order === idx + 1,
        reaction_time_ms: reactionTime
      })),
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

  return (
    <div className="bg-white border-4 border-stone-300 rounded-2xl p-4 sm:p-6 max-w-3xl mx-auto shadow-sm ner-gamusa-border-top">
      {/* Top Bar */}
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
            {t("routine_game")}
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            Sequencing • Morning to Night
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

      {!isSubmitted ? (
        <>
          <p className="text-lg font-bold text-stone-700 mb-6 text-center">
            {t("routine_game_desc")}: Use Up and Down arrows to arrange tasks in order.
          </p>

          <div className="space-y-3 max-w-xl mx-auto mb-8">
            {steps.map((step, idx) => {
              const IconComp = STEP_ICONS[step.icon] || Sun;

              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3.5 bg-stone-50 hover:bg-amber-50/50 border-2 border-stone-300 rounded-xl gap-3 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-red-700 text-white font-black flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                      {idx + 1}
                    </span>
                    <div className="p-2 bg-white rounded-lg border border-stone-200 text-amber-800 flex-shrink-0">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-bold text-stone-900 leading-tight">
                      {step.label}
                    </span>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      data-testid={`routine-up-${idx}`}
                      onClick={() => moveStep(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move item earlier"
                      className="touch-target p-2.5 border-2 border-stone-400 rounded-lg bg-white hover:bg-stone-200 active:bg-stone-300 disabled:opacity-25 transition-colors"
                    >
                      <ArrowUp className="w-6 h-6 text-stone-900 stroke-[2.5]" />
                    </button>
                    <button
                      data-testid={`routine-down-${idx}`}
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === steps.length - 1}
                      aria-label="Move item later"
                      className="touch-target p-2.5 border-2 border-stone-400 rounded-lg bg-white hover:bg-stone-200 active:bg-stone-300 disabled:opacity-25 transition-colors"
                    >
                      <ArrowDown className="w-6 h-6 text-stone-900 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              data-testid="routine-submit-btn"
              onClick={handleCheckOrder}
              className="touch-target-lg px-10 py-4 bg-red-700 hover:bg-red-800 text-white font-black text-xl rounded-xl border-2 border-red-950 transition-transform active:scale-95 shadow-sm"
            >
              Check My Routine (ক্ৰম পৰীক্ষা কৰক)
            </button>
          </div>
        </>
      ) : (
        /* Results Breakdown Screen */
        <div className="text-center py-6 max-w-xl mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500 shadow-sm">
            <Trophy className="w-12 h-12" />
          </div>

          <h3 className="text-3xl font-black text-stone-900 mb-2">
            সুন্দৰ! Routine Sequencing Complete
          </h3>
          <p className="text-xl text-stone-700 mb-6 font-bold">
            Cognitive Score: <span className="text-emerald-700 text-3xl font-black">{score}</span> / 100
          </p>

          {/* Step verification summary */}
          <div className="space-y-2 mb-8 text-left">
            {steps.map((step, idx) => {
              const isCorrect = step.order === idx + 1;
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border-2 flex items-center justify-between text-base font-bold ${isCorrect ? "bg-emerald-50 border-emerald-400 text-emerald-950" : "bg-amber-50 border-amber-400 text-amber-950"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono">#{idx + 1}</span>
                    <span>{step.label}</span>
                  </span>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-emerald-700 text-sm font-black">
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-700 text-sm font-bold">
                      <AlertCircle className="w-5 h-5" />
                      <span>Expected #{step.order}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

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
