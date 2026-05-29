export interface EmailValidationResult {
  isValid: boolean;
  normalized?: string; // Lowercase, trimmed
  error?: string;
}

const COMMON_EMAIL_TYPOS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "yahoo.con": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmail.con": "hotmail.com",
  "outlook.con": "outlook.com",
};

export function validateAndNormalizeEmail(
  email: string | null | undefined
): EmailValidationResult {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Invalid email format" };
  }

  const [localPart, domain] = trimmed.split("@");
  const correctedDomain = COMMON_EMAIL_TYPOS[domain];
  if (correctedDomain) {
    return { isValid: false, error: `Did you mean ${localPart}@${correctedDomain}?` };
  }

  if (!domain.includes(".")) {
    return { isValid: false, error: "Email must include a domain (e.g. .com)" };
  }

  return { isValid: true, normalized: trimmed };
}

export function normalizeEmail(email: string | null | undefined): string | null {
  return validateAndNormalizeEmail(email).normalized ?? null;
}

export function isEmailValid(email: string | null | undefined): boolean {
  return validateAndNormalizeEmail(email).isValid;
}
