import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("defaults the login CTA to the operator app route", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const loginLinks = screen.getAllByRole("link", { name: "Login" });
    expect(loginLinks[0]).toHaveAttribute("href", "/app/login");
  });

  it("opens desktop dropdown menus on hover", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: /solutions/i }));

    expect(await screen.findByRole("menuitem", { name: "PDF to Question Bank" })).toBeInTheDocument();
  });
});
