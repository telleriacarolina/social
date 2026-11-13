import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveProfile } = vi.hoisted(() => ({
  saveProfile: vi.fn(),
}));

vi.mock("@/app/profile/actions", () => ({
  saveProfile,
}));

import { ProfileEditor } from "./profile-editor";

const initialValues = {
  username: "alice_123",
  displayName: "Alice Smith",
  bio: "Hello there.",
};

describe("ProfileEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors without calling the server action", async () => {
    render(<ProfileEditor initialValues={initialValues} />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "ab" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Save profile" }).closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Use 3–30 lowercase letters, numbers, or underscores.",
    );
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("saves valid profile details and shows confirmation", async () => {
    saveProfile.mockResolvedValue({ success: true });

    render(<ProfileEditor initialValues={initialValues} />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "  Alice Example  " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(saveProfile).toHaveBeenCalledWith({
        username: "alice_123",
        displayName: "Alice Example",
        bio: "Hello there.",
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your profile has been saved.",
    );
  });

  it("shows a server error when the save action fails", async () => {
    saveProfile.mockResolvedValue({
      success: false,
      error: "That username is already taken.",
    });

    render(<ProfileEditor initialValues={initialValues} />);

    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That username is already taken.",
    );
  });
});
