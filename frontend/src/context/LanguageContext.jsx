import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../utils/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("smriti_language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("smriti_language", language);
  }, [language]);

  const t = (key, vars) => {
    const langDict = translations[language] || translations.en;
    let str = langDict[key] || translations.en[key] || key;
    if (vars && typeof str === "string") {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
