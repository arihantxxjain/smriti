import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Award } from "lucide-react";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";

export default function AttentionGame({ patientId, onBack, onComplete }) {
  const [rounds, setRounds] = useState([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
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
      const config = await api.getGameConfig(patientId, "attention_spot_difference", "medium");
      if (config.rounds) {
        setRounds(config.rounds);
      }
    } catch (e) {
      setRounds([
        {
          id: "r1",
          prompt: "Which item does NOT belong to traditional Assamese textiles?",
          options: [
            { id: "gamusa", text: "Gamusa (গামোচা)", correct: false },
            { id: "muga", text: "Muga Silk Mekhela", correct: false },
            { id: "plastic", text: "Plastic Shopping Bag", correct: true },
            { id: "eri", text: "Eri Warm Shawl", correct: false }
          ],
          explanation: "Plastic shopping bag is not a traditional Assamese handloom textile."
        },
        {
          id: "r2",
          prompt: "What is the traditional time for drinking fresh morning Assam tea?",
          options: [
            { id: "morn", text: "07:00 AM (Morning)", correct: true },
            { id: "night", text: "11:30 PM (Midnight)", correct: false },
            { id: "deep", text: "02:00 AM (Deep night)", correct: false }
          ],
          explanation: "Morning Assam tea is freshly brewed early in the morning."
        }
      ]);
    }
    setCurrentRoundIdx(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setScore(0);
    setResponses([]);
    setStartTime(Date.now());
    setIsGameOver(false);
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;
    setSelectedOptionId(option.id);
    setIsAnswered(true);

    const reactionTime = Date.now() - startTime;
    const isCorrect = option.correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const currentRound = rounds[currentRoundIdx];
    const newResponses = [
      ...responses,
      {
        item_id: currentRound.id,
        prompt: currentRound.prompt,
        chosen: option.text,
        correct: isCorrect,
        reaction_time_ms: reactionTime
      }
    ];
    setResponses(newResponses);

    setTimeout(() => {
      if (currentRoundIdx + 1 < rounds.length) {
        setCurrentRoundIdx((prev) => prev + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setStartTime(Date.now());
      } else {
        finishGame(newResponses, score + (isCorrect ? 1 : 0));
      }
    }, 1500);
  };

  const finishGame = async (finalResponses, finalScore) => {
    setIsGameOver(true);
    const accuracy = Math.round((finalScore / Math.max(1, rounds.length)) * 100);
    const completion = 100.0;
    const compositeScore = Math.min(100, Math.max(25, Math.round(accuracy * 0.75 + completion * 0.25)));

    const submitPayload = {
      patient_id: patientId,
      game_type: "attention_spot_difference",
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

  if (rounds.length === 0) {
    return <div className="p-8 text-center text-lg font-bold">Loading questions...</div>;
  }

  const currentRound = rounds[currentRoundIdx];

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
          Attention & Focus (মনোযোগ পৰীক্ষা)
        </h2>

        <span className="text-base font-bold bg-stone-100 px-3 py-1 border border-stone-300 rounded text-stone-800">
          Round {currentRoundIdx + 1} / {rounds.length}
        </span>
      </div>

      {!isGameOver ? (
        <div className="max-w-xl mx-auto py-4">
          <div className="bg-stone-50 border-2 border-stone-300 p-5 rounded-lg mb-6 text-center">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1">Question</span>
            <h3 className="text-2xl font-black text-stone-900 leading-snug">
              {currentRound.prompt}
            </h3>
          </div>

          <div className="space-y-4">
            {currentRound.options.map((opt) => {
              let btnStyle = "bg-white border-stone-400 text-stone-900 hover:border-red-600 hover:bg-stone-50";

              if (isAnswered) {
                if (opt.correct) {
                  btnStyle = "bg-emerald-100 border-emerald-700 text-emerald-950 font-black";
                } else if (opt.id === selectedOptionId && !opt.correct) {
                  btnStyle = "bg-red-100 border-red-700 text-red-950 line-through";
                } else {
                  btnStyle = "bg-stone-50 border-stone-300 text-stone-400 opacity-60";
                }
              }

              return (
                <button
                  key={opt.id}
                  data-testid={`attention-opt-${opt.id}`}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswered}
                  className={`touch-target w-full p-4 text-left border-3 rounded-lg text-xl font-bold flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <span>{opt.text}</span>
                  {isAnswered && opt.correct && <CheckCircle2 className="w-7 h-7 text-emerald-700 flex-shrink-0" />}
                  {isAnswered && opt.id === selectedOptionId && !opt.correct && <XCircle className="w-7 h-7 text-red-700 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-4 p-3 bg-stone-100 border border-stone-300 rounded text-center text-sm font-semibold text-stone-700">
              {currentRound.explanation}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <Award className="w-20 h-20 text-amber-600 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-stone-900 mb-2">
            অভিনন্দন! (Great Focus!)
          </h3>
          <p className="text-xl text-stone-700 mb-6 font-medium">
            You scored {score} out of {rounds.length} in the visual attention test.
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
