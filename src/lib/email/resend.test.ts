import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendEmail, sendResendEmail } from "./resend";

const message = {
  to: "recipient@example.com",
  subject: "Your notification",
  text: "A trusted application notification.",
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "test-key-not-a-real-credential");
  vi.stubEnv("RESEND_FROM_EMAIL", "notifications@example.com");
  vi.stubEnv("RESEND_ALLOW_TEST_SENDER", "false");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubGlobal("fetch", fetchMock);

  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("sendResendEmail", () => {
  it("preserves the backwards-compatible sendEmail export", () => {
    expect(sendEmail).toBe(sendResendEmail);
  });

  it("sends validated text email using server-side fetch", async () => {
    await expect(sendResendEmail(message)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-key-not-a-real-credential",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "notifications@example.com",
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: expect.any(AbortSignal),
        redirect: "error",
        cache: "no-store",
      }),
    );
  });

  it("trims surrounding whitespace from the API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "  test-key-not-a-real-credential  ");

    await expect(sendResendEmail(message)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-key-not-a-real-credential",
        }),
      }),
    );
  });

  it("rejects a missing API key", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(sendResendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows the exact Resend onboarding sender in Preview when explicitly enabled", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev");
    vi.stubEnv("RESEND_ALLOW_TEST_SENDER", "true");
    vi.stubEnv("VERCEL_ENV", "preview");

    await expect(sendResendEmail(message)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      }),
    );
  });

  it("rejects other resend.dev senders even when Preview testing is enabled", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "notifications@resend.dev");
    vi.stubEnv("RESEND_ALLOW_TEST_SENDER", "true");
    vi.stubEnv("VERCEL_ENV", "preview");

    await expect(sendResendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects the onboarding sender when the test-sender opt-in is disabled", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev");
    vi.stubEnv("RESEND_ALLOW_TEST_SENDER", "false");
    vi.stubEnv("VERCEL_ENV", "preview");

    await expect(sendResendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects the onboarding sender outside Preview even when explicitly enabled", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "onboarding@resend.dev");
    vi.stubEnv("RESEND_ALLOW_TEST_SENDER", "true");
    vi.stubEnv("VERCEL_ENV", "production");

    await expect(sendResendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid message input", async () => {
    await expect(
      sendResendEmail({
        ...message,
        subject: "Invalid\nSubject",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "input",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sanitizes transport errors", async () => {
    fetchMock.mockRejectedValue(
      new Error("Sensitive request or credential details"),
    );

    await expect(sendResendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "delivery",
      message: "Email delivery failed.",
    });
  });

  it("sanitizes unsuccessful HTTP responses", async () => {
    fetchMock.mockResolvedValue(
      new Response("Sensitive provider response", { status: 500 }),
    );

    await expect(sendResendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "delivery",
      message: "Email delivery failed.",
      status: 500,
    });
  });
});
