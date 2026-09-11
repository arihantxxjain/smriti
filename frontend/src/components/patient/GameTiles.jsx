import React from "react";
import { Brain, Eye, ListOrdered, Sparkles, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function GameTiles({ onSelectGame }) {
  const { t } = useLanguage();

  const games = [
    {
      id: "memory_match",
      title: t("memory_match"),
      desc: t("memory_match_desc"),
      icon: Brain,
      color: "border-red-700 bg-white hover:bg-stone-50 text-stone-900",
      accentBg: "bg-red-700 text-white"
    },
    {
      id: "attention_spot_difference",
      title: t("attention_game"),
      desc: t("attention_game_desc"),
      icon: Eye,
      color: "border-amber-700 bg-white hover:bg-stone-50 text-stone-900",
      accentBg: "bg-amber-700 text-white"
    },
    {
      id: "daily_routine",
      title: t("routine_game"),
      desc: t("routine_game_desc"),
      icon: ListOrdered,
      color: "border-blue-700 bg-white hover:bg-stone-50 text-stone-900",
      accentBg: "bg-blue-700 text-white"
    },
    {
      id: "recognition",
      title: t("recognition_game"),
      desc: t("recognition_game_desc"),
      icon: Sparkles,
      color: "border-emerald-700 bg-white hover:bg-stone-50 text-stone-900",
      accentBg: "bg-emerald-700 text-white"
    }
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 border-b-2 border-stone-300 pb-3 mb-5">
        <Brain className="w-7 h-7 text-red-700" />
        <h2 className="text-2xl md:text-3xl font-black text-stone-900">
          {t("games_title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {games.map((game) => {
          const IconComp = game.icon;

          return (
            <button
              key={game.id}
              data-testid={`game-tile-${game.id}`}
              onClick={() => onSelectGame(game.id)}
              className={`touch-target-lg p-6 rounded-lg border-4 text-left transition-transform active:scale-[0.99] flex items-center justify-between gap-4 ${game.color}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-md flex-shrink-0 ${game.accentBg}`}>
                  <IconComp className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-900 mb-1 leading-tight">
                    {game.title}
                  </h3>
                  <p className="text-base text-stone-700 font-medium leading-normal">
                    {game.desc}
                  </p>
                </div>
              </div>

              <div className="p-2 text-stone-700 flex-shrink-0">
                <ChevronRight className="w-8 h-8 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
