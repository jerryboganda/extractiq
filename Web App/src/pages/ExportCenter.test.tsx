import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportCenter from "./ExportCenter";

const createExportMutateAsync = vi.fn();
const downloadExportMutate = vi.fn();

vi.mock("@/hooks/use-api", () => ({
  useProjects: () => ({
    data: {
      items: [
        { id: "project-1", name: "Biology" },
        { id: "project-2", name: "Cardiology" },
      ],
    },
  }),
  useExports: () => ({
    data: {
      items: [
        { id: "export-1", format: "json", status: "completed", totalRecords: 245, createdAt: "2026-03-13T00:00:00.000Z" },
        { id: "export-2", format: "csv", status: "processing", totalRecords: 132, createdAt: "2026-03-12T00:00:00.000Z" },
      ],
    },
  }),
  useCreateExport: () => ({
    mutateAsync: createExportMutateAsync,
    isPending: false,
  }),
  useDownloadExport: () => ({
    mutate: downloadExportMutate,
    isPending: false,
  }),
}));

describe("ExportCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders export formats and history from live data", () => {
    render(<ExportCenter />);

    expect(screen.getByText("Export Center")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("QTI")).toBeInTheDocument();
    expect(screen.getByText("Export History")).toBeInTheDocument();
    expect(screen.getByText(/245 records/)).toBeInTheDocument();
  });

  it("creates an export with the selected project and filters", async () => {
    const user = userEvent.setup();
    render(<ExportCenter />);

    await user.selectOptions(screen.getByRole("combobox"), "project-1");
    await user.clear(screen.getByDisplayValue("75"));
    await user.type(screen.getByRole("spinbutton"), "80");
    await user.click(screen.getByRole("button", { name: /generate export/i }));

    await waitFor(() => {
      expect(createExportMutateAsync).toHaveBeenCalledWith({
        format: "json",
        projectId: "project-1",
        dateFrom: undefined,
        dateTo: undefined,
        minConfidence: 80,
        status: "approved",
      });
    });
  });

  it("downloads completed exports only", async () => {
    const user = userEvent.setup();
    render(<ExportCenter />);

    const buttons = screen.getAllByRole("button", { name: /download/i });
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();

    await user.click(buttons[0]);

    expect(downloadExportMutate).toHaveBeenCalledWith("export-1");
  });
});
