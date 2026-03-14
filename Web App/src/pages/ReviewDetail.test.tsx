import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ReviewDetail from "./ReviewDetail";

const mockNavigate = vi.fn();
const approveMutate = vi.fn();
const rejectMutate = vi.fn();
const flagMutate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "review-1" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/use-api", () => ({
  useReviewDetail: () => ({
    data: {
      id: "review-1",
      document: "Cardiology_Final.pdf",
      status: "pending",
      page: 3,
      pageContent: "Page content",
      sourceExcerpt: "What is the function of the heart?",
      question: "What is the function of the heart?",
      options: ["Pump blood", "Digest food"],
      correctIndex: 0,
      explanation: "The heart pumps blood.",
      confidence: 92,
      confidenceBreakdown: [0.95, 0.89],
      difficulty: "medium",
      tags: ["cardiology"],
    },
  }),
  useReviewNavigation: () => ({
    data: {
      ids: ["review-0", "review-1", "review-2"],
      previousId: "review-0",
      nextId: "review-2",
      hasPrevious: true,
      hasNext: true,
      currentIndex: 2,
      totalCount: 3,
    },
  }),
  useApproveReview: () => ({ mutate: approveMutate }),
  useRejectReview: () => ({ mutate: rejectMutate }),
  useFlagReview: () => ({ mutate: flagMutate }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/components/review/PdfViewerPanel", () => ({
  PdfViewerPanel: ({ documentName }: { documentName: string }) => <div data-testid="pdf-panel">{documentName}</div>,
}));

vi.mock("@/components/review/McqEditorPanel", () => ({
  McqEditorPanel: ({ question }: { question: string }) => <div data-testid="mcq-panel">{question}</div>,
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
  return render(
    <MemoryRouter initialEntries={["/review/review-1"]}>
      <Routes>
        <Route path="/review/:id" element={<ReviewDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ReviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the detail header and status", () => {
    renderReviewDetail();

    expect(screen.getAllByText("Cardiology_Final.pdf").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
  });

  it("renders the viewer panels and navigation controls", () => {
    renderReviewDetail();

    expect(screen.getByTestId("pdf-panel")).toHaveTextContent("Cardiology_Final.pdf");
    expect(screen.getByTestId("mcq-panel")).toHaveTextContent("What is the function of the heart?");
    expect(screen.getByLabelText("Back to review queue")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous question")).toBeInTheDocument();
    expect(screen.getByLabelText("Next question")).toBeInTheDocument();
    expect(screen.getByTestId("action-bar")).toBeInTheDocument();
  });
});
