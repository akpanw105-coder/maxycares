import React, { useId } from "react";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", variant = "dark", size = "md" }: LogoProps) {
  const isLight = variant === "light";

  /* Unique IDs per instance to avoid duplicate SVG gradient IDs
     when both Header and Footer render simultaneously */
  const uid = useId().replace(/:/g, "");
  const shieldGradId = `shield-${uid}`;
  const crossGradId  = `cross-${uid}`;

  const textSize = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" }[size];
  const boxSize  = { sm: "w-9 h-9", md: "w-11 h-11", lg: "w-13 h-13" }[size];
  const svgPx    = { sm: 22, md: 28, lg: 34 }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Shield emblem */}
      <div
        className={`flex items-center justify-center rounded-[14px] shrink-0 transition-all duration-300 ${boxSize} ${
          isLight
            ? "bg-white/10 border border-white/20 shadow-md shadow-black/20"
            : "bg-gradient-to-br from-[#0b2520] via-[#0d2e28] to-[#081a17] border border-teal-500/30 shadow-md shadow-teal-950/30"
        }`}
      >
        <svg
          width={svgPx}
          height={svgPx}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={shieldGradId} x1="8" y1="6" x2="40" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2dd4bf" />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id={crossGradId} x1="17" y1="16" x2="31" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#ccfbf1" />
            </linearGradient>
          </defs>

          {/* Shield outline */}
          <path
            d="M24 5L7 12v11c0 10.5 7.5 19.8 17 22 9.5-2.2 17-11.5 17-22V12L24 5Z"
            stroke={`url(#${shieldGradId})`}
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Apothecary cross */}
          <path
            d="M24 16v16M16 24h16"
            stroke={`url(#${crossGradId})`}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Vitality dot */}
          <circle cx="35" cy="13" r="3.5" fill="#2dd4bf" />
          <circle cx="35" cy="13" r="1.6" fill="#ffffff" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={`${textSize} font-extrabold tracking-tight ${
            isLight ? "text-white" : "text-[#0b2520]"
          }`}
        >
          Maxi<span className={isLight ? "text-teal-300" : "text-teal-600"}>Care</span>
        </span>
        <span
          className={`text-[9px] uppercase tracking-[0.12em] font-semibold mt-[3px] ${
            isLight ? "text-teal-200/70" : "text-[#4e6360]"
          }`}
        >
          Pharmacy · Osun State
        </span>
      </div>
    </div>
  );
}
