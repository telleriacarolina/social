"use client";

import { useState } from "react";

import { saveProfile } from "@/app/profile/actions";
import type { ProfileInput } from "@/lib/validation/profile";
import { validateProfile } from "@/lib/validation/profile";

type ProfileEditorProps = {
  initialValues: ProfileInput;
};

export function ProfileEditor({ initialValues }: ProfileEditorProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof ProfileInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validation = validateProfile(values);

    if (!validation.success) {
      setError(
        validation.errors.username ||
          validation.errors.displayName ||
          validation.errors.bio ||
          "Please check your profile details.",
      );
      return;
    }

    setLoading(true);

    try {
      const result = await saveProfile(validation.data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setValues(validation.data);
      setMessage("Your profile has been saved.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          value={values.username}
          onChange={(event) => updateField("username", event.target.value)}
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]*"
          autoComplete="username"
        />
        <small>3–30 letters, numbers, or underscores.</small>
      </div>

      <div>
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          name="displayName"
          value={values.displayName}
          onChange={(event) =>
            updateField("displayName", event.target.value)
          }
          maxLength={80}
        />
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={values.bio}
          onChange={(event) => updateField("bio", event.target.value)}
          maxLength={500}
          rows={5}
        />
      </div>

      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
