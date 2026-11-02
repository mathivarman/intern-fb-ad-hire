/**
 * Normalize a Sri Lankan phone number to the format: 94XXXXXXXXX
 * Handles: 0771234567, +94771234567, 94771234567, 771234567
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");
  
  // Remove leading country code 94 if present
  if (digits.startsWith("94") && digits.length === 11) {
    digits = digits.slice(2);
  }
  
  // Remove leading 0 if present
  if (digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  }
  
  // At this point should be 9 digits (Sri Lankan local number)
  if (digits.length === 9) {
    return `94${digits}`;
  }
  
  // Return normalized if 11 digits starting with 94
  if (digits.length === 11 && digits.startsWith("94")) {
    return digits;
  }
  
  // Return as-is if we can't normalize
  return digits;
}

/**
 * Check if two phone numbers are the same after normalization
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  return normalizePhone(phone1) === normalizePhone(phone2);
}
