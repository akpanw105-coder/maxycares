import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, MapPin, Sparkles, CheckCircle2, Shield, HeartHandshake } from "lucide-react";
import { PHARMACY_CONFIG } from "@/lib/pharmacyConfig";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-6 pb-20 md:pt-10 md:pb-28 lg:pt-14 lg:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Distinctive Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Commanding Typography & Editorial Composition */}
          <div className="lg:col-span-7 space-y-7 sm:space-y-8">
            
            {/* Subtle Clinical Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/5 text-teal-900 border border-teal-900/15 text-xs font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#0f766e] animate-pulse" />
              <span>Ethical Community Pharmacy &middot; Osun State, Nigeria</span>
            </div>

            {/* Headline with Strong Visual Typography */}
            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.4rem] text-[#0b2520] tracking-tight leading-[1.06] font-semibold">
                Careful guidance.<br />
                <span className="font-sans font-bold italic tracking-normal text-[#0f766e]">
                  Authentic medicines.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-[#3d504d] leading-relaxed max-w-xl font-normal">
                MaxiCare Pharmacy delivers rigorous prescription dispensing, everyday health essentials, and patient-first consultations. Sourced with direct integrity and delivered with clinical attentiveness for families throughout Osun State.
              </p>
            </div>

            {/* Primary Action Row with Micro-Trust Indicators */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                href="#contact"
                className="inline-flex justify-center items-center gap-2 bg-[#0b2520] text-white px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all shadow-md shadow-teal-950/10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f766e] outline-none"
              >
                Visit Dispensary
                <ArrowRight className="w-4 h-4 text-teal-300 shrink-0" />
              </Link>
              <Link
                href="#services"
                className="inline-flex justify-center items-center gap-2 bg-white/90 backdrop-blur-xs text-[#132220] px-7 py-3.5 rounded-xl text-sm font-semibold border border-[#dce8e5] hover:border-teal-400 hover:bg-teal-50/50 active:scale-[0.98] transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0f766e] outline-none"
              >
                Pharmaceutical Services
              </Link>
            </div>

            {/* Triad Clinical Pillars */}
            <div className="pt-6 sm:pt-8 grid grid-cols-3 gap-4 sm:gap-6 border-t border-[#dce8e5]/90">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f766e] font-semibold block mb-1">
                  Availability
                </span>
                <p className="text-base sm:text-xl font-bold text-[#0b2520]">7 Days Weekly</p>
                <p className="text-xs text-[#526a66] mt-0.5">Reliable daily care</p>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f766e] font-semibold block mb-1">
                  Integrity
                </span>
                <p className="text-base sm:text-xl font-bold text-[#0b2520]">Licensed Supply</p>
                <p className="text-xs text-[#526a66] mt-0.5">No counterfeit stock</p>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f766e] font-semibold block mb-1">
                  Consultation
                </span>
                <p className="text-base sm:text-xl font-bold text-[#0b2520]">In-Person Care</p>
                <p className="text-xs text-[#526a66] mt-0.5">Duty pharmacist review</p>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Visual Composition with Floating Clinical Badges */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Subtle background decorative card anchor */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/10 via-emerald-500/5 to-transparent rounded-3xl transform -rotate-1 hidden sm:block pointer-events-none" />

              {/* Main Image Frame with Architectural Rounded Geometry */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#0f766e]/20 bg-[#f0f4f3]">
                <div className="relative h-[380px] sm:h-[480px] lg:h-[510px] w-full">
                  <Image
                    src="/images/hero-consultation.jpg"
                    alt="Pharmacist providing attentive consultation at MaxiCare Pharmacy"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 540px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b2520]/85 via-[#0b2520]/25 to-transparent" />
                </div>

                {/* Overlaid Editorial Banner */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 text-white backdrop-blur-[2px]">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-teal-300" />
                    <span className="text-[11px] uppercase font-bold tracking-widest text-teal-200">
                      Standard of Practice
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold leading-snug">
                    Dedicated pharmacist reviews for every prescription dispensed.
                  </p>
                  <p className="text-xs text-teal-100/70 mt-1">
                    Community Dispensary &middot; Serving Osun State, Nigeria
                  </p>
                </div>
              </div>

              {/* Floating Pill Tag for Depth Layering */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-[#dce8e5] shadow-lg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-100/60">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#0f766e] block">Verified Care</span>
                  <span className="text-xs font-semibold text-[#0b2520]">Patient First</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
