
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resendMock, sesMock } = vi.hoisted(() => ({
  resendMock: vi.fn(),
  sesMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("./resend", () => ({
  sendResendEmail: resendMock,
}));

vi.mock("./ses", () => ({
  sendSesEmail: sesMock,
}));

import { MailError } from "./types";
import { sendEmail } from "./index";

const message = {
  to: "recipient@example.com",
  subject: "Your notification",
  text: "A trusted application notification.",
};

beforeEach(() => {
  vi.stubEnv("EMAIL_PROVIDER", "");
  resendMock.mockResolvedValue(undefined);
  sesMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("sendEmail provider selection", () => {
  it("uses Resend by default for backwards compatibility", async () => {
    await expect(sendEmail(message)).resolves.toBeUndefined();

    expect(resendMock).toHaveBeenCalledWith(message);
    expect(sesMock).not.toHaveBeenCalled();
  });

  it("uses Resend when explicitly configured", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");

    await expect(sendEmail(message)).resolves.toBeUndefined();

    expect(resendMock).toHaveBeenCalledWith(message);
    expect(sesMock).not.toHaveBeenCalled();
  });

  it("uses SES when explicitly configured", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "ses");

    await expect(sendEmail(message)).resolves.toBeUndefined();

    expect(sesMock).toHaveBeenCalledWith(message);
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("normalizes provider configuration", async () => {
    vi.stubEnv("EMAIL_PROVIDER", " SES ");

    await expect(sendEmail(message)).resolves.toBeUndefined();

    expect(sesMock).toHaveBeenCalledWith(message);
  });

  it("rejects unknown providers without sending", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "unknown");

    await expect(sendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(resendMock).not.toHaveBeenCalled();
    expect(sesMock).not.toHaveBeenCalled();
  });

  it("propagates sanitized transport errors", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "ses");

    sesMock.mockRejectedValue(
      new MailError("delivery", "Email delivery failed."),
    );

    await expect(sendEmail(message)).rejects.toMatchObject({
      name: "MailError",
      code: "delivery",
      message: "Email delivery failed.",
    });
  });
});
