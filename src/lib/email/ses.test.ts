import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock, clientMock, commandMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  clientMock: vi.fn(),
  commandMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = sendMock;

    constructor(config: unknown) {
      clientMock(config);
    }
  },
  SendEmailCommand: class {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
      commandMock(input);
    }
  },
}));

import { MailError, sendSesEmail } from "./ses";

describe("sendSesEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.AWS_REGION = "us-east-1";
    process.env.SES_FROM_EMAIL = "notifications@example.com";

    sendMock.mockResolvedValue({});
  });

  it("sends a validated text email through SES", async () => {
    await sendSesEmail({
      to: "user@example.com",
      subject: "Your password was changed",
      text: "Your password was successfully changed.",
    });

    expect(clientMock).toHaveBeenCalledWith({
      region: "us-east-1",
      maxAttempts: 1,
    });

    expect(commandMock).toHaveBeenCalledWith({
      FromEmailAddress: "notifications@example.com",
      Destination: {
        ToAddresses: ["user@example.com"],
      },
      Content: {
        Simple: {
          Subject: {
            Data: "Your password was changed",
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: "Your password was successfully changed.",
              Charset: "UTF-8",
            },
          },
        },
      },
    });

    expect(sendMock).toHaveBeenCalledTimes(1);

    const sendOptions = sendMock.mock.calls[0][1];

    expect(sendOptions.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it("rejects an invalid sender address", async () => {
    process.env.SES_FROM_EMAIL = "not-an-email";

    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a missing sender address", async () => {
    delete process.env.SES_FROM_EMAIL;

    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a missing AWS region", async () => {
    delete process.env.AWS_REGION;

    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an AWS region containing line breaks", async () => {
    process.env.AWS_REGION = "us-east-1\nInjected";

    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "configuration",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid recipient address", async () => {
    await expect(
      sendSesEmail({
        to: "not-an-email",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "input",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty subject", async () => {
    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "   ",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "input",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects a subject containing line breaks", async () => {
    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test\nInjected",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "input",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects an empty message body", async () => {
    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "   ",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "input",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sanitizes AWS SDK delivery errors", async () => {
    sendMock.mockRejectedValue(
      new Error("Sensitive AWS credentials or request details"),
    );

    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "delivery",
      message: "Email delivery failed.",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("does not expose unexpected client initialization errors", async () => {
    // Force the SES module to create a new client instead of reusing
    // the client cached by an earlier test.
    process.env.AWS_REGION = "us-west-2";

    clientMock.mockImplementationOnce(() => {
      throw new Error("Sensitive initialization details");
    });

    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "Test message",
      }),
    ).rejects.toMatchObject({
      name: "MailError",
      code: "delivery",
      message: "Email delivery failed.",
    });
  });

  it("does not send when the message input is invalid", async () => {
    await expect(
      sendSesEmail({
        to: "user@example.com",
        subject: "Test",
        text: "",
      }),
    ).rejects.toBeInstanceOf(MailError);

    expect(sendMock).not.toHaveBeenCalled();
  });
});
