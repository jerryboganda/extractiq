import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsersPage from "./UsersPage";

const mockInviteMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock("@/hooks/use-api", () => ({
  useUsers: () => ({
    data: [
      {
        id: "u1",
        name: "Alice Smith",
        email: "alice@example.com",
        role: "Admin",
        status: "active",
        lastActive: "1 hour ago",
      },
      {
        id: "u2",
        name: "Bob Jones",
        email: "bob@example.com",
        role: "Reviewer",
        status: "active",
        lastActive: "3 hours ago",
      },
    ],
  }),
  useInviteUser: () => ({ mutate: mockInviteMutate }),
  useUpdateUser: () => ({ mutate: mockUpdateMutate }),
  useDeleteUser: () => ({ mutate: mockDeleteMutate }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderUsersPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <UsersPage />
    </QueryClientProvider>
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user table", () => {
    renderUsersPage();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("opens invite dialog", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    expect(screen.getByRole("heading", { name: /invite user/i })).toBeInTheDocument();
  });

  it("shows validation error for empty email", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
    expect(mockInviteMutate).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText("Email Address"), "not-an-email");
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    });
    expect(mockInviteMutate).not.toHaveBeenCalled();
  });

  it("submits invite with valid email and default role", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText("Email Address"), "new@university.edu");
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(mockInviteMutate).toHaveBeenCalledWith({
        email: "new@university.edu",
        role: "Reviewer",
      });
    });
  });

  it("filters users by search", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    const searchInput = screen.getByPlaceholderText("Search users...");
    await user.type(searchInput, "alice");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("filters users by role tab", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    await user.click(screen.getByRole("tab", { name: "Viewer" }));
    expect(screen.getByText("No users match your filters.")).toBeInTheDocument();
  });

  it("sets aria-invalid on email field when validation fails", async () => {
    const user = userEvent.setup();
    renderUsersPage();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Email Address")).toHaveAttribute("aria-invalid", "true");
    });
  });
});
