// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { MailError, sendEmail } from "./resend";

const message = {
  to: "recipient@example.com",
  subject: "Your notification",
  text: "A trusted application notification.",
};
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "test-key-not-a-real-credential");
  vi.stubEnv("RESEND_FROM_EMAIL", "notifications@example.com");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("sendEmail", () => {
  it("sends validated text email using server-side fetch", async () => {
    await expect(sendEmail(message)).resolves.toBeUndefined();
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

  it.each(["RESEND_API_KEY", "RESEND_FROM_EMAIL"])(
    "rejects missing %s without contacting Resend",
    async (key) => {
      vi.stubEnv(key, "");
      await expect(sendEmail(message)).rejects.toMatchObject({ code: "configuration" });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(["invalid", "a@example.com\r\nBcc: b@example.com", "onboarding@resend.dev"])(
    "rejects an invalid or untrusted sender %s",
    async (sender) => {
      vi.stubEnv("RESEND_FROM_EMAIL", sender);
      await expect(sendEmail(message)).rejects.toBeInstanceOf(MailError);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    { to: "invalid" },
    { to: "a@example.com,b@example.com" },
    { to: "a@example.com\r\nBcc: b@example.com" },
    { subject: "" },
    { subject: "Hello\r\nBcc: b@example.com" },
    { text: " " },
    { text: "x".repeat(100_001) },
  ])("rejects invalid input without sending", async (overrides) => {
    await expect(sendEmail({ ...message, ...overrides })).rejects.toMatchObject({
      code: "input",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 429, 500])("sanitizes provider failures (%s)", async (status) => {
    fetchMock.mockResolvedValue(new Response("sensitive provider details", { status }));
    await expect(sendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "delivery",
      message: "Email delivery failed.",
      status,
    });
  });

  it("discards sensitive network exception details", async () => {
    fetchMock.mockRejectedValue(new Error("Bearer test-key-not-a-real-credential"));
    const error = await sendEmail(message).catch((caught: unknown) => caught);
    expect(error).toMatchObject({
      code: "delivery",
      message: "Email delivery failed.",
    });
    expect(error).not.toHaveProperty("cause");
    expect(String(error)).not.toContain("test-key-not-a-real-credential");
  });
});
