import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { 
  AboutSection, 
  ServicesSection, 
  CategoriesSection, 
  WhyChooseSection, 
  ContactSection 
} from "@/components/Sections";
import { Footer } from "@/components/Footer";
import { AmbientBioCanvas } from "@/components/AmbientBioCanvas";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#f9fbfb] text-[#132220]">
      {/* Dynamic ambient organic & synaptic canvas background */}
      <AmbientBioCanvas />

      {/* Main layout contents layered seamlessly over the canvas */}
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="flex-1">
          <Hero />
          <AboutSection />
          <ServicesSection />
          <CategoriesSection />
          <WhyChooseSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
