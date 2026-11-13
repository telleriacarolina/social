import { describe, expect, it } from "vitest";

import { validateProfile } from "./profile";

describe("validateProfile", () => {
  it("normalizes valid profile input", () => {
    expect(
      validateProfile({
        username: "  Alice_123 ",
        displayName: "  Alice Smith ",
        bio: "  Hello there. ",
      }),
    ).toEqual({
      success: true,
      data: {
        username: "alice_123",
        displayName: "Alice Smith",
        bio: "Hello there.",
      },
    });
  });

  it("allows an empty username", () => {
    expect(
      validateProfile({
        username: "",
        displayName: "",
        bio: "",
      }),
    ).toEqual({
      success: true,
      data: {
        username: "",
        displayName: "",
        bio: "",
      },
    });
  });

  it("rejects usernames outside the allowed format", () => {
    const result = validateProfile({
      username: "ab",
      displayName: "",
      bio: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors.username).toBeDefined();
    }
  });

  it("rejects display names longer than 80 characters", () => {
    const result = validateProfile({
      username: "",
      displayName: "a".repeat(81),
      bio: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors.displayName).toBeDefined();
    }
  });

  it("rejects bios longer than 500 characters", () => {
    const result = validateProfile({
      username: "",
      displayName: "",
      bio: "a".repeat(501),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors.bio).toBeDefined();
    }
  });
});
