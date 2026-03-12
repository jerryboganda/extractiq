import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Documents = lazy(() => import("./pages/Documents"));
const UploadCenter = lazy(() => import("./pages/UploadCenter"));
const Jobs = lazy(() => import("./pages/Jobs"));
const ReviewQueue = lazy(() => import("./pages/ReviewQueue"));
const ReviewDetail = lazy(() => import("./pages/ReviewDetail"));
const McqRecords = lazy(() => import("./pages/McqRecords"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ExportCenter = lazy(() => import("./pages/ExportCenter"));
const Providers = lazy(() => import("./pages/Providers"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function PageLoader() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <BrowserRouter basename={basename}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                  <Route path="projects" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
                  <Route path="documents" element={<Suspense fallback={<PageLoader />}><Documents /></Suspense>} />
                  <Route path="upload" element={<Suspense fallback={<PageLoader />}><UploadCenter /></Suspense>} />
                  <Route path="jobs" element={<Suspense fallback={<PageLoader />}><Jobs /></Suspense>} />
                  <Route path="review" element={<Suspense fallback={<PageLoader />}><ReviewQueue /></Suspense>} />
                  <Route path="review/:id" element={<Suspense fallback={<PageLoader />}><ReviewDetail /></Suspense>} />
                  <Route path="mcq-records" element={<Suspense fallback={<PageLoader />}><McqRecords /></Suspense>} />
                  <Route path="analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
                  <Route path="export" element={<Suspense fallback={<PageLoader />}><ExportCenter /></Suspense>} />
                  <Route path="providers" element={<Suspense fallback={<PageLoader />}><Providers /></Suspense>} />
                  <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
                  <Route path="audit-logs" element={<Suspense fallback={<PageLoader />}><AuditLogs /></Suspense>} />
                </Route>
                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
              </Routes>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
