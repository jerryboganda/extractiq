import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadCenter from "./UploadCenter";

// Mock framer-motion to avoid animation issues in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...stripMotionProps(props)}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

function stripMotionProps(props: Record<string, unknown>) {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!["layout", "variants", "initial", "animate", "exit", "whileHover", "whileTap"].includes(k)) {
      filtered[k] = v;
    }
  }
  return filtered;
}

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

describe("UploadCenter", () => {

  it("renders heading and drop zone", () => {
    render(<UploadCenter />);
    expect(screen.getByText("Upload Center")).toBeInTheDocument();
    expect(screen.getByText(/Drop files here or click to browse/)).toBeInTheDocument();
    expect(screen.getByText("Browse Files")).toBeInTheDocument();
  });

  it("shows initial file queue with 4 items", () => {
    render(<UploadCenter />);
    expect(screen.getByText("Cardiology_Final_2025.pdf")).toBeInTheDocument();
    expect(screen.getByText("Dermatology_MCQs.pdf")).toBeInTheDocument();
    expect(screen.getByText("Radiology_Images.png")).toBeInTheDocument();
    expect(screen.getByText("Endocrinology_Ch4.docx")).toBeInTheDocument();
  });

  it("shows upload settings section", () => {
    render(<UploadCenter />);
    expect(screen.getByText("Upload Settings")).toBeInTheDocument();
    expect(screen.getByText("Start Extraction")).toBeInTheDocument();
  });

  it("removes a file from queue", async () => {
    const user = userEvent.setup();
    render(<UploadCenter />);

    expect(screen.getByText("Cardiology_Final_2025.pdf")).toBeInTheDocument();

    // Find the X buttons (one per file row)
    const removeButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector(".lucide-x"),
    );
    expect(removeButtons.length).toBeGreaterThanOrEqual(4);

    // Click the first remove button
    await user.click(removeButtons[0]);

    // The first file should be gone
    expect(screen.queryByText("Cardiology_Final_2025.pdf")).not.toBeInTheDocument();
  });

  it("shows clear completed button when completed files exist", () => {
    render(<UploadCenter />);
    // initialQueue has one completed file
    expect(screen.getByText(/Clear Completed/)).toBeInTheDocument();
  });
});
