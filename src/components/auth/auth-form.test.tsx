import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/auth/actions", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  it("renders the login form with its requested redirect target", () => {
    render(<AuthForm mode="login" nextPath="/profile" />);

    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autoComplete",
      "current-password",
    );

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );

    expect(document.querySelector('input[name="next"]')).toHaveValue("/profile");
  });

  it("renders the signup form with password requirements", () => {
    render(<AuthForm mode="signup" />);

    expect(
      screen.getByRole("heading", { name: "Create your account" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autoComplete",
      "new-password",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "8");

    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/login");

    expect(document.querySelector('input[name="next"]')).toBeNull();
  });

  it("links login users to account creation", () => {
    render(<AuthForm mode="login" />);

    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/signup");
  });
});
