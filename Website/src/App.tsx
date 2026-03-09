import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/layout/ScrollToTop";
import BackToTop from "@/components/layout/BackToTop";
import CookieConsent from "@/components/layout/CookieConsent";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Product from "./pages/Product";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Demo from "./pages/Demo";
import Enterprise from "./pages/Enterprise";
import Security from "./pages/Security";
import PdfToQuestionBank from "./pages/solutions/PdfToQuestionBank";
import LmsExport from "./pages/solutions/LmsExport";
import DocumentOperations from "./pages/solutions/DocumentOperations";
import Integrations from "./pages/Integrations";
import Compare from "./pages/Compare";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PdfToMcq from "./pages/landing/PdfToMcq";
import LmsAssessmentExport from "./pages/landing/LmsAssessmentExport";
import DocumentExtraction from "./pages/landing/DocumentExtraction";
import AccurateExtraction from "./pages/landing/AccurateExtraction";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    setKey(location.pathname);
  }, [location.pathname]);

  return (
    <div key={key} className="page-fade-in">
      {children}
    </div>
  );
};

const AppRoutes = () => (
  <>
    <ScrollToTop />
    <BackToTop />
    <a href="#main-content" className="skip-to-content">
      Skip to content
    </a>
    <CookieConsent />
    <PageTransition>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/product" element={<Product />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/security" element={<Security />} />
          <Route path="/solutions/pdf-to-question-bank" element={<PdfToQuestionBank />} />
          <Route path="/solutions/lms-export" element={<LmsExport />} />
          <Route path="/solutions/document-operations" element={<DocumentOperations />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/lp/pdf-to-mcq" element={<PdfToMcq />} />
          <Route path="/lp/lms-export" element={<LmsAssessmentExport />} />
          <Route path="/lp/document-extraction" element={<DocumentExtraction />} />
          <Route path="/lp/accurate-extraction" element={<AccurateExtraction />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </PageTransition>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

