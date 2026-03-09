import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import UploadCenter from "./pages/UploadCenter";
import Jobs from "./pages/Jobs";
import ReviewQueue from "./pages/ReviewQueue";
import ReviewDetail from "./pages/ReviewDetail";
import McqRecords from "./pages/McqRecords";
import Analytics from "./pages/Analytics";
import ExportCenter from "./pages/ExportCenter";
import Providers from "./pages/Providers";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const App = () => (
  <BrowserRouter basename={basename}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="documents" element={<Documents />} />
              <Route path="upload" element={<UploadCenter />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="review" element={<ReviewQueue />} />
              <Route path="review/:id" element={<ReviewDetail />} />
              <Route path="mcq-records" element={<McqRecords />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="export" element={<ExportCenter />} />
              <Route path="providers" element={<Providers />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
