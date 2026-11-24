"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Menu, X, ArrowRight } from "lucide-react";

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
          : "bg-[#f8fafa]/80 backdrop-blur-xs border-b border-[#dce8e5]/60"
      }`}
    >
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          <Link
            href="/staff/login"
            onClick={close}
            aria-label="MaxiCare Pharmacy — Staff Authentication Entry"
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 outline-none group py-1"
            title="MaxiCare Pharmacy"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-[#132220] hover:text-[#0f766e] rounded-xl hover:bg-teal-50/80 transition-colors focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Call to action & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="#contact"
              className="hidden md:inline-flex items-center gap-2 bg-[#0b2520] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#0f766e] active:scale-[0.98] transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
            >
              Visit Dispensary
              <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
            </Link>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl text-[#132220] hover:bg-black/5 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none cursor-pointer"
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
              className="flex justify-center items-center gap-2 w-full bg-[#0b2520] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all shadow-xs"
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
