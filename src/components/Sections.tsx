"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pill,
  ShieldCheck,
  Sparkles,
  Activity,
  ShoppingBag,
  Check,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileText,
  BadgeCheck,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { PHARMACY_CONFIG } from "@/lib/pharmacyConfig";

/* ════════════════════════════════════════════════════════════
   ABOUT SECTION — Editorial Asymmetrical Layout
════════════════════════════════════════════════════════════ */
export function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-white border-y border-[#dce8e5]/80 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Subheading Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-end">
          <div className="lg:col-span-8">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0f766e] font-semibold block mb-2">
              01 — Clinical Philosophy
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0b2520] tracking-tight font-semibold leading-tight">
              An independent community pharmacy founded on diligence and patient dignity.
            </h2>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <p className="text-sm text-[#4e6360] leading-relaxed">
              Serving Osun State families with attentive prescription handling and straightforward health advice.
            </p>
          </div>
        </div>

        {/* Story & Imagery Collage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          <div className="lg:col-span-6 relative">
            <div className="relative h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-[#dce8e5] shadow-lg bg-stone-100">
              <Image
                src="/images/pharmacy-interior.jpg"
                alt="Well-organized dispensary interior at MaxiCare Pharmacy"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b2520]/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[11px] font-mono tracking-wider uppercase text-teal-300 font-bold block mb-1">
                  Dispensary Environment
                </span>
                <p className="text-sm font-medium text-white/90">
                  Clean, temperature-monitored storage preserving medicine stability and safety.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0b2520] tracking-tight">
              Responsible healthcare right in your neighborhood.
            </h3>
            
            <p className="text-base text-[#4e6360] leading-relaxed">
              At MaxiCare Pharmacy, dispensing medicine is not treated as a routine retail transaction.
              Every prescription presented is carefully verified for accurate dosage, contraindications,
              and patient context before being released.
            </p>

            <p className="text-base text-[#4e6360] leading-relaxed">
              Our pharmacists take the necessary time to explain administration schedules, potential
              dietary interactions, and storage recommendations—ensuring you feel completely confident
              in managing your family&apos;s wellness.
            </p>

            {/* Core commitments */}
            <div className="pt-4 space-y-3.5 border-t border-[#dce8e5]">
              {[
                { title: "Strict Quality Control", desc: "Regulated wholesale sources with direct manufacturer verification." },
                { title: "Transparent Consultations", desc: "Clear explanations on generics, efficacy, and treatment schedules." },
                { title: "Continuity of Care", desc: "Ongoing support for chronic condition management and blood pressure checks." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-[#0f766e] flex items-center justify-center mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#0b2520]">{item.title}</h4>
                    <p className="text-xs text-[#59716e] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="#services"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e] hover:text-[#0b2520] transition-colors"
              >
                View our clinical services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   SERVICES SECTION — Editorial List Presentation
════════════════════════════════════════════════════════════ */
const SERVICES = [
  {
    num: "01",
    title: "Prescription Dispensing & Therapy Review",
    desc: "Rigorous verification of doctor-prescribed therapies. We double-check dosage, duration, and patient tolerance before dispensing.",
    tag: "Core Clinical Service",
    icon: Pill,
    image: "/images/medication-dispensing.jpg",
  },
  {
    num: "02",
    title: "Routine Vital Checks & Monitoring",
    desc: "In-pharmacy screening for blood pressure and blood sugar. Convenient checkpoints for maintaining cardiovascular and metabolic health.",
    tag: "In-Store Health Check",
    icon: Activity,
    image: "/images/diagnostics.jpg",
  },
  {
    num: "03",
    title: "Over-the-Counter Remedies & Minor Ailments",
    desc: "Evidence-based relief for seasonal colds, fevers, pain management, digestive discomfort, and minor allergy symptoms.",
    tag: "Immediate Relief",
    icon: ShoppingBag,
    image: "/images/pharmacist-care.jpg",
  },
  {
    num: "04",
    title: "Family Nutrition & Targeted Supplements",
    desc: "Clinically formulated multivitamins, minerals, pediatric vitamins, and dietary supports tailored for varying life stages.",
    tag: "Nutritional Care",
    icon: Sparkles,
    image: "/images/family-wellness.jpg",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 md:py-32 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-3">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0f766e] font-semibold block">
            02 — Services &amp; Guidance
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#0b2520] tracking-tight font-semibold">
            Dedicated pharmaceutical services for everyday health.
          </h2>
          <p className="text-base text-[#4e6360] leading-relaxed pt-1">
            Every service is handled with direct pharmacist attention and uncompromising clinical standards.
          </p>
        </div>

        {/* Editorial Alternating Services Display */}
        <div className="space-y-12">
          {SERVICES.map((srv, idx) => {
            const Icon = srv.icon;
            const isEven = idx % 2 === 1;

            return (
              <div
                key={srv.num}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center p-6 sm:p-10 rounded-2xl bg-white border border-[#dce8e5] hover:border-teal-300 hover:shadow-md transition-all duration-300"
              >
                {/* Content side */}
                <div className={`lg:col-span-7 space-y-4 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0f766e] border border-teal-100">
                      {srv.num}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#526a66]">
                      {srv.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#0b2520] tracking-tight">
                    {srv.title}
                  </h3>

                  <p className="text-base text-[#4e6360] leading-relaxed">
                    {srv.desc}
                  </p>

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0f766e]">
                      <Icon className="w-4 h-4" />
                      <span>Available at our Osun State dispensary</span>
                    </div>

                    <Link
                      href="#contact"
                      className="text-xs font-semibold text-[#0b2520] hover:text-[#0f766e] flex items-center gap-1.5 transition-colors"
                    >
                      Inquire regarding this service <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Visual side */}
                <div className={`lg:col-span-5 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="relative h-60 sm:h-72 w-full rounded-xl overflow-hidden bg-stone-100 border border-[#e2ecea]">
                    <Image
                      src={srv.image}
                      alt={srv.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   CATEGORIES SECTION — Visual Editorial Catalog
════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  {
    category: "Prescription Lines",
    tagline: "Doctor-ordered courses",
    description: "Antibiotics, antihypertensives, antidiabetics, and routine chronic disease management therapies.",
    icon: FileText,
  },
  {
    category: "Over-the-Counter Care",
    tagline: "Everyday symptom relief",
    description: "Analgesics, antipyretics, digestive aids, anti-allergies, and respiratory decongestants.",
    icon: Pill,
  },
  {
    category: "Vitamins & Micronutrients",
    tagline: "Immune & metabolic support",
    description: "Multivitamin complexes, Vitamin C, Zinc, iron preparations, and prenatal nutrition.",
    icon: Sparkles,
  },
  {
    category: "Maternal & Child Health",
    tagline: "Safe formulations for young families",
    description: "Pediatric syrups, infant hydration remedies, mild baby cleansers, and postpartum wellness products.",
    icon: ShieldCheck,
  },
  {
    category: "First Aid & Clinical Monitors",
    tagline: "Essential household diagnostics",
    description: "Digital blood pressure monitors, glucose test strips, sterile bandages, and skin antiseptics.",
    icon: Activity,
  },
  {
    category: "Dermatological Care",
    tagline: "Therapeutic skin preparations",
    description: "Medicated emollients, gentle cleansers, wound-care ointments, and soothing topical treatments.",
    icon: BadgeCheck,
  },
];

export function CategoriesSection() {
  return (
    <section id="categories" className="py-24 md:py-32 bg-white border-y border-[#dce8e5]/80 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0f766e] font-semibold block">
              03 — Dispensary Catalog
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0b2520] tracking-tight font-semibold">
              Healthcare and wellness inventory.
            </h2>
            <p className="text-base text-[#4e6360]">
              Browse essential categories available in our Osun State pharmacy.
            </p>
          </div>
          <div>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e] hover:text-[#0b2520] transition-colors"
            >
              Inquire about specific medication <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl bg-[#f8fafa] border border-[#dce8e5] hover:border-teal-400 hover:bg-white hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#dce8e5] text-[#0f766e] flex items-center justify-center mb-5 shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f766e] font-bold block mb-1">
                    {cat.tagline}
                  </span>
                  <h3 className="text-lg font-bold text-[#0b2520] tracking-tight mb-2">
                    {cat.category}
                  </h3>
                  <p className="text-sm text-[#4e6360] leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#dce8e5]/60 flex items-center justify-between text-xs font-medium text-[#526a66]">
                  <span>Available In-Store</span>
                  <Link
                    href="#contact"
                    className="text-[#0f766e] hover:underline font-semibold"
                  >
                    Check Stock &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   WHY CHOOSE SECTION — Editorial Narrative of Trust
════════════════════════════════════════════════════════════ */
export function WhyChooseSection() {
  return (
    <section id="why-us" className="py-24 md:py-32 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left: Manifesto */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0f766e] font-semibold block">
              04 — The MaxiCare Standard
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0b2520] tracking-tight font-semibold leading-tight">
              Why our community places their trust in MaxiCare.
            </h2>
            <p className="text-base text-[#4e6360] leading-relaxed">
              In healthcare, authenticity and attention are non-negotiable. We adhere to
              rigorous dispensing protocols so that every patient receives the correct
              treatment with complete peace of mind.
            </p>

            <div className="p-6 rounded-2xl bg-white border border-[#dce8e5] shadow-2xs space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0f766e] font-bold block">
                Local Pharmacy Pledge
              </span>
              <p className="text-sm text-[#0b2520] font-medium leading-relaxed">
                &ldquo;Every patient is listened to, every medicine is verified, and every guidance is provided with clarity and care.&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Pillars */}
          <div className="lg:col-span-7 space-y-6">
            {[
              {
                no: "01",
                title: "Strict Pharmaceutical Integrity",
                desc: "We exclusively partner with registered, licensed pharmaceutical distributors. We maintain a zero-tolerance policy against counterfeit or grey-market medications.",
              },
              {
                no: "02",
                title: "In-Person Clinical Oversight",
                desc: "Our on-duty pharmacists ensure you understand how, when, and how long to take your medication, as well as warning signs of adverse drug reactions.",
              },
              {
                no: "03",
                title: "Controlled Storage & Climate Standards",
                desc: "Medicines are maintained in temperature-regulated, hygienic spaces to guarantee stability and biological efficacy up to their stated expiry dates.",
              },
              {
                no: "04",
                title: "Honest, Respectful Pricing",
                desc: "We stock dependable generic alternatives alongside brand-name formulations, helping families find cost-effective options without sacrificing clinical quality.",
              },
            ].map((pillar) => (
              <div
                key={pillar.no}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-[#dce8e5] hover:border-teal-300 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-xs font-bold text-[#0f766e]">
                    {pillar.no}
                  </span>
                  <h3 className="text-lg font-bold text-[#0b2520]">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-sm text-[#4e6360] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   CONTACT SECTION — Clean Dispensary Location & Query
════════════════════════════════════════════════════════════ */
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  message?: string;
}

export function ContactSection() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    subject: "Prescription Availability",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate form inputs
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name.";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address (e.g., name@domain.com).";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please enter your message or medication inquiry.";
    } else if (formData.message.trim().length < 5) {
      newErrors.message = "Message must be at least 5 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!validate()) {
      return;
    }

    setLoading(true);

    // Simulate demonstration submission processing
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      subject: "Prescription Availability",
      message: "",
    });
    setErrors({});
    setSubmitted(false);
  };

  // Locate Us action handler
  const handleLocateUs = () => {
    if (PHARMACY_CONFIG.location.googleMapsUrl) {
      window.open(PHARMACY_CONFIG.location.googleMapsUrl, "_blank", "noopener,noreferrer");
    } else {
      // If address is provisional, smoothly scroll to pharmacy location details on the page
      const locElement = document.getElementById("pharmacy-location-details");
      if (locElement) {
        locElement.scrollIntoView({ behavior: "smooth" });
      } else {
        const contactSection = document.getElementById("contact");
        contactSection?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-white border-t border-[#dce8e5]/80 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16 space-y-3">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0f766e] font-semibold block">
            05 — Dispensary Visit &amp; Inquiries
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#0b2520] tracking-tight font-semibold">
            Visit MaxiCare Pharmacy in Osun State.
          </h2>
          <p className="text-base text-[#4e6360] leading-relaxed">
            Need to confirm stock, ask about a prescription refill, or visit our dispensary? Our team is available 7 days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Practical Info Card */}
          <div
            id="pharmacy-location-details"
            className="lg:col-span-5 bg-[#f8fafa] rounded-2xl p-6 sm:p-8 border border-[#dce8e5] space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0b2520]">Pharmacy Details</h3>
                <p className="text-xs text-[#526a66] mt-0.5">
                  Walk-in visits welcomed during dispensary hours.
                </p>
              </div>
              <span className="text-[11px] font-mono bg-teal-50 text-[#0f766e] px-2.5 py-1 rounded-md border border-teal-100 font-semibold">
                Osun State
              </span>
            </div>

            <div className="space-y-6">
              {/* Location item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#dce8e5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-[#0b2520]">Location</h4>
                  <p className="text-sm text-[#4e6360] font-medium">
                    {PHARMACY_CONFIG.location.displayAddress}
                  </p>
                  <p className="text-xs text-[#4e6360]/75 italic">
                    {PHARMACY_CONFIG.location.fullAddressPlaceholder}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleLocateUs}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f766e] hover:text-[#0b2520] transition-colors py-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0f766e] rounded outline-none"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {PHARMACY_CONFIG.location.googleMapsUrl ? "Open in Google Maps" : "Locate Us on This Page"}
                      {PHARMACY_CONFIG.location.googleMapsUrl && <ExternalLink className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#dce8e5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-[#0b2520]">Direct Inquiries</h4>
                  {PHARMACY_CONFIG.contact.phone ? (
                    <a
                      href={`tel:${PHARMACY_CONFIG.contact.phone}`}
                      className="text-sm font-semibold text-[#0f766e] hover:underline block"
                    >
                      {PHARMACY_CONFIG.contact.phone}
                    </a>
                  ) : (
                    <p className="text-sm text-[#4e6360]">
                      {PHARMACY_CONFIG.contact.phonePlaceholder}
                    </p>
                  )}
                  <p className="text-xs text-[#4e6360]/75 italic">
                    Operational line will activate prior to public opening.
                  </p>
                </div>
              </div>

              {/* Hours item */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#dce8e5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-[#0b2520]">Dispensary Hours</h4>
                  <p className="text-sm text-[#4e6360]">
                    {PHARMACY_CONFIG.hours.weekdays}: {PHARMACY_CONFIG.hours.weekdayTimes}
                  </p>
                  <p className="text-sm text-[#4e6360]">
                    {PHARMACY_CONFIG.hours.weekendDays}: {PHARMACY_CONFIG.hours.weekendTimes}
                  </p>
                  <p className="text-[11px] text-[#526a66] italic pt-0.5">
                    * Provisional hours subject to final launch confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#dce8e5] text-xs text-[#526a66] leading-relaxed">
              * Note: Prescription medications can only be dispensed upon presentation of an authorized doctor&apos;s prescription.
            </div>
          </div>

          {/* Inquiry Form with Complete Interactive Validation & Demo Submission */}
          <div className="lg:col-span-7 bg-[#f8fafa] rounded-2xl p-6 sm:p-8 border border-[#dce8e5]">
            {submitted ? (
              <div className="text-center py-8 sm:py-10 space-y-5 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-teal-100 text-[#0f766e] flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>
                
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-[#0b2520]">
                    Thank you for contacting MaxiCare.
                  </h3>
                  <p className="text-sm font-semibold text-[#0f766e]">
                    Your inquiry has been recorded successfully in this demonstration.
                  </p>
                  <p className="text-xs text-[#526a66] leading-relaxed bg-white/80 p-3 rounded-xl border border-[#dce8e5]">
                    Note: As this website is currently in demonstration mode, no actual email or transmission has been sent to our staff. When official launch occurs, your inquiry will directly reach the duty pharmacist.
                  </p>
                </div>

                {/* Submission summary review */}
                <div className="bg-white rounded-xl p-4 border border-[#dce8e5] text-left max-w-md mx-auto text-xs space-y-1.5 text-[#4e6360]">
                  <p><strong className="text-[#0b2520]">Name:</strong> {formData.fullName}</p>
                  <p><strong className="text-[#0b2520]">Email:</strong> {formData.email}</p>
                  {formData.phone && <p><strong className="text-[#0b2520]">Phone:</strong> {formData.phone}</p>}
                  <p><strong className="text-[#0b2520]">Subject:</strong> {formData.subject}</p>
                  <p className="truncate"><strong className="text-[#0b2520]">Message:</strong> {formData.message}</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0b2520] text-white text-xs font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#0b2520]">Medication Availability &amp; Inquiries</h3>
                  <p className="text-xs text-[#526a66] mt-1">
                    Have questions about an existing prescription or wellness product? Send us a note.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0b2520] mb-1.5" htmlFor="fullName">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. Samuel Adeleke"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none transition-shadow placeholder:text-[#a8beba] ${
                          errors.fullName
                            ? "border-red-400 focus:ring-2 focus:ring-red-400"
                            : "border-[#dce8e5] focus:ring-2 focus:ring-[#0f766e]"
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0b2520] mb-1.5" htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. samuel@example.com"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none transition-shadow placeholder:text-[#a8beba] ${
                          errors.email
                            ? "border-red-400 focus:ring-2 focus:ring-red-400"
                            : "border-[#dce8e5] focus:ring-2 focus:ring-[#0f766e]"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Phone & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0b2520] mb-1.5" htmlFor="phone">
                        Phone Number <span className="text-[#526a66] font-normal">(Optional)</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 0801 234 5678"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#dce8e5] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] transition-shadow placeholder:text-[#a8beba]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0b2520] mb-1.5" htmlFor="subject">
                        Topic of Inquiry
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#dce8e5] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] transition-shadow text-[#132220]"
                      >
                        <option value="Prescription Availability">Prescription Availability</option>
                        <option value="Over-the-Counter Consultation">Over-the-Counter Consultation</option>
                        <option value="Vitamins &amp; Supplements Advice">Vitamins &amp; Supplements Advice</option>
                        <option value="Store Directions &amp; Service Hours">Store Directions &amp; Service Hours</option>
                        <option value="General Healthcare Query">General Healthcare Query</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0b2520] mb-1.5" htmlFor="message">
                      Details / Medicine Requested <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please mention the medication name or specific question..."
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none transition-shadow resize-none placeholder:text-[#a8beba] ${
                        errors.message
                          ? "border-red-400 focus:ring-2 focus:ring-red-400"
                          : "border-[#dce8e5] focus:ring-2 focus:ring-[#0f766e]"
                      }`}
                    />
                    {errors.message && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0b2520] text-white text-sm font-semibold hover:bg-[#0f766e] active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f766e] outline-none cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-teal-200" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                          </svg>
                          <span>Validating &amp; Transmitting…</span>
                        </>
                      ) : (
                        <>
                          <span>Transmit Inquiry</span>
                          <ArrowRight className="w-4 h-4 text-teal-300" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
