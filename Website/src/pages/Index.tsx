import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import Hero from "@/components/sections/Hero";
import LogoCloud from "@/components/sections/LogoCloud";
import ProblemStatement from "@/components/sections/ProblemStatement";
import PlatformOverview from "@/components/sections/PlatformOverview";
import ExtractionEngine from "@/components/sections/ExtractionEngine";
import ReviewQueue from "@/components/sections/ReviewQueue";
import MetricsStrip from "@/components/sections/MetricsStrip";
import Capabilities from "@/components/sections/Capabilities";
import FeatureGrid from "@/components/sections/FeatureGrid";
import UseCases from "@/components/sections/UseCases";
import Testimonials from "@/components/sections/Testimonials";
import EnterpriseSection from "@/components/sections/EnterpriseSection";
import FinalCTA from "@/components/sections/FinalCTA";

const Index = () => (
  <div className="min-h-screen bg-background">
    <PageMeta title="ExtractIQ — Enterprise Document Intelligence Platform" description="Transform unstructured documents into validated, LMS-ready structured data with dual-pathway AI extraction, anti-hallucination controls, and human-in-the-loop review." />
    <Navbar />
    <Hero />
    <LogoCloud />
    <ProblemStatement />
    <PlatformOverview />
    <ExtractionEngine />
    <ReviewQueue />
    <MetricsStrip />
    <Capabilities />
    <FeatureGrid />
    <UseCases />
    <Testimonials />
    <EnterpriseSection />
    <FinalCTA />
    <Footer />
  </div>
);

export default Index;
