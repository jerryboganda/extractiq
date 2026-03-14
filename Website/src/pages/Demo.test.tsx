import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Demo from "./Demo";

const postPublicMock = vi.fn();
const toastMock = vi.fn();

vi.mock("@/lib/api", () => ({
  postPublic: (...args: unknown[]) => postPublicMock(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/layout/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/components/layout/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/layout/PageMeta", () => ({
  default: () => null,
}));

describe("Demo page", () => {
  beforeEach(() => {
    postPublicMock.mockReset();
    toastMock.mockReset();
  });

  it("submits a demo request and resets the form", async () => {
    postPublicMock.mockResolvedValue({ data: { id: "demo_1" } });

    render(
      <MemoryRouter>
        <Demo />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Hopper" } });
    fireEvent.change(screen.getByLabelText("Work Email *"), { target: { value: "grace@example.com" } });
    fireEvent.change(screen.getByLabelText("Company *"), { target: { value: "Navy" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "CTO" } });
    fireEvent.change(screen.getByLabelText("Monthly Document Volume"), { target: { value: "1200" } });
    fireEvent.click(screen.getByRole("button", { name: "Request Demo" }));

    await waitFor(() => {
      expect(postPublicMock).toHaveBeenCalledWith("/public/demo-request", {
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@example.com",
        company: "Navy",
        role: "CTO",
        monthlyVolume: "1200",
        useCase: "Requested from public demo page",
      });
    });

    expect(toastMock).toHaveBeenCalledWith({
      title: "Demo requested!",
      description: "We'll be in touch within 24 hours.",
    });
    expect(screen.getByLabelText("First Name *")).toHaveValue("");
  });

  it("blocks invalid email addresses before submission", async () => {
    render(
      <MemoryRouter>
        <Demo />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Hopper" } });
    fireEvent.change(screen.getByLabelText("Work Email *"), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Company *"), { target: { value: "Navy" } });
    fireEvent.submit(screen.getByRole("button", { name: "Request Demo" }).closest("form")!);

    expect(postPublicMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      title: "Invalid email",
      description: "Please enter a valid work email address.",
      variant: "destructive",
    });
  });
});
