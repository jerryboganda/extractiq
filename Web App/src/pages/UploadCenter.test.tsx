import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadCenter from "./UploadCenter";

const presignMutateAsync = vi.fn();
const completeMutateAsync = vi.fn();
const createJobMutateAsync = vi.fn();

vi.mock("@/hooks/use-api", () => ({
  useProjects: () => ({
    data: {
      items: [
        { id: "project-1", name: "Biology" },
        { id: "project-2", name: "Cardiology" },
      ],
    },
  }),
  usePresignUpload: () => ({
    mutateAsync: presignMutateAsync,
  }),
  useCompleteUpload: () => ({
    mutateAsync: completeMutateAsync,
  }),
  useCreateJob: () => ({
    mutateAsync: createJobMutateAsync,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("UploadCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    presignMutateAsync.mockResolvedValue({
      data: {
        uploadUrl: "https://upload.example.com",
        documentId: "doc-1",
        s3Key: "ws-1/doc-1/biology.pdf",
      },
    });
    completeMutateAsync.mockResolvedValue({ data: { id: "doc-1" } });
    createJobMutateAsync.mockResolvedValue({ data: { id: "job-1" } });
  });

  it("renders the real upload workflow shell", () => {
    render(<UploadCenter />);

    expect(screen.getByText("Upload Center")).toBeInTheDocument();
    expect(screen.getByText("Choose documents to upload")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /browse files/i })).toBeInTheDocument();
    expect(screen.getByText("Upload Queue")).toBeInTheDocument();
    expect(screen.getByText("No files selected yet.")).toBeInTheDocument();
  });

  it("uploads a selected file through presign, PUT upload, and completion", async () => {
    const user = userEvent.setup();
    const { container } = render(<UploadCenter />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["biology"], "biology.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [file] } });
    await user.selectOptions(screen.getByRole("combobox"), "project-1");
    await user.click(screen.getByRole("button", { name: /upload files/i }));

    await waitFor(() => {
      expect(presignMutateAsync).toHaveBeenCalledWith({
        filename: "biology.pdf",
        contentType: "application/pdf",
        fileSize: file.size,
        projectId: "project-1",
      });
    });

    expect(global.fetch).toHaveBeenCalledWith("https://upload.example.com", expect.objectContaining({
      method: "PUT",
      body: file,
    }));
    expect(completeMutateAsync).toHaveBeenCalledWith({
      uploadId: "doc-1",
      s3Key: "ws-1/doc-1/biology.pdf",
    });
    expect(await screen.findByText("uploaded")).toBeInTheDocument();
  });

  it("starts extraction for uploaded documents", async () => {
    const user = userEvent.setup();
    const { container } = render(<UploadCenter />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["biology"], "biology.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [file] } });
    await user.selectOptions(screen.getByRole("combobox"), "project-1");
    await user.click(screen.getByRole("button", { name: /upload files/i }));
    await screen.findByText("uploaded");

    await user.click(screen.getByRole("button", { name: /start extraction/i }));

    await waitFor(() => {
      expect(createJobMutateAsync).toHaveBeenCalledWith({
        projectId: "project-1",
        documentIds: ["doc-1"],
      });
    });
  });
});
