import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, redirectMock, sendEmailMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import {
  signOutAction,
  signUpAction,
  updatePasswordAction,
} from "@/app/auth/actions";

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

describe("updatePasswordAction", () => {
  const accountEmail = "authenticated-account@example.com";

  function createPasswordUpdateClient(
    options: {
      email?: string | undefined;
      updateError?: Error | null;
      userError?: Error | null;
    } = {},
  ) {
    const email = Object.prototype.hasOwnProperty.call(options, "email")
      ? options.email
      : accountEmail;

    const { updateError = null, userError = null } = options;

    const getClaimsMock = vi.fn().mockResolvedValue({
      data: { claims: { sub: "authenticated-user-id" } },
      error: null,
    });

    const getUserMock = vi.fn().mockResolvedValue({
      data: {
        user: email ? { id: "authenticated-user-id", email } : null,
      },
      error: userError,
    });

    const updateUserMock = vi.fn().mockResolvedValue({
      error: updateError,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getClaims: getClaimsMock,
        getUser: getUserMock,
        updateUser: updateUserMock,
      },
    });

    return { getClaimsMock, getUserMock, updateUserMock };
  }

  function createPasswordForm(
    password = "NewStrongPassword123!",
    confirmation = password,
  ) {
    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmPassword", confirmation);
    return formData;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    sendEmailMock.mockResolvedValue(undefined);
  });

  it("sends a notification to the authenticated account email after a successful update", async () => {
    const { getClaimsMock, getUserMock, updateUserMock } =
      createPasswordUpdateClient();

    await expect(
      updatePasswordAction({}, createPasswordForm()),
    ).rejects.toThrow("NEXT_REDIRECT:/profile?password=updated");

    expect(getClaimsMock).toHaveBeenCalledOnce();
    expect(getUserMock).toHaveBeenCalledOnce();
    expect(updateUserMock).toHaveBeenCalledWith({
      password: "NewStrongPassword123!",
    });

    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: accountEmail,
      subject: "Your password was changed",
      text: expect.stringContaining(
        "The password for your Social account was changed.",
      ),
    });
  });

  it("does not use an email address supplied in form data", async () => {
    createPasswordUpdateClient();

    const formData = createPasswordForm();
    formData.set("email", "attacker-controlled@example.com");

    await expect(
      updatePasswordAction({}, formData),
    ).rejects.toThrow("NEXT_REDIRECT:/profile?password=updated");

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: accountEmail }),
    );
    expect(sendEmailMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: "attacker-controlled@example.com" }),
    );
  });

  it("does not send a notification when the password update fails", async () => {
    const { updateUserMock } = createPasswordUpdateClient({
      updateError: new Error("Supabase update failed"),
    });

    const result = await updatePasswordAction(
      {},
      createPasswordForm(),
    );

    expect(result.error).toBe(
      "Unable to update your password. Please try again.",
    );
    expect(updateUserMock).toHaveBeenCalledOnce();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("updates the password but skips notification when the account email is missing", async () => {
    const { updateUserMock } = createPasswordUpdateClient({
      email: undefined,
    });

    await expect(
      updatePasswordAction({}, createPasswordForm()),
    ).rejects.toThrow("NEXT_REDIRECT:/profile?password=updated");

    expect(updateUserMock).toHaveBeenCalledOnce();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("updates the password even when Supabase cannot retrieve the account email", async () => {
    const { updateUserMock } = createPasswordUpdateClient({
      userError: new Error("User lookup failed"),
    });

    await expect(
      updatePasswordAction({}, createPasswordForm()),
    ).rejects.toThrow("NEXT_REDIRECT:/profile?password=updated");

    expect(updateUserMock).toHaveBeenCalledOnce();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not fail the password change when email delivery fails", async () => {
    createPasswordUpdateClient();
    sendEmailMock.mockRejectedValue(
      new Error("Sensitive provider response and credentials"),
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      updatePasswordAction({}, createPasswordForm()),
    ).rejects.toThrow("NEXT_REDIRECT:/profile?password=updated");

    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth] password-change notification delivery failed",
    );
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Sensitive provider response"),
    );

    consoleErrorSpy.mockRestore();
  });

  it("does not update the password or send email without valid claims", async () => {
    const updateUserMock = vi.fn();
    const getUserMock = vi.fn();

    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("Invalid session"),
        }),
        getUser: getUserMock,
        updateUser: updateUserMock,
      },
    });

    const result = await updatePasswordAction(
      {},
      createPasswordForm(),
    );

    expect(result.error).toBe(
      "Your reset session is invalid or expired. Request another link.",
    );
    expect(getUserMock).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords without contacting Supabase or email", async () => {
    const result = await updatePasswordAction(
      {},
      createPasswordForm("NewStrongPassword123!", "DifferentPassword123!"),
    );

    expect(result.error).toBe("The passwords do not match.");
    expect(createClientMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});