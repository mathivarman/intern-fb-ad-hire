import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function guessCountryFromPhone(phone: string): string {
  if (!phone) return "Other";
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  // Match Sri Lankan formats:
  // - 94 followed by 9 digits (11 digits total)
  // - 0094 followed by 9 digits (13 digits total)
  // - 070, 071, 072, 074, 075, 076, 077, 078 followed by 7 digits (10 digits total)
  // - 70, 71, 72, 74, 75, 76, 77, 78 followed by 7 digits (9 digits total)
  const isSriLanka = 
    /^(?:94\d{9}|0094\d{9}|07[01245678]\d{7}|7[01245678]\d{7})$/.test(cleanPhone);

  if (isSriLanka) {
    return "Sri Lanka";
  }

  // Starts with 91 (India) or 0091
  if (cleanPhone.startsWith("91") || cleanPhone.startsWith("0091")) {
    return "India";
  }

  // Default to Other
  return "Other";
}

export function classifyCountry(country: string, phone?: string): "Sri Lanka" | "India" | "Other" {
  const clean = (country || "").trim().toLowerCase();
  
  if (["sri lanka", "srilanka", "sl", "srilankan", "lanka", "sri-lanka"].includes(clean)) {
    return "Sri Lanka";
  }
  if (["india", "ind", "in", "indian"].includes(clean)) {
    return "India";
  }
  
  if (!clean && phone) {
    const guessed = guessCountryFromPhone(phone);
    if (guessed === "Sri Lanka" || guessed === "India") {
      return guessed;
    }
  }
  
  return "Other";
}

