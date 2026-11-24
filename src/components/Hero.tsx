import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, MapPin, Sparkles } from "lucide-react";
import { PHARMACY_CONFIG } from "@/lib/pharmacyConfig";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 md:pt-14 md:pb-28 lg:pt-16 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Polished Pharmacy Information & Operational Status Strip */}
        <div className="pb-8 mb-10 border-b border-[#0f766e]/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-[#dce8e5]/90 shadow-2xs">
            
            {/* Status and Location */}
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f766e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0f766e]"></span>
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs font-semibold text-[#0b2520] tracking-wide">
                  Community Dispensary
                </span>
                <span className="text-xs text-[#0f766e] font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {PHARMACY_CONFIG.location.displayAddress}
                </span>
              </div>
            </div>

            {/* Operating Hours (Provisional) */}
            <div className="flex items-center gap-2 text-xs text-[#4e6360] border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/60">
              <Clock className="w-3.5 h-3.5 text-[#0f766e] shrink-0" />
              <span className="font-medium text-[#132220]">
                {PHARMACY_CONFIG.hours.weekdaysDisplay}
              </span>
              <span className="text-[11px] text-[#526a66] hidden md:inline">
                (Sun: 12–7 PM)
              </span>
            </div>

          </div>
        </div>

        {/* Hero Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Asymmetrical Typography & Content */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <p className="text-xs uppercase font-bold tracking-[0.2em] text-[#0f766e] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Ethical Pharmacy &amp; Patient Guidance
              </p>
              
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.2rem] text-[#0b2520] tracking-tight leading-[1.08] font-semibold">
                Careful guidance.<br />
                <span className="font-sans font-bold italic tracking-normal text-[#0f766e]">
                  Authentic medicines.
                </span>
              </h1>
            </div>

            <p className="text-base sm:text-lg text-[#3d504d] leading-relaxed max-w-xl font-normal">
              MaxiCare Pharmacy offers reliable prescription dispensing, daily health
              essentials, and patient-first consultations. Sourced with integrity,
              delivered with attentiveness for families throughout Osun State.
            </p>

            {/* Action buttons — Visit Us with smooth scrolling to #contact location */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="#contact"
                className="inline-flex justify-center items-center gap-2 bg-[#0b2520] text-white px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f766e] outline-none"
              >
                Visit Us
                <ArrowRight className="w-4 h-4 text-teal-300 shrink-0" />
              </Link>
              <Link
                href="#services"
                className="inline-flex justify-center items-center gap-2 bg-white text-[#132220] px-7 py-3.5 rounded-xl text-sm font-semibold border border-[#dce8e5] hover:border-teal-400 hover:bg-teal-50/50 active:scale-[0.98] transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
              >
                Pharmaceutical Services
              </Link>
            </div>

            {/* Editorial Highlight Strip */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#dce8e5]/80">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#0f766e] font-semibold block mb-1">
                  Availability
                </span>
                <p className="text-lg sm:text-xl font-bold text-[#0b2520]">7 Days Weekly</p>
                <p className="text-xs text-[#526a66] mt-0.5">Reliable access</p>
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#0f766e] font-semibold block mb-1">
                  Integrity
                </span>
                <p className="text-lg sm:text-xl font-bold text-[#0b2520]">Direct Sourcing</p>
                <p className="text-xs text-[#526a66] mt-0.5">No counterfeit stock</p>
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#0f766e] font-semibold block mb-1">
                  Standards
                </span>
                <p className="text-lg sm:text-xl font-bold text-[#0b2520]">In-Person Care</p>
                <p className="text-xs text-[#526a66] mt-0.5">Pharmacist consultation</p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Visual Art Direction */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Image Frame with Subtle Architectural Border */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#0f766e]/20 bg-[#f0f4f3]">
                <div className="relative h-[430px] sm:h-[490px] w-full">
                  <Image
                    src="/images/hero-consultation.jpg"
                    alt="Pharmacist providing attentive consultation at MaxiCare Pharmacy"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b2520]/80 via-transparent to-transparent" />
                </div>

                {/* Overlaid Editorial Note */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-teal-300" />
                    <span className="text-xs uppercase font-bold tracking-widest text-teal-200">
                      Standard of Practice
                    </span>
                  </div>
                  <p className="text-base font-semibold leading-snug">
                    Dedicated pharmacist reviews for every prescription dispensed.
                  </p>
                  <p className="text-xs text-teal-100/70 mt-1">
                    Community Dispensary · Serving Osun State
                  </p>
                </div>
              </div>

              {/* Editorial Secondary Tag Element */}
              <div className="hidden sm:block absolute -top-4 -right-4 bg-white/95 backdrop-blur-md border border-[#dce8e5] rounded-xl py-2 px-3.5 shadow-md">
                <span className="text-[11px] font-semibold text-[#0b2520] tracking-wide">
                  Licensed &amp; Verified Supply
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
