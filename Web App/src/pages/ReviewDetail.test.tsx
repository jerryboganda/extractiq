import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReviewDetail from "./ReviewDetail";

const mockNavigate = vi.fn();

const mockDetail = {
  id: "rev-1",
  document: "Cardiology_Final.pdf",
  status: "pending",
  page: 3,
  pageContent: "Sample page content",
  sourceExcerpt: "What is the function of the heart?",
  question: "What is the function of the heart?",
  options: ["Pump blood", "Digest food", "Filter air", "Store energy"],
  correctIndex: 0,
  explanation: "The heart pumps blood throughout the body.",
  confidence: 0.92,
  confidenceBreakdown: { accuracy: 0.95, completeness: 0.89 },
  difficulty: "medium",
  tags: ["cardiology", "anatomy"],
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "rev-1" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/use-api", () => ({
  useReviewDetail: () => ({ data: mockDetail }),
  useReviewNavigation: () => ({ data: { ids: ["rev-0", "rev-1", "rev-2"] } }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

// Mock heavy child components
vi.mock("@/components/review/PdfViewerPanel", () => ({
  PdfViewerPanel: (props: Record<string, unknown>) => (
    <div data-testid="pdf-panel">PDF: {String(props.documentName)}</div>
  ),
}));

vi.mock("@/components/review/McqEditorPanel", () => ({
  McqEditorPanel: (props: Record<string, unknown>) => (
    <div data-testid="mcq-panel">MCQ: {String(props.question)}</div>
  ),
}));

vi.mock("@/components/review/ReviewActionBar", () => ({
  ReviewActionBar: () => <div data-testid="action-bar">Action Bar</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ResizablePanel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  ResizableHandle: () => <div data-testid="resize-handle" />,
}));

function renderReviewDetail() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/review/rev-1"]}>
        <Routes>
          <Route path="/review/:id" element={<ReviewDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders document name and status badge", () => {
    renderReviewDetail();
    expect(screen.getByText("Cardiology_Final.pdf")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("shows question position indicator", () => {
    renderReviewDetail();
    expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
  });

  it("renders PDF viewer and MCQ editor panels", () => {
    renderReviewDetail();
    expect(screen.getByTestId("pdf-panel")).toHaveTextContent("PDF: Cardiology_Final.pdf");
    expect(screen.getByTestId("mcq-panel")).toHaveTextContent("MCQ: What is the function of the heart?");
  });

  it("renders navigation buttons", () => {
    renderReviewDetail();
    expect(screen.getByLabelText("Previous question")).toBeInTheDocument();
    expect(screen.getByLabelText("Next question")).toBeInTheDocument();
    expect(screen.getByLabelText("Back to review queue")).toBeInTheDocument();
  });

  it("enables both nav buttons when in middle of list", () => {
    renderReviewDetail();
    expect(screen.getByLabelText("Previous question")).not.toBeDisabled();
    expect(screen.getByLabelText("Next question")).not.toBeDisabled();
  });

  it("renders action bar", () => {
    renderReviewDetail();
    expect(screen.getByTestId("action-bar")).toBeInTheDocument();
  });
});
