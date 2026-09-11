import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिंदी" },
  { code: "as", label: "অসমীয়া" },
  { code: "bn", label: "বাংলা" },
  { code: "mni", label: "মৈতৈ" },
];

// Reusable global language switcher. Pass `floating` to fix it top-right on header-less screens.
export default function LanguageSwitcher({ floating = false, showIcon = true }) {
  const { language, setLanguage } = useLanguage();

  const group = (
    <div
      data-testid="language-switcher"
      className="flex items-center bg-white/95 border-2 border-stone-300 rounded-lg p-1 shadow-sm backdrop-blur"
    >
      {showIcon && <Globe className="w-4 h-4 text-stone-600 ml-1.5 mr-0.5" />}
      {LANGS.map((l) => (
        <button
          key={l.code}
          data-testid={`lang-${l.code}`}
          onClick={() => setLanguage(l.code)}
          className={`px-2.5 py-1 text-sm font-bold rounded transition-colors ${
            language === l.code ? "bg-red-700 text-white" : "text-stone-800 hover:bg-stone-200"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  if (floating) {
    return <div className="fixed top-3 right-3 z-[60]">{group}</div>;
  }
  return group;
}
