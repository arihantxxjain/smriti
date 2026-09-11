import React, { useState, useEffect, useRef } from "react";
import { Shirt, Coffee, Apple, Home, Feather, Music, Crown, ArrowLeft, RotateCcw, CheckCircle } from "lucide-react";
import { api } from "../../../services/api";
import { offlineStorage } from "../../../services/offlineStorage";

const ICON_MAP = {
  Shirt: Shirt,
  Coffee: Coffee,
  Apple: Apple,
  Home: Home,
  Feather: Feather,
  Music: Music,
  Crown: Crown
};

// Code-native visual cues keep the game fast and available offline.
const CARD_ART = {
  gamosa: "🧣", gamusa: "🧣", assam_tea: "🍵", tea: "🍵", jackfruit: "🫐",
  bamboo_house: "🏠", hornbill: "🦜", bihu_dhol: "🥁", dhol: "🥁", jaapi: "👒"
};

export default function MemoryMatchGame({ patientId, onBack, onComplete }) {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const responsesRef = useRef([]);
  const [isFinished, setIsFinished] = useState(false);
  const [flipsCount, setFlipsCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      const config = await api.getGameConfig(patientId, "memory_match", "medium");
      if (config.cards) {
        // Shuffle cards
        const shuffled = [...config.cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
      }
    } catch (e) {
      // Fallback offline card set
      const defaultCards = [
        { id: "g1", pair_id: "gamusa", name: "Gamusa", icon: "Shirt" },
        { id: "g2", pair_id: "gamusa", name: "Gamusa", icon: "Shirt" },
        { id: "t1", pair_id: "tea", name: "Assam Tea", icon: "Coffee" },
        { id: "t2", pair_id: "tea", name: "Assam Tea", icon: "Coffee" },
        { id: "j1", pair_id: "jackfruit", name: "Kothal", icon: "Apple" },
        { id: "j2", pair_id: "jackfruit", name: "Kothal", icon: "Apple" },
        { id: "d1", pair_id: "dhol", name: "Bihu Dhol", icon: "Music" },
        { id: "d2", pair_id: "dhol", name: "Bihu Dhol", icon: "Music" }
      ].sort(() => Math.random() - 0.5);
      setCards(defaultCards);
    }
    setFlippedIndices([]);
    setMatchedIds([]);
    setStartTime(Date.now());
    responsesRef.current = [];
    setIsFinished(false);
    setFlipsCount(0);
    setSaveStatus("");
  };

  const handleCardClick = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].pair_id)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    setFlipsCount((prev) => prev + 1);

    if (newFlipped.length === 2) {
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];
      const reactionTime = Date.now() - startTime;
      const isMatch = card1.pair_id === card2.pair_id;

      const nextResponses = [...responsesRef.current, {
        item_id: card1.pair_id,
        prompt: `Match ${card1.name}`,
        chosen: card2.name,
        correct: isMatch,
        reaction_time_ms: reactionTime
      }];
      responsesRef.current = nextResponses;

      if (isMatch) {
        const newMatched = [...matchedIds, card1.pair_id];
        setMatchedIds(newMatched);
        setFlippedIndices([]);

        // Check completion (all pairs matched)
        const totalPairs = cards.length / 2;
        if (newMatched.length === totalPairs) {
          finishGame(newMatched.length, totalPairs, flipsCount + 1, nextResponses);
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  const finishGame = async (matchedCount, totalPairs, totalFlips, finalResponses) => {
    setIsFinished(true);
    const accuracy = Math.round((totalPairs / Math.max(totalPairs, totalFlips / 2)) * 100);
    const completion = 100.0;
    const compositeScore = Math.min(100, Math.max(30, Math.round(accuracy * 0.7 + completion * 0.3)));

    const submitPayload = {
      patient_id: patientId,
      game_type: "memory_match",
      difficulty: "medium",
      responses: finalResponses,
      accuracy: accuracy,
      completion: completion,
      composite_score: compositeScore
    };

    try {
      if (navigator.onLine) {
        await api.submitGame(submitPayload);
        setSaveStatus("Your result was saved for your caregiver.");
      } else {
        offlineStorage.queueGameSubmit(submitPayload);
        setSaveStatus("Your result is safely queued and will sync when the internet returns.");
      }
    } catch (e) {
      offlineStorage.queueGameSubmit(submitPayload);
      setSaveStatus("Your result is safely queued and will sync when the internet returns.");
    }

    if (onComplete) onComplete(compositeScore);
  };

  return (
    <div className="bg-white border-2 border-stone-300 rounded-lg p-6 max-w-4xl mx-auto">
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b-2 border-stone-200 pb-4 mb-6">
        <button
          data-testid="game-back-btn"
          onClick={onBack}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-md text-stone-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <h2 className="text-2xl font-black text-stone-900">
          Memory Match (স্মৃতি মিলোৱা খেল)
        </h2>

        <button
          data-testid="game-restart-btn"
          onClick={loadGame}
          className="touch-target flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-400 font-bold rounded-md text-stone-900"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Restart</span>
        </button>
      </div>

      {!isFinished ? (
        <>
          <p className="text-lg font-medium text-stone-700 mb-3 text-center">
            Tap two cards to reveal their cultural picture and name. Find the matching pair.
          </p>

          <div className="mb-6 flex flex-wrap justify-center gap-2 text-sm font-bold text-stone-700" aria-label="Cultural pictures used in this game">
            {[...new Map(cards.map((card) => [card.pair_id, card])).values()].map((card) => (
              <span key={card.pair_id} className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1">
                {CARD_ART[card.pair_id] || "✨"} {card.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.pair_id);
              const isMatched = matchedIds.includes(card.pair_id);
              const IconComp = ICON_MAP[card.icon] || Shirt;
              const cardArt = CARD_ART[card.pair_id] || "✨";

              return (
                <button
                  key={`${card.id}_${idx}`}
                  data-testid={`memory-card-${idx}`}
                  onClick={() => handleCardClick(idx)}
                  disabled={isMatched}
                  aria-label={isFlipped ? card.name : `Card ${idx + 1} hidden`}
                  className={`touch-target-lg h-32 sm:h-36 rounded-lg border-4 flex flex-col items-center justify-center p-3 font-bold transition-all ${
                    isMatched
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 opacity-90"
                      : isFlipped
                      ? "bg-stone-50 border-red-700 text-stone-900"
                      : "bg-red-800 border-red-950 text-white hover:bg-red-900"
                  }`}
                >
                  {isFlipped ? (
                    <>
                      <IconComp className="w-10 h-10 mb-2 text-red-700" />
                      <span className="text-4xl" aria-hidden="true">{cardArt}</span>
                      <span className="text-base text-center font-black leading-tight text-stone-900">
                        {card.name}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-amber-300 mb-1">স্মৃতি</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-200">Tap to Flip</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center text-base font-bold text-stone-600">
            Pairs Matched: {matchedIds.length} / {cards.length / 2} • Total Flips: {flipsCount}
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <CheckCircle className="w-20 h-20 text-emerald-700 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-stone-900 mb-2">
            অপূৰ্ব! সকলো যোৰ মিলিল (Well Done!)
          </h3>
          <p className="text-xl text-stone-700 mb-6 font-medium">
            You matched all North Eastern cultural cards in {flipsCount} flips.
          </p>
          {saveStatus && <p className="mb-6 rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3 font-bold text-emerald-950" role="status">{saveStatus}</p>}
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
