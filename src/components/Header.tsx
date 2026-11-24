"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Clock, MapPin, Menu, X, ArrowRight } from "lucide-react";
import { PHARMACY_CONFIG } from "@/lib/pharmacyConfig";

const NAV_LINKS = [
  { label: "Philosophy", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Catalog", href: "#categories" },
  { label: "Standards", href: "#why-us" },
  { label: "Contact", href: "#contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#f8fafa]/95 backdrop-blur-md shadow-xs border-b border-[#0f766e]/15"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Top Essential Header Bar */}
      <div className="bg-[#071916] text-teal-200/90 text-[11px] sm:text-xs py-2 px-4 border-b border-teal-950">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              {PHARMACY_CONFIG.location.displayAddress}
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-teal-300/80">
              <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              {PHARMACY_CONFIG.hours.weekdaysDisplay}
            </span>
          </div>
          <span className="text-teal-300/70 text-[11px] font-mono tracking-wider hidden md:block">
            AUTHENTIC DISPENSARY · LICENSED WHOLESALE SOURCING
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link
            href="/staff/login"
            onClick={close}
            aria-label="MaxiCare Pharmacy — Staff Authentication Entry"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 outline-none group"
            title="MaxiCare Pharmacy"
          >
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-[#132220] hover:text-[#0f766e] rounded-lg hover:bg-teal-50/80 transition-colors focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Call to action & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="#contact"
              className="hidden md:inline-flex items-center gap-2 bg-[#0b2520] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#0f766e] active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
            >
              Visit Dispensary
              <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
            </Link>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl text-[#132220] hover:bg-black/5 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[#dce8e5] bg-[#f8fafa]/98 backdrop-blur-xl px-4 py-4 space-y-2 shadow-xl animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="flex items-center px-4 py-3 text-base font-semibold text-[#132220] hover:text-[#0f766e] hover:bg-teal-50 rounded-xl transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="#contact"
              onClick={close}
              className="flex justify-center items-center gap-2 w-full bg-[#0b2520] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all"
            >
              Visit Dispensary &amp; Contact
              <ArrowRight className="w-4 h-4 text-teal-300" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
