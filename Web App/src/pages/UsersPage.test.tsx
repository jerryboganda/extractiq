import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersPage from "./UsersPage";

const inviteMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();

vi.mock("framer-motion", () => ({
  motion: {
    tr: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <tr {...props}>{children}</tr>,
  },
}));

vi.mock("@/hooks/use-api", () => ({
  useUsers: () => ({
    data: [
      {
        id: "u1",
        name: "Alice Smith",
        email: "alice@example.com",
        role: "workspace_admin",
        roleLabel: "Admin",
        status: "active",
        lastActive: "2026-03-13 10:00",
      },
      {
        id: "u2",
        name: "Bob Jones",
        email: "bob@example.com",
        role: "reviewer",
        roleLabel: "Reviewer",
        status: "active",
        lastActive: "2026-03-13 09:00",
      },
      {
        id: "u3",
        name: "Cara Analyst",
        email: "cara@example.com",
        role: "analyst",
        roleLabel: "Analyst",
        status: "inactive",
        lastActive: "Never",
      },
    ],
  }),
  useInviteUser: () => ({ mutate: inviteMutate }),
  useUpdateUser: () => ({ mutate: updateMutate }),
  useDeleteUser: () => ({ mutate: deleteMutate }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders workspace users with canonical role labels", () => {
    render(<UsersPage />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getAllByText("Admin")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Reviewer")[0]).toBeInTheDocument();
  });

  it("validates invite email before submitting", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
    expect(inviteMutate).not.toHaveBeenCalled();
  });

  it("submits invites using canonical lowercase roles", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    await user.type(screen.getByLabelText("Email Address"), "new@university.edu");
    await user.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(inviteMutate).toHaveBeenCalledWith({
        email: "new@university.edu",
        role: "reviewer",
      });
    });
  });

  it("filters users by search and canonical role tabs", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.type(screen.getByPlaceholderText("Search users..."), "alice");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search users..."));
    await user.click(screen.getByRole("tab", { name: "Analyst" }));

    expect(screen.getByText("Cara Analyst")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });
});
