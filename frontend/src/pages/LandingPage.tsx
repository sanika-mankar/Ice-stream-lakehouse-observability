import { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import CapabilityStrip from '../components/landing/CapabilityStrip';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import InteractiveArchitecture from '../components/landing/InteractiveArchitecture';
import QualitySection from '../components/landing/QualitySection';
import CircuitBreakerSection from '../components/landing/CircuitBreakerSection';
import QuarantineSection from '../components/landing/QuarantineSection';
import LakehouseSection from '../components/landing/LakehouseSection';
import ObservabilitySection from '../components/landing/ObservabilitySection';
import UseCasesSection from '../components/landing/UseCasesSection';
import AudienceSection from '../components/landing/AudienceSection';
import IntegrationSection from '../components/landing/IntegrationSection';
import TechnologySection from '../components/landing/TechnologySection';
import IncidentStorySection from '../components/landing/IncidentStorySection';
import TrustedDataSection from '../components/landing/TrustedDataSection';
import FAQSection from '../components/landing/FAQSection';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 font-sans overflow-x-hidden">
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <CapabilityStrip />
        <ProblemSection />
        <HowItWorksSection />
        <InteractiveArchitecture />
        <QualitySection />
        <CircuitBreakerSection />
        <QuarantineSection />
        <LakehouseSection />
        <ObservabilitySection />
        <UseCasesSection />
        <AudienceSection />
        <IntegrationSection />
        <TechnologySection />
        <IncidentStorySection />
        <TrustedDataSection />
        <FAQSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
