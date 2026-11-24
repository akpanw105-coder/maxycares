import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MapPin, Phone, Clock } from "lucide-react";
import { PHARMACY_CONFIG } from "@/lib/pharmacyConfig";

const NAV_LINKS = [
  { label: "Clinical Philosophy", href: "#about" },
  { label: "Services & Review", href: "#services" },
  { label: "Dispensary Catalog", href: "#categories" },
  { label: "Practice Standards", href: "#why-us" },
  { label: "Visit & Contact", href: "#contact" },
];

const CARE_AREAS = [
  "Prescription Dispensing",
  "Therapeutic Regimen Review",
  "Routine Blood Pressure & Glucose Checks",
  "Over-the-Counter Care",
  "Nutritional Supplementation",
  "Maternal & Pediatric Wellness",
];

export function Footer() {
  return (
    <footer className="bg-[#071916] text-[#b8d0cc] pt-20 pb-12 border-t border-teal-900/60 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-teal-900/40">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-5">
            <Logo variant="light" size="sm" />
            <p className="text-sm text-teal-100/60 leading-relaxed max-w-sm">
              MaxiCare Pharmacy is an independent community pharmacy committed to verified medicine supply,
              clinical diligence, and compassionate care for families in Osun State, Nigeria.
            </p>
            <div className="text-xs text-teal-300/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>Serving Osun State Communities</span>
            </div>
          </div>

          {/* Site Navigation */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-[0.18em] text-teal-300/80 font-semibold">
              Dispensary
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-teal-100/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offerings */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-[0.18em] text-teal-300/80 font-semibold">
              Clinical Scope
            </h4>
            <ul className="space-y-2.5">
              {CARE_AREAS.map((item, idx) => (
                <li key={idx} className="text-sm text-teal-100/60 leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Hours */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-[0.18em] text-teal-300/80 font-semibold">
              Location &amp; Operating Hours
            </h4>
            <div className="space-y-3.5 text-sm text-teal-100/70">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  {PHARMACY_CONFIG.location.displayAddress}<br />
                  <span className="text-xs text-teal-300/40 italic">
                    {PHARMACY_CONFIG.location.fullAddressPlaceholder}
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  {PHARMACY_CONFIG.contact.phone ? (
                    <a href={`tel:${PHARMACY_CONFIG.contact.phone}`} className="hover:underline">
                      {PHARMACY_CONFIG.contact.phone}
                    </a>
                  ) : (
                    PHARMACY_CONFIG.contact.phonePlaceholder
                  )}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {PHARMACY_CONFIG.hours.weekdaysDisplay}<br />
                  {PHARMACY_CONFIG.hours.weekendDisplay}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Legal Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-teal-300/50">
          <p>&copy; 2026 MaxiCare Pharmacy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Prescription medications dispensed only against valid medical prescriptions.</span>
            <span>{PHARMACY_CONFIG.location.displayAddress}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
