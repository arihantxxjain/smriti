import React, { useState, useEffect } from "react";
import { Image, Volume2, X, ChevronLeft, ChevronRight, User, Calendar, BookOpen } from "lucide-react";
import { api } from "../../services/api";
import { bhashiniService } from "../../services/bhashini";
import { useLanguage } from "../../context/LanguageContext";

export default function MemoryAidsModal({ patientId, isOpen, onClose }) {
  const { language, t } = useLanguage();
  const [memories, setMemories] = useState([]);
  const [facts, setFacts] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("memories"); // "memories" or "facts"
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (isOpen && patientId) {
      loadData();
    }
  }, [isOpen, patientId]);

  const loadData = async () => {
    try {
      const [memRes, factRes] = await Promise.all([
        api.getMemories(patientId),
        api.getFacts(patientId)
      ]);
      setMemories(memRes || []);
      setFacts(factRes || []);
      setActiveIdx(0);
    } catch (e) {
      console.warn("Failed to load memories/facts:", e);
    }
  };

  if (!isOpen) return null;

  const currentMem = memories[activeIdx];

  const handlePlayTTS = (text) => {
    if (!text) return;
    setIsPlayingAudio(true);
    bhashiniService.speakText(text, language, () => {
      setIsPlayingAudio(false);
    });
  };

  return (
    <div
      data-testid="memory-aids-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
    >
      <div className="bg-white border-4 border-red-700 rounded-lg max-w-3xl w-full flex flex-col h-[85vh] ner-gamusa-border-top text-stone-900">
        {/* Header */}
        <div className="p-4 bg-stone-50 border-b-2 border-stone-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-xl">
              <Image className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900">
                {t("memory_aids")}
              </h2>
              <p className="text-sm font-medium text-stone-600">
                {t("memory_aids_desc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="bg-stone-200 p-1 rounded-md flex border border-stone-400">
              <button
                onClick={() => setActiveTab("memories")}
                className={`px-3 py-1.5 font-bold text-sm rounded ${
                  activeTab === "memories" ? "bg-white text-stone-900 shadow-sm" : "text-stone-700"
                }`}
              >
                Photos ({memories.length})
              </button>
              <button
                onClick={() => setActiveTab("facts")}
                className={`px-3 py-1.5 font-bold text-sm rounded ${
                  activeTab === "facts" ? "bg-white text-stone-900 shadow-sm" : "text-stone-700"
                }`}
              >
                Life Facts ({facts.length})
              </button>
            </div>

            <button
              onClick={() => {
                bhashiniService.stopSpeaking();
                onClose();
              }}
              className="touch-target p-2 text-stone-700 hover:text-red-700 hover:bg-stone-200 rounded-md border-2 border-stone-300"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
          {activeTab === "memories" ? (
            memories.length === 0 ? (
              <div className="text-center py-16 text-xl font-bold text-stone-600">
                No memories uploaded yet. Your caregiver can add family photos and stories anytime!
              </div>
            ) : currentMem ? (
              <div className="max-w-xl mx-auto bg-white border-3 border-stone-400 rounded-xl overflow-hidden">
                <img
                  src={currentMem.photo_url}
                  alt={currentMem.title}
                  className="w-full h-72 sm:h-80 object-cover"
                />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-900 text-sm font-bold px-3 py-1 rounded">
                      <User className="w-4 h-4 text-red-700" />
                      <span>{currentMem.person_event}</span>
                    </span>

                    {currentMem.approx_year_or_date && (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-stone-600">
                        <Calendar className="w-4 h-4" />
                        <span>{currentMem.approx_year_or_date}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-stone-900 mb-3 leading-tight">
                    {currentMem.title}
                  </h3>

                  <p className="text-lg text-stone-800 leading-relaxed mb-6 font-medium">
                    {currentMem.caption}
                  </p>

                  <button
                    data-testid="memory-tts-btn"
                    onClick={() => handlePlayTTS(currentMem.tts_text || currentMem.caption)}
                    className="touch-target-lg w-full py-4 px-6 bg-red-700 hover:bg-red-800 text-white font-bold text-xl rounded-lg border-2 border-red-950 flex items-center justify-center gap-3"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span>{isPlayingAudio ? "Playing Voice Story..." : t("read_story")}</span>
                  </button>
                </div>
              </div>
            ) : null
          ) : (
            /* Facts Tab */
            <div className="max-w-xl mx-auto space-y-4">
              <p className="text-base font-bold text-stone-600 text-center mb-4">
                Important life facts and memories to keep you grounded and proud:
              </p>
              {facts.map((fact) => (
                <div
                  key={fact.id || fact._id}
                  className="p-5 bg-white border-2 border-stone-400 rounded-lg flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-red-700 block mb-1">
                        {fact.category}
                      </span>
                      <p className="text-lg font-bold text-stone-900 leading-snug">
                        {fact.content}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlayTTS(fact.content)}
                    aria-label="Read fact aloud"
                    className="touch-target p-2 text-stone-700 hover:text-red-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation for Memories */}
        {activeTab === "memories" && memories.length > 1 && (
          <div className="p-4 bg-white border-t-2 border-stone-300 flex items-center justify-between">
            <button
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
              className="touch-target flex items-center gap-2 px-5 py-2.5 font-bold rounded border-2 border-stone-400 bg-stone-100 hover:bg-stone-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous Photo</span>
            </button>

            <span className="font-bold text-base text-stone-700">
              {activeIdx + 1} of {memories.length}
            </span>

            <button
              onClick={() => setActiveIdx((prev) => Math.min(memories.length - 1, prev + 1))}
              disabled={activeIdx === memories.length - 1}
              className="touch-target flex items-center gap-2 px-5 py-2.5 font-bold rounded border-2 border-stone-400 bg-stone-100 hover:bg-stone-200 disabled:opacity-40"
            >
              <span>Next Photo</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
