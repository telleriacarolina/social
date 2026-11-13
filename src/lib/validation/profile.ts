export type ProfileInput = {
  username: string;
  displayName: string;
  bio: string;
};

export type ProfileFieldErrors = Partial<
  Record<keyof ProfileInput, string>
>;

export type ProfileValidationResult =
  | { success: true; data: ProfileInput }
  | { success: false; errors: ProfileFieldErrors };

export function validateProfile(
  input: ProfileInput,
): ProfileValidationResult {
  const data: ProfileInput = {
    username: input.username.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    bio: input.bio.trim(),
  };

  const errors: ProfileFieldErrors = {};

  if (
    data.username.length > 0 &&
    !/^[a-z0-9_]{3,30}$/.test(data.username)
  ) {
    errors.username =
      "Use 3–30 lowercase letters, numbers, or underscores.";
  }

  if (data.displayName.length > 80) {
    errors.displayName = "Display name must be 80 characters or fewer.";
  }

  if (data.bio.length > 500) {
    errors.bio = "Bio must be 500 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}
