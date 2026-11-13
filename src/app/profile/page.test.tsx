import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, maybeSingle, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  })),
}));

vi.mock("@/app/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/components/profile/profile-editor", () => ({
  ProfileEditor: ({ initialValues }: {
    initialValues: {
      username: string;
      displayName: string;
      bio: string;
    };
  }) => (
    <div data-testid="profile-editor">
      {JSON.stringify(initialValues)}
    </div>
  ),
}));

import ProfilePage from "./page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated visitors to login", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(ProfilePage()).rejects.toThrow(
      "REDIRECT:/login?next=/profile",
    );

    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("shows an error when the profile cannot be loaded", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "alice@example.com" } },
      error: null,
    });

    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Database unavailable" },
    });

    render(await ProfilePage());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not load your profile. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("renders the authenticated user's profile", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "alice@example.com" } },
      error: null,
    });

    maybeSingle.mockResolvedValue({
      data: {
        username: "alice_123",
        display_name: "Alice Smith",
        bio: "Hello there.",
      },
      error: null,
    });

    render(await ProfilePage());

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("profile-editor")).toHaveTextContent(
      JSON.stringify({
        username: "alice_123",
        displayName: "Alice Smith",
        bio: "Hello there.",
      }),
    );
  });
});
