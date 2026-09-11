import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle, RotateCcw, Sun, Coffee, Pill, Utensils, Footprints, Moon } from "lucide-react";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";

const STEP_ICONS = {
  Sun: Sun,
  Coffee: Coffee,
  Pill: Pill,
  Utensils: Utensils,
  Footprints: Footprints,
  Moon: Moon
};

export default function RoutineSequencingGame({ patientId, onBack, onComplete }) {
  const [steps, setSteps] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      const config = await api.getGameConfig(patientId, "daily_routine", "medium");
      if (config.steps) {
        // Scramble order for the challenge
        const scrambled = [...config.steps].sort(() => Math.random() - 0.5);
        setSteps(scrambled);
      }
    } catch (e) {
      setSteps([
        { id: "s1", label: "Wake up & morning stretch (06:15)", order: 1, icon: "Sun" },
        { id: "s2", label: "Fresh morning ginger Assam tea", order: 2, icon: "Coffee" },
        { id: "s3", label: "Take morning Donepezil medication (08:00)", order: 3, icon: "Pill" },
        { id: "s4", label: "Midday lunch & quiet rest (13:00)", order: 4, icon: "Utensils" },
        { id: "s5", label: "Evening walk around garden (16:45)", order: 5, icon: "Footprints" },
        { id: "s6", label: "Bedtime BP tablet & rest (21:30)", order: 6, icon: "Moon" }
      ].sort(() => Math.random() - 0.5));
    }
    setStartTime(Date.now());
    setIsSubmitted(false);
    setScore(0);
  };

  const moveStep = (index, direction) => {
    if (isSubmitted) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;
    setSteps(newSteps);
  };

  const handleCheckOrder = async () => {
    setIsSubmitted(true);
    const reactionTime = Date.now() - startTime;

    // Calculate how many items are in correct relative or absolute order
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

    const submitPayload = {
      patient_id: patientId,
      game_type: "daily_routine",
      difficulty: "medium",
      responses: steps.map((s, idx) => ({
        item_id: s.id,
        prompt: `Step ${idx + 1}`,
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
          Daily Routine Sequencing (দৈনিক কামৰ ক্ৰম)
        </h2>

        <button
          onClick={loadGame}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-md text-stone-900"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset</span>
        </button>
      </div>

      {!isSubmitted ? (
        <>
          <p className="text-lg font-medium text-stone-700 mb-6 text-center">
            Use the Up and Down arrows to arrange your daily activities in order from morning to bedtime.
          </p>

          <div className="space-y-3 max-w-xl mx-auto mb-8">
            {steps.map((step, idx) => {
              const IconComp = STEP_ICONS[step.icon] || Sun;

              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3.5 bg-stone-50 border-2 border-stone-400 rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {idx + 1}
                    </span>
                    <IconComp className="w-6 h-6 text-stone-700 flex-shrink-0" />
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
                      className="touch-target p-2 border-2 border-stone-400 rounded bg-white hover:bg-stone-200 disabled:opacity-30"
                    >
                      <ArrowUp className="w-5 h-5 text-stone-900" />
                    </button>
                    <button
                      data-testid={`routine-down-${idx}`}
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === steps.length - 1}
                      aria-label="Move item later"
                      className="touch-target p-2 border-2 border-stone-400 rounded bg-white hover:bg-stone-200 disabled:opacity-30"
                    >
                      <ArrowDown className="w-5 h-5 text-stone-900" />
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
              className="touch-target-lg px-10 py-4 bg-red-700 hover:bg-red-800 text-white font-black text-xl rounded-lg border-2 border-red-950"
            >
              Check My Routine (ক্ৰম পৰীক্ষা কৰক)
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <CheckCircle className="w-20 h-20 text-emerald-700 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-stone-900 mb-2">
            সুন্দৰ! (Routine Completed)
          </h3>
          <p className="text-xl text-stone-700 mb-6 font-medium">
            Cognitive Sequencing Score: <strong>{score} / 100</strong>.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={loadGame}
              className="touch-target px-8 py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-lg rounded-md border-2 border-red-900"
            >
              Try Again
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
