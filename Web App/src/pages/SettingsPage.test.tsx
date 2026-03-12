import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsPage from "./SettingsPage";

const mockMutate = vi.fn();

const workspaceData = {
  id: "ws-1",
  name: "Test Workspace",
  description: "A test workspace",
  plan: "pro",
  apiKey: "sk_live_mcq_test123",
  maxFileSizeMb: 50,
  autoApproveThreshold: false,
  settings: { emailNotifications: true, webhookUrl: "" },
};

const usageData = {
  documentsUsed: 42,
  documentsLimit: 100,
  apiCallsUsed: 1500,
  apiCallsLimit: 10000,
};

vi.mock("@/hooks/use-api", () => ({
  useWorkspace: () => ({ data: workspaceData, isLoading: false }),
  useUpdateWorkspace: () => ({ mutate: mockMutate }),
  useWorkspaceUsage: () => ({ data: usageData }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SettingsPage />
    </QueryClientProvider>
  );
}

describe("SettingsPage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders heading and form sections", () => {
    renderSettings();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Limits & Defaults")).toBeInTheDocument();
  });

  it("populates form with workspace data", () => {
    renderSettings();
    expect(screen.getByLabelText("Workspace Name")).toHaveValue("Test Workspace");
    expect(screen.getByLabelText("Description")).toHaveValue("A test workspace");
  });

  it("shows validation error for empty workspace name", async () => {
    const user = userEvent.setup();
    renderSettings();

    const nameInput = screen.getByLabelText("Workspace Name");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Workspace name is required")).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid webhook URL", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText("Webhook URL"), "not-a-url");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Must be a valid URL")).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    renderSettings();

    const nameInput = screen.getByLabelText("Workspace Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Workspace");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Updated Workspace" }),
      );
    });
  });

  it("disables save button when form is not dirty", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows billing usage data", () => {
    renderSettings();
    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("pro")).toBeInTheDocument();
    expect(screen.getByText("Documents this month")).toBeInTheDocument();
  });

  it("shows danger zone with delete button", () => {
    renderSettings();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete workspace/i })).toBeInTheDocument();
  });
});
