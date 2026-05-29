import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // E.164 format: +1234567890
  formatted?: string;  // National format: (123) 456-7890
  country?: string;
  error?: string;
}

export function validateAndNormalizePhone(
  phone: string | null | undefined,
  defaultCountry: CountryCode = "US"
): PhoneValidationResult {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Phone number is required" };
  }

  const cleanPhone = phone.trim();

  try {
    if (!isValidPhoneNumber(cleanPhone, defaultCountry)) {
      return {
        isValid: false,
        error: "Invalid phone number. Use format: (555) 123-4567 or +1-555-123-4567",
      };
    }

    const phoneNumber = parsePhoneNumber(cleanPhone, defaultCountry);

    return {
      isValid: true,
      normalized: phoneNumber.number,       // E.164: +1234567890
      formatted: phoneNumber.formatNational(), // (123) 456-7890
      country: phoneNumber.country,
    };
  } catch {
    return {
      isValid: false,
      error: "Invalid phone number. Please enter a valid US phone number.",
    };
  }
}

export function normalizePhone(
  phone: string | null | undefined,
  defaultCountry: CountryCode = "US"
): string | null {
  const result = validateAndNormalizePhone(phone, defaultCountry);
  return result.normalized ?? null;
}

export function isPhoneValid(
  phone: string | null | undefined,
  defaultCountry: CountryCode = "US"
): boolean {
  if (!phone || phone.trim() === "") return false;
  return validateAndNormalizePhone(phone, defaultCountry).isValid;
}
