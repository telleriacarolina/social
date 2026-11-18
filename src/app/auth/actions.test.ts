import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { signOutAction, signUpAction } from "@/app/auth/actions";

describe("signOutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to the home page after signing out", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("redirects to login with an error when sign out fails", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({
          error: new Error("Sign out failed"),
        }),
      },
    });

    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    await expect(signOutAction()).rejects.toThrow(
      "NEXT_REDIRECT:/login?error=signout",
    );
  });

  it("redirects to login when sign out throws", async () => {
    createClientMock.mockRejectedValue(new Error("Network failure"));

    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    await expect(signOutAction()).rejects.toThrow(
      "NEXT_REDIRECT:/login?error=signout",
    );
  });
});

describe("signUpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://social.example.com";

    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it("returns the same neutral response for new and already-registered emails", async () => {
    const signUpMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          user: {
            id: "new-user",
            identities: [{ id: "identity-1" }],
          },
          session: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: "existing-user",
            identities: [],
          },
          session: null,
        },
        error: null,
      });

    createClientMock.mockResolvedValue({
      auth: {
        signUp: signUpMock,
      },
    });

    const newEmailForm = new FormData();
    newEmailForm.set("email", "new@example.com");
    newEmailForm.set("password", "StrongPassword123!");

    const existingEmailForm = new FormData();
    existingEmailForm.set("email", "existing@example.com");
    existingEmailForm.set("password", "StrongPassword123!");

    const newEmailResult = await signUpAction({}, newEmailForm);
    const existingEmailResult = await signUpAction({}, existingEmailForm);

    expect(newEmailResult).toEqual({
      message:
        "Your signup request has been received. If confirmation is required, check your email for a link to activate your account.",
    });

    expect(existingEmailResult).toEqual(newEmailResult);
    expect(signUpMock).toHaveBeenCalledTimes(2);
  });

  it("redirects to the profile when signup returns a session", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {
            user: { id: "new-user" },
            session: { access_token: "test-token" },
          },
          error: null,
        }),
      },
    });

    const formData = new FormData();
    formData.set("email", "new@example.com");
    formData.set("password", "StrongPassword123!");

    await expect(signUpAction({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/profile",
    );
  });

  it("returns a safe error when Supabase rejects signup", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: new Error("Signup failed"),
        }),
      },
    });

    const formData = new FormData();
    formData.set("email", "new@example.com");
    formData.set("password", "StrongPassword123!");

    const result = await signUpAction({}, formData);

    expect(result.error).toBe(
      "Unable to create your account. Please try again.",
    );
  });
});
