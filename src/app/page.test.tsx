import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "./page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe("HomePage", () => {
  it("renders the main hero heading and introductory content", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /all your social worlds\.\s*one place\./i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/a social experience built around sharing/i),
    ).toBeInTheDocument();
  });

  it("renders the main navigation links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Features" }),
    ).toHaveAttribute("href", "#features");

    expect(
      screen.getByRole("link", { name: "About" }),
    ).toHaveAttribute("href", "#about");
  });

  it("renders all six platform feature cards", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("article")).toHaveLength(6);

    expect(
      screen.getByRole("heading", { name: "Share Your World" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Your Identity, Your Control" }),
    ).toBeInTheDocument();
  });
});
