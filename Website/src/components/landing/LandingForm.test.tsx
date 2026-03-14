import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LandingForm from "./LandingForm";

const postPublicMock = vi.fn();

vi.mock("@/lib/api", () => ({
  postPublic: (...args: unknown[]) => postPublicMock(...args),
}));

describe("LandingForm", () => {
  beforeEach(() => {
    postPublicMock.mockReset();
  });

  it("submits the contact request payload and shows success state", async () => {
    postPublicMock.mockResolvedValue({ data: { id: "submission_1" } });

    render(<LandingForm />);

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Work Email"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Analytical Engines" } });
    fireEvent.change(screen.getByLabelText("Use case"), { target: { value: "Inbound exam content" } });
    fireEvent.click(screen.getByRole("button", { name: "Book a Demo" }));

    await waitFor(() => {
      expect(postPublicMock).toHaveBeenCalledWith("/public/contact-request", {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        company: "Analytical Engines",
        useCase: "Inbound exam content",
      });
    });

    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
  });

  it("renders backend errors for failed submissions", async () => {
    postPublicMock.mockRejectedValue(new Error("Brevo unavailable"));

    render(<LandingForm />);

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Work Email"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Analytical Engines" } });
    fireEvent.click(screen.getByRole("button", { name: "Book a Demo" }));

    expect(await screen.findByText("Brevo unavailable")).toBeInTheDocument();
  });
});
