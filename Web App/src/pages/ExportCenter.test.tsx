import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportCenter from "./ExportCenter";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!["layout", "variants", "initial", "animate", "exit", "whileHover", "whileTap"].includes(k)) {
          filtered[k] = v;
        }
      }
      return <div {...filtered}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mock StaggerContainer
vi.mock("@/components/StaggerContainer", () => ({
  StaggerContainer: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  StaggerItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// Mock UpgradeBanner
vi.mock("@/components/UpgradeBanner", () => ({
  UpgradeBanner: ({ title }: { title: string }) => <div data-testid="upgrade-banner">{title}</div>,
}));

describe("ExportCenter", () => {
  it("renders heading and format cards", () => {
    render(<ExportCenter />);
    expect(screen.getByText("Export Center")).toBeInTheDocument();
    // Format names appear in both cards AND history badges, so use getAllByText
    for (const fmt of ["JSON", "CSV", "QTI", "SCORM", "xAPI"]) {
      expect(screen.getAllByText(fmt).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders export configuration section", () => {
    render(<ExportCenter />);
    expect(screen.getByText("Export Configuration")).toBeInTheDocument();
    expect(screen.getByText("Generate Export")).toBeInTheDocument();
    expect(screen.getByText(/Minimum Confidence/)).toBeInTheDocument();
  });

  it("shows export history with initial items", () => {
    render(<ExportCenter />);
    expect(screen.getByText("Export History")).toBeInTheDocument();
    expect(screen.getByText("245 records")).toBeInTheDocument();
    expect(screen.getByText("132 records")).toBeInTheDocument();
    expect(screen.getByText("410 records")).toBeInTheDocument();
  });

  it("shows upgrade banner when 3+ exports exist", () => {
    render(<ExportCenter />);
    expect(screen.getByTestId("upgrade-banner")).toHaveTextContent("Export Limit Approaching");
  });

  it("removes an export from history", async () => {
    const user = userEvent.setup();
    render(<ExportCenter />);

    expect(screen.getByText("245 records")).toBeInTheDocument();

    // History has Download and delete buttons per row. Find the trash buttons by looking for SVGs.
    const allButtons = screen.getAllByRole("button");
    // The delete buttons have the destructive hover class
    const deleteButtons = allButtons.filter(
      (btn) => btn.className.includes("hover:text-destructive"),
    );
    expect(deleteButtons.length).toBeGreaterThanOrEqual(3);

    await user.click(deleteButtons[0]);
    expect(screen.queryByText("245 records")).not.toBeInTheDocument();
  });

  it("shows error toast when export clicked without format", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<ExportCenter />);

    await user.click(screen.getByText("Generate Export"));
    expect(toast.error).toHaveBeenCalledWith("Please choose an export format first.");
  });
});
