/**
 * MaxiCare Pharmacy — Centralized Business Configuration
 * Central source of truth for location, operating hours, and contact details.
 * Placeholders are maintained until verified business details are officially provided.
 */

export const PHARMACY_CONFIG = {
  name: "MaxiCare Pharmacy",
  tagline: "Authentic Medicines · Trusted Community Care",
  location: {
    state: "Osun State",
    country: "Nigeria",
    displayAddress: "Osun State, Nigeria",
    fullAddressPlaceholder: "[Physical street address to be announced at official launch]",
    // When a verified Google Maps or geolocation URL is available, populate it here.
    googleMapsUrl: "", 
  },
  hours: {
    weekdays: "Monday – Saturday",
    weekdayTimes: "8:00 AM – 9:00 PM",
    weekdaysDisplay: "Mon–Sat: 8:00 AM – 9:00 PM",
    weekendDays: "Sundays & Public Holidays",
    weekendTimes: "12:00 PM – 7:00 PM",
    weekendDisplay: "Sun & Holidays: 12:00 PM – 7:00 PM",
    statusSummary: "Dispensary Open Mon–Sat · 8:00 AM – 9:00 PM",
    isProvisional: true,
  },
  contact: {
    // Official contact channels - empty until provided by business
    phone: "",
    phonePlaceholder: "[Phone number to be provided]",
    whatsapp: "",
    whatsappPlaceholder: "[WhatsApp line to be activated prior to launch]",
    email: "",
    emailPlaceholder: "[Official contact email to be published]",
  },
} as const;
