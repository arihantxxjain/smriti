import React, { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, CheckCircle, Eye, Sparkles, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";
import { soundEffects } from "../../../utils/soundEffects";
import { useLanguage } from "../../../context/LanguageContext";
import CulturalIcon from "../../common/CulturalIcons";

const CULTURAL_PAIRS = [
  { id: "gamosa", name: "Gamusa (গামোচা)", english: "Assamese Woven Towel" },
  { id: "assam_tea", name: "Chah (অসম চাহ)", english: "Assam Orthodox Tea" },
  { id: "jackfruit", name: "Kothal (কঁঠাল)", english: "Native Jackfruit" },
  { id: "bamboo_house", name: "Chang Ghar (চাং ঘৰ)", english: "Bamboo Stilt House" },
  { id: "hornbill", name: "Dhanesh (ধনেশ)", english: "Great Indian Hornbill" },
  { id: "bihu_dhol", name: "Dhol (ঢোল)", english: "Rongali Bihu Drum" }
];

export default function MemoryMatchGame({ patientId, onBack, onComplete }) {
  const { t } = useLanguage();
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [responses, setResponses] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [flipsCount, setFlipsCount] = useState(0);

  // Clinical Memorization Preview Countdown (3 seconds at start)
  const [isPreviewing, setIsPreviewing] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(3);
  const [peekAvailable, setPeekAvailable] = useState(true);

  useEffect(() => {
    loadGame();
  }, []);

  // Countdown timer for preview phase
  useEffect(() => {
    let timer;
    if (isPreviewing && previewCountdown > 0) {
      timer = setInterval(() => {
        setPreviewCountdown((prev) => {
          if (prev <= 1) {
            setIsPreviewing(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPreviewing, previewCountdown]);

  const loadGame = async () => {
    // Construct 6 pairs (12 cards)
    let initialCards = [];
    try {
      const config = await api.getGameConfig(patientId, "memory_match", "medium");
      if (config.cards && config.cards.length >= 8) {
        initialCards = config.cards.map((c, i) => ({
          id: `${c.pair_id || c.id}_${i}`,
          pair_id: c.pair_id || c.id,
          name: c.name,
          icon: c.pair_id || c.icon || "gamosa"
        }));
      }
    } catch (e) {
      // Fallback
    }

    if (!initialCards || initialCards.length < 8) {
      initialCards = [];
      CULTURAL_PAIRS.forEach((item) => {
        initialCards.push({ id: `${item.id}_a`, pair_id: item.id, name: item.name, english: item.english, icon: item.id });
        initialCards.push({ id: `${item.id}_b`, pair_id: item.id, name: item.name, english: item.english, icon: item.id });
      });
    }

    // Shuffle cards
    const shuffled = [...initialCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedIds([]);
    setStartTime(Date.now());
    setResponses([]);
    setIsFinished(false);
    setFlipsCount(0);
    setPeekAvailable(true);

    // Trigger 3-second preview
    setIsPreviewing(true);
    setPreviewCountdown(3);
  };

  const handleCardClick = (index) => {
    if (isPreviewing || isFinished) return;
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].pair_id)) {
      return;
    }

    soundEffects.playFlip();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    setFlipsCount((prev) => prev + 1);

    if (newFlipped.length === 2) {
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];
      const reactionTime = Date.now() - startTime;
      const isMatch = card1.pair_id === card2.pair_id;

      setResponses((prev) => [
        ...prev,
        {
          item_id: card1.pair_id,
          prompt: Match ,
          chosen: card2.name,
          correct: isMatch,
          reaction_time_ms: reactionTime
        }
      ]);

      if (isMatch) {
        soundEffects.playMatch();
        const newMatched = [...matchedIds, card1.pair_id];
        setMatchedIds(newMatched);
        setFlippedIndices([]);

        const totalPairs = cards.length / 2;
        if (newMatched.length === totalPairs) {
          finishGame(newMatched.length, totalPairs, flipsCount + 1);
        }
      } else {
        soundEffects.playMismatch();
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const handlePeekHint = () => {
    if (isPreviewing || !peekAvailable || isFinished) return;
    soundEffects.playFlip();
    setPeekAvailable(false);
    setIsPreviewing(true);
    setPreviewCountdown(2);
  };

  const finishGame = async (matchedCount, totalPairs, totalFlips) => {
    setIsFinished(true);
    soundEffects.playVictory();

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const accuracy = Math.round((totalPairs / Math.max(totalPairs, totalFlips / 2)) * 100);
    const completion = 100.0;
    const compositeScore = Math.min(100, Math.max(30, Math.round(accuracy * 0.7 + completion * 0.3)));

    const submitPayload = {
      patient_id: patientId,
      game_type: "memory_match",
      difficulty: "medium",
      responses: responses,
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

  const totalPairs = cards.length / 2;
  const progressPercent = totalPairs > 0 ? Math.round((matchedIds.length / totalPairs) * 100) : 0;

  return (
    <div className="bg-white border-4 border-stone-300 rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto shadow-sm ner-gamusa-border-top">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b-2 border-stone-200 pb-4 mb-4">
        <button
          data-testid="game-back-btn"
          onClick={onBack}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-lg text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-red-700" />
          <span>{t("back_home")}</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
            {t("memory_match")}
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded">
            Cultural Pairs • SIH26003
          </span>
        </div>

        <button
          data-testid="game-restart-btn"
          onClick={loadGame}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-lg text-stone-900 transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-stone-700" />
          <span>Restart</span>
        </button>
      </div>

      {/* Preview Countdown Banner */}
      {isPreviewing && (
        <div className="mb-6 p-4 bg-amber-50 border-3 border-amber-400 rounded-xl text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 text-amber-900 font-black text-lg sm:text-xl">
            <Sparkles className="w-6 h-6 text-amber-600" />
            <span>{t("preview_title")}</span>
          </div>
          <p className="text-sm font-bold text-amber-800 mt-1">
            {t("preview_desc")}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-amber-600 text-white rounded-full font-black text-base shadow-sm">
            <span>{t("preview_countdown")}</span>
            <span className="text-2xl font-mono">{previewCountdown}s</span>
          </div>
        </div>
      )}

      {!isFinished ? (
        <>
          {/* Progress and Live Counter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-stone-800">
                {t("pairs_matched")} <strong className="text-red-700 text-xl">{matchedIds.length}</strong> / {totalPairs}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-base font-bold text-stone-600">
                {t("flips_count")} <strong>{flipsCount}</strong>
              </span>
            </div>

            {/* Hint / Peek Button */}
            {!isPreviewing && (
              <button
                onClick={handlePeekHint}
                disabled={!peekAvailable}
                className={`touch-target px-4 py-2 rounded-lg border-2 font-bold text-sm flex items-center gap-1.5 transition-all ${
                  peekAvailable
                    ? "bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-900 shadow-sm active:scale-95"
                    : "bg-stone-100 border-stone-300 text-stone-400 cursor-not-allowed"
                }`}
              >
                <Eye className="w-4 h-4 text-amber-700" />
                <span>{peekAvailable ? t("peek_hint") : "Hint Used"}</span>
              </button>
            )}
          </div>

          {/* 12 Cards Grid (3x4 or 4x3) with 3D Flip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 max-w-3xl mx-auto">
            {cards.map((card, idx) => {
              const isMatched = matchedIds.includes(card.pair_id);
              const isFlipped = isPreviewing || isMatched || flippedIndices.includes(idx);

              return (
                <div
                  key={`${card.id}_${idx}`}
                  className="perspective-1000 h-36 sm:h-40"
                >
                  <button
                    data-testid={`memory-card-${idx}`}
                    onClick={() => handleCardClick(idx)}
                    disabled={isMatched || isPreviewing}
                    aria-label={isFlipped ? card.name : "Hidden card"}
                    className={`w-full h-full rounded-xl transition-transform duration-500 preserve-3d border-4 flex flex-col items-center justify-center p-2 relative ${
                      isFlipped
                        ? "rotate-y-180 border-red-700 bg-white shadow-md"
                        : "bg-gradient-to-br from-red-700 via-rose-800 to-red-900 border-yellow-400 shadow-sm"
                    }`}
                  >
                    {/* Front Face (Cultural Graphic + Name) */}
                    <div
                      className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-between p-2.5 rounded-lg bg-white"
                    >
                      <div className="w-full flex justify-end">
                        {isMatched ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-stone-400">Card</span>
                        )}
                      </div>

                      <div className="flex-1 flex items-center justify-center my-1">
                        <CulturalIcon id={card.icon || card.pair_id} className="w-16 h-16 sm:w-20 sm:h-20" />
                      </div>

                      <span className="text-sm sm:text-base text-center font-black leading-tight text-stone-900 line-clamp-1">
                        {card.name}
                      </span>
                    </div>

                    {/* Back Face (Gamusa Weave Motif + Tap to Flip) */}
                    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-2 text-white">
                      <div className="w-12 h-1.5 bg-yellow-300 rounded mb-2 opacity-80" />
                      <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-wider mb-1">
                        স্মৃতি
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-stone-200">
                        Tap to Flip
                      </span>
                      <div className="w-12 h-1.5 bg-yellow-300 rounded mt-2 opacity-80" />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Victory Celebration Screen */
        <div className="text-center py-10 px-4">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500 shadow-sm animate-bounce">
            <Trophy className="w-14 h-14" />
          </div>

          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 mb-2">
            {t("game_won")}
          </h3>
          <p className="text-lg sm:text-xl text-stone-700 mb-6 font-medium max-w-lg mx-auto">
            {t("game_won_desc")}
          </p>

          <div className="inline-flex items-center gap-6 bg-stone-100 border-2 border-stone-300 px-6 py-3 rounded-xl mb-8 font-bold text-stone-800">
            <div>
              <span className="text-xs uppercase text-stone-500 block">Total Flips</span>
              <span className="text-2xl font-black text-stone-900">{flipsCount}</span>
            </div>
            <div className="w-px h-10 bg-stone-300" />
            <div>
              <span className="text-xs uppercase text-stone-500 block">Accuracy</span>
              <span className="text-2xl font-black text-emerald-700">
                {Math.round((totalPairs / Math.max(totalPairs, flipsCount / 2)) * 100)}%
              </span>
            </div>
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
