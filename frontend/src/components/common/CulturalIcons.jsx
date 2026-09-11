import React from "react";

export function GamusaIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Assamese Gamusa">
      {/* White cotton base */}
      <rect x="15" y="10" width="70" height="80" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      {/* Top red weave border */}
      <rect x="15" y="14" width="70" height="12" fill="#B91C1C" />
      <line x1="15" y1="20" x2="85" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Bottom red weave border */}
      <rect x="15" y="74" width="70" height="12" fill="#B91C1C" />
      <line x1="15" y1="80" x2="85" y2="80" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Central traditional floral motif */}
      <polygon points="50,38 56,48 67,48 58,55 62,65 50,59 38,65 42,55 33,48 44,48" fill="#B91C1C" />
      <circle cx="50" cy="51" r="3" fill="#FDE047" />
      {/* Traditional fringe threads at bottom */}
      <line x1="22" y1="86" x2="22" y2="92" stroke="#B91C1C" strokeWidth="2" />
      <line x1="32" y1="86" x2="32" y2="92" stroke="#B91C1C" strokeWidth="2" />
      <line x1="42" y1="86" x2="42" y2="92" stroke="#B91C1C" strokeWidth="2" />
      <line x1="50" y1="86" x2="50" y2="92" stroke="#B91C1C" strokeWidth="2" />
      <line x1="58" y1="86" x2="58" y2="92" stroke="#B91C1C" strokeWidth="2" />
      <line x1="68" y1="86" x2="68" y2="92" stroke="#B91C1C" strokeWidth="2" />
      <line x1="78" y1="86" x2="78" y2="92" stroke="#B91C1C" strokeWidth="2" />
    </svg>
  );
}

export function AssamTeaIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Assam Tea">
      {/* Saucer */}
      <ellipse cx="50" cy="82" rx="36" ry="7" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
      <ellipse cx="50" cy="80" rx="30" ry="5" fill="#E2E8F0" />
      {/* Cup Body */}
      <path d="M24 38 L28 72 C28 76 38 80 50 80 C62 80 72 76 72 72 L76 38 Z" fill="#D97706" stroke="#92400E" strokeWidth="2" />
      {/* Tea surface inside cup */}
      <ellipse cx="50" cy="40" rx="25" ry="6" fill="#78350F" />
      <ellipse cx="50" cy="40" rx="20" ry="4" fill="#92400E" />
      {/* Handle */}
      <path d="M74 44 C84 44 86 64 72 65" stroke="#92400E" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Steam lines */}
      <path d="M42 28 C40 22 44 18 42 12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M50 26 C48 20 52 16 50 10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 28 C56 22 60 18 58 12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
      {/* Fresh green tea leaf on saucer */}
      <path d="M22 76 C16 70 20 62 26 68 C28 72 26 76 22 76 Z" fill="#15803D" />
    </svg>
  );
}

export function JackfruitIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kothal Jackfruit">
      {/* Stem */}
      <rect x="47" y="8" width="6" height="14" rx="2" fill="#78350F" />
      {/* Jackfruit oval body with spiky outer skin */}
      <ellipse cx="50" cy="56" rx="30" ry="36" fill="#65A30D" stroke="#3F6212" strokeWidth="2.5" />
      {/* Textured spiky diamond scales */}
      <circle cx="40" cy="42" r="3" fill="#4D7C0F" />
      <circle cx="50" cy="38" r="3" fill="#4D7C0F" />
      <circle cx="60" cy="42" r="3" fill="#4D7C0F" />
      <circle cx="36" cy="54" r="3" fill="#4D7C0F" />
      <circle cx="48" cy="52" r="3.5" fill="#4D7C0F" />
      <circle cx="62" cy="54" r="3" fill="#4D7C0F" />
      <circle cx="40" cy="66" r="3" fill="#4D7C0F" />
      <circle cx="52" cy="66" r="3" fill="#4D7C0F" />
      <circle cx="60" cy="66" r="3" fill="#4D7C0F" />
      <circle cx="48" cy="78" r="2.5" fill="#4D7C0F" />
      {/* Slice showing sweet golden pod */}
      <path d="M50 36 C64 42 66 66 50 74 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
      <ellipse cx="56" cy="55" rx="5" ry="8" fill="#EAB308" />
      <ellipse cx="56" cy="55" rx="2" ry="4" fill="#713F12" />
    </svg>
  );
}

export function BambooHouseIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chang Ghar Stilt House">
      {/* Ground & grass */}
      <rect x="10" y="86" width="80" height="4" rx="2" fill="#15803D" />
      {/* Bamboo stilts */}
      <line x1="24" y1="58" x2="24" y2="86" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
      <line x1="42" y1="58" x2="42" y2="86" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
      <line x1="58" y1="58" x2="58" y2="86" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
      <line x1="76" y1="58" x2="76" y2="86" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
      {/* Bamboo ladder */}
      <line x1="32" y1="58" x2="28" y2="86" stroke="#B45309" strokeWidth="2.5" />
      <line x1="38" y1="58" x2="34" y2="86" stroke="#B45309" strokeWidth="2.5" />
      <line x1="31" y1="65" x2="37" y2="65" stroke="#B45309" strokeWidth="2" />
      <line x1="30" y1="73" x2="36" y2="73" stroke="#B45309" strokeWidth="2" />
      <line x1="29" y1="80" x2="35" y2="80" stroke="#B45309" strokeWidth="2" />
      {/* House platform */}
      <rect x="18" y="54" width="64" height="6" fill="#78350F" rx="1" />
      {/* Woven bamboo walls */}
      <rect x="22" y="34" width="56" height="20" fill="#FDE68A" stroke="#B45309" strokeWidth="1.5" />
      <rect x="46" y="40" width="8" height="14" fill="#78350F" />
      {/* Thatch / Bamboo sloping roof */}
      <polygon points="50,14 14,36 86,36" fill="#B45309" stroke="#78350F" strokeWidth="2" />
      <line x1="50" y1="14" x2="32" y2="36" stroke="#D97706" strokeWidth="2" />
      <line x1="50" y1="14" x2="68" y2="36" stroke="#D97706" strokeWidth="2" />
    </svg>
  );
}

export function HornbillIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dhanesh Hornbill">
      {/* Perch branch */}
      <line x1="14" y1="84" x2="86" y2="84" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
      {/* Tail feathers with white & black bands */}
      <polygon points="40,68 34,92 48,92 46,68" fill="#18181B" />
      <rect x="35" y="80" width="12" height="6" fill="#FFFFFF" />
      {/* Body */}
      <path d="M42 42 C34 50 36 74 48 76 C56 76 60 58 56 46 Z" fill="#18181B" />
      {/* White neck & rufous feathers */}
      <path d="M52 32 C48 38 48 46 54 48 C58 48 62 42 60 34 Z" fill="#F8FAFC" />
      {/* Head */}
      <circle cx="56" cy="30" r="9" fill="#18181B" />
      <circle cx="58" cy="28" r="2.5" fill="#DC2626" />
      <circle cx="58" cy="28" r="1" fill="#FFFFFF" />
      {/* Giant curved golden casque & bill */}
      <path d="M60 25 C72 20 86 28 88 36 C78 38 68 36 60 34 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      <path d="M62 32 C74 34 88 44 86 52 C74 44 64 36 60 34 Z" fill="#EAB308" stroke="#B45309" strokeWidth="1.5" />
      <path d="M68 25 C74 23 80 28 80 32" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BihuDholIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bihu Dhol">
      {/* Woven red shoulder strap (Gamosa pattern) */}
      <path d="M18 42 C14 18 86 18 82 42" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M18 42 C14 18 86 18 82 42" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" fill="none" />
      {/* Wooden barrel drum body */}
      <path d="M26 40 C26 34 74 34 74 40 L78 68 C78 74 22 74 22 68 Z" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
      {/* Left leather head */}
      <ellipse cx="24" cy="54" rx="6" ry="15" fill="#FEF08A" stroke="#78350F" strokeWidth="2" />
      {/* Right leather head */}
      <ellipse cx="76" cy="54" rx="6" ry="15" fill="#FEF08A" stroke="#78350F" strokeWidth="2" />
      {/* Leather tightening laces (V pattern) */}
      <path d="M26 42 L42 66 L56 42 L72 66" stroke="#FEF08A" strokeWidth="2" fill="none" />
      <path d="M34 66 L48 42 L64 66 L74 44" stroke="#FEF08A" strokeWidth="2" fill="none" />
      {/* Traditional playing stick (Mari) */}
      <line x1="72" y1="36" x2="88" y2="48" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function JaapiIcon({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Assamese Jaapi">
      {/* Conical circular woven bamboo hat body */}
      <ellipse cx="50" cy="54" rx="40" ry="24" fill="#FDE68A" stroke="#B45309" strokeWidth="2.5" />
      {/* Outer red felt decorative rim */}
      <ellipse cx="50" cy="54" rx="40" ry="24" fill="none" stroke="#DC2626" strokeWidth="4" strokeDasharray="6 3" />
      {/* Conical center peak */}
      <polygon points="50,18 42,48 58,48" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
      <circle cx="50" cy="20" r="4" fill="#DC2626" />
      {/* Traditional red and green velvet petals (Chakori) */}
      <polygon points="50,36 54,44 62,44 56,49 58,56 50,52 42,56 44,49 38,44 46,44" fill="#DC2626" />
      <circle cx="50" cy="46" r="3.5" fill="#15803D" />
      {/* Radiant woven bamboo spoke ribs */}
      <line x1="50" y1="48" x2="22" y2="60" stroke="#92400E" strokeWidth="1.5" />
      <line x1="50" y1="48" x2="34" y2="68" stroke="#92400E" strokeWidth="1.5" />
      <line x1="50" y1="48" x2="50" y2="72" stroke="#92400E" strokeWidth="1.5" />
      <line x1="50" y1="48" x2="66" y2="68" stroke="#92400E" strokeWidth="1.5" />
      <line x1="50" y1="48" x2="78" y2="60" stroke="#92400E" strokeWidth="1.5" />
    </svg>
  );
}

export const CULTURAL_ICON_MAP = {
  gamosa: GamusaIcon,
  gamusa: GamusaIcon,
  assam_tea: AssamTeaIcon,
  tea: AssamTeaIcon,
  jackfruit: JackfruitIcon,
  kothal: JackfruitIcon,
  bamboo_house: BambooHouseIcon,
  chang_ghar: BambooHouseIcon,
  hornbill: HornbillIcon,
  dhanesh: HornbillIcon,
  bihu_dhol: BihuDholIcon,
  dhol: BihuDholIcon,
  jaapi: JaapiIcon
};

export default function CulturalIcon({ id, className = "w-12 h-12" }) {
  const normalizedId = (id || "").toLowerCase();
  const Comp = CULTURAL_ICON_MAP[normalizedId] || GamusaIcon;
  return <Comp className={className} />;
}
