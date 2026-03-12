import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Projects from "./Projects";

const mockMutate = vi.fn();

vi.mock("@/hooks/use-api", () => ({
  useProjects: () => ({
    data: {
      items: [
        {
          id: "1",
          name: "Test Project",
          description: "A test project",
          status: "active",
          progress: 50,
          documentsCount: 10,
          mcqCount: 100,
          members: 3,
          lastActivity: "2 hours ago",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  }),
  useCreateProject: () => ({
    mutate: mockMutate,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderProjects() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Projects />
    </QueryClientProvider>
  );
}

describe("Projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders project list", () => {
    renderProjects();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project")).toBeInTheDocument();
  });

  it("shows create dialog when clicking New Project", async () => {
    const user = userEvent.setup();
    renderProjects();

    await user.click(screen.getByRole("button", { name: /new project/i }));
    expect(screen.getByText("Create New Project")).toBeInTheDocument();
  });

  it("shows validation error for empty project name", async () => {
    const user = userEvent.setup();
    renderProjects();

    await user.click(screen.getByRole("button", { name: /new project/i }));
    await user.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByText("Project name is required")).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits form with valid project name", async () => {
    const user = userEvent.setup();
    renderProjects();

    await user.click(screen.getByRole("button", { name: /new project/i }));
    await user.type(screen.getByLabelText("Project Name"), "New Project");
    await user.type(screen.getByLabelText("Description"), "A description");
    await user.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        name: "New Project",
        description: "A description",
      });
    });
  });

  it("filters projects by status tab", async () => {
    const user = userEvent.setup();
    renderProjects();

    expect(screen.getByText("Test Project")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /archived/i }));
    expect(screen.getByText("No projects match your filters.")).toBeInTheDocument();
  });

  it("filters projects by search", async () => {
    const user = userEvent.setup();
    renderProjects();

    const searchInput = screen.getByPlaceholderText("Search projects...");
    await user.type(searchInput, "nonexistent");
    expect(screen.getByText("No projects match your filters.")).toBeInTheDocument();
  });

  it("sets aria-invalid on name field when validation fails", async () => {
    const user = userEvent.setup();
    renderProjects();

    await user.click(screen.getByRole("button", { name: /new project/i }));
    await user.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Project Name")).toHaveAttribute("aria-invalid", "true");
    });
  });
});
