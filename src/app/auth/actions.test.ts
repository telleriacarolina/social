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

import { signOutAction } from "@/app/auth/actions";

describe("signOutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it("redirects home after successful sign-out", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("returns to the account page when Supabase reports a sign-out error", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signOut: vi.fn().mockResolvedValue({
          error: new Error("Sign-out failed"),
        }),
      },
    });

    await expect(signOutAction()).rejects.toThrow(
      "NEXT_REDIRECT:/account?signout=failed",
    );
  });

  it("returns to the account page when sign-out throws", async () => {
    createClientMock.mockRejectedValue(new Error("Connection failed"));

    await expect(signOutAction()).rejects.toThrow(
      "NEXT_REDIRECT:/account?signout=failed",
    );
  });
});
