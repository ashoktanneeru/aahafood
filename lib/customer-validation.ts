export type CustomerField = "name" | "phone" | "email" | "address";

export type CustomerInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type CustomerFieldErrors = Partial<Record<CustomerField, string>>;

export type CustomerValidationResult = {
  valid: boolean;
  normalized: CustomerInput;
  errors: CustomerFieldErrors;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const namePattern = /^[\p{L}][\p{L}\s.'-]{1,59}$/u;

export function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function normalizeCustomerInput(input: CustomerInput): CustomerInput {
  return {
    name: input.name.replace(/\s+/g, " ").trim(),
    phone: normalizePhoneNumber(input.phone),
    email: input.email.trim().toLowerCase(),
    address: input.address.replace(/\s+/g, " ").trim(),
  };
}

export function validateCustomerInput(input: CustomerInput): CustomerValidationResult {
  const normalized = normalizeCustomerInput(input);
  const errors: CustomerFieldErrors = {};

  if (!normalized.name) {
    errors.name = "Please enter your full name.";
  } else if (!namePattern.test(normalized.name)) {
    errors.name = "Name should be 2-60 letters and may include spaces, dots, apostrophes, or hyphens.";
  }

  if (!normalized.phone) {
    errors.phone = "Please enter your phone number.";
  } else if (normalized.phone.length < 10 || normalized.phone.length > 15) {
    errors.phone = "Phone number should have 10-15 digits.";
  }

  if (!normalized.email) {
    errors.email = "Please enter your email address.";
  } else if (!emailPattern.test(normalized.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!normalized.address) {
    errors.address = "Please enter your delivery address.";
  } else if (normalized.address.length < 12 || normalized.address.length > 240) {
    errors.address = "Address should be 12-240 characters long.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    normalized,
    errors,
  };
}

export function getFirstCustomerError(errors: CustomerFieldErrors) {
  return (
    errors.name ??
    errors.phone ??
    errors.email ??
    errors.address ??
    "Please review your details and try again."
  );
}
