import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./Dashboard";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/use-api", () => ({
  useDashboardStats: () => ({
    data: {
      documentsProcessed: 142,
      mcqsExtracted: 1024,
      approvalRate: 87.5,
      activeJobs: 3,
      documentsProcessedTrend: 12,
      mcqsExtractedTrend: 8,
      approvalRateTrend: 2.1,
      activeJobsTrend: -1,
    },
    isLoading: false,
  }),
  useDashboardSparklines: () => ({ data: null }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Test User" },
  }),
}));

// Stub complex child components to keep tests focused
vi.mock("@/components/dashboard/WelcomeBanner", () => ({
  WelcomeBanner: () => <div data-testid="welcome-banner" />,
}));
vi.mock("@/components/dashboard/ActiveJobsPanel", () => ({
  ActiveJobsPanel: () => <div data-testid="active-jobs-panel" />,
}));
vi.mock("@/components/dashboard/ActivityTimeline", () => ({
  ActivityTimeline: () => <div data-testid="activity-timeline" />,
}));
vi.mock("@/components/dashboard/ProviderHealthStrip", () => ({
  ProviderHealthStrip: () => <div data-testid="provider-health" />,
}));
vi.mock("@/components/dashboard/SystemIntelligenceBar", () => ({
  SystemIntelligenceBar: () => <div data-testid="system-intel" />,
}));
vi.mock("@/components/dashboard/SparklineChart", () => ({
  SparklineChart: () => <div data-testid="sparkline" />,
}));

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Dashboard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders heading and stat cards", () => {
    renderDashboard();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Documents Processed")).toBeInTheDocument();
    expect(screen.getByText("MCQs Extracted")).toBeInTheDocument();
    expect(screen.getByText("Approval Rate")).toBeInTheDocument();
    expect(screen.getByText("Active Jobs")).toBeInTheDocument();
  });

  it("renders quick action buttons", () => {
    renderDashboard();
    expect(screen.getByRole("button", { name: /upload documents/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review queue/i })).toBeInTheDocument();
  });

  it("navigates on quick action click", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /upload documents/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/upload");
  });

  it("renders child panels", () => {
    renderDashboard();
    expect(screen.getByTestId("welcome-banner")).toBeInTheDocument();
    expect(screen.getByTestId("active-jobs-panel")).toBeInTheDocument();
    expect(screen.getByTestId("activity-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("provider-health")).toBeInTheDocument();
  });
});
