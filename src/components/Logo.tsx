import React from "react";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", variant = "dark", size = "md" }: LogoProps) {
  const isLight = variant === "light";

  const markSize = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }[size];

  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  const subtextSize = {
    sm: "text-[9px] tracking-[0.16em]",
    md: "text-[10px] tracking-[0.18em]",
    lg: "text-[11px] tracking-[0.2em]",
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 
        Pharmaceutical Monogram / Emblem:
        Clean, authoritative clinical icon merging the 'M' chevron architecture 
        with the foundational clinical cross and precision circular aperture.
      */}
      <div
        className={`flex items-center justify-center rounded-xl shrink-0 transition-all duration-300 ${markSize} ${
          isLight
            ? "bg-[#0f766e] text-white shadow-sm shadow-teal-950/30 border border-teal-400/30"
            : "bg-[#0b2520] text-white shadow-sm shadow-[#0b2520]/20 border border-teal-900/50"
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 sm:w-6 sm:h-6"
          aria-hidden="true"
        >
          {/* Clinical Cross Core */}
          <path
            d="M16 7V25M7 16H25"
            stroke={isLight ? "#ffffff" : "#2dd4bf"}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle Precision Accent Node */}
          <circle
            cx="16"
            cy="16"
            r="1.8"
            fill={isLight ? "#2dd4bf" : "#ffffff"}
          />
          {/* Geometric Corner Framing Brackets representing containment and quality */}
          <path
            d="M9 11L9 9L11 9M21 9L23 9L23 11M23 21L23 23L21 23M11 23L9 23L9 21"
            stroke={isLight ? "rgba(255,255,255,0.7)" : "#14b8a6"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`${textSize} font-bold tracking-tight font-serif ${
            isLight ? "text-white" : "text-[#0b2520]"
          }`}
        >
          Maxi<span className={isLight ? "text-teal-300 font-sans font-semibold" : "text-[#0f766e] font-sans font-semibold"}>Care</span>
        </span>
        <span
          className={`${subtextSize} uppercase font-medium mt-1 font-sans ${
            isLight ? "text-teal-200/70" : "text-[#526a66]"
          }`}
        >
          Pharmacy &middot; Dispensary
        </span>
      </div>
    </div>
  );
}
