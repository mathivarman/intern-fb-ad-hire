/**
 * Normalize educational qualifications to the strict enum: "Diploma" | "HND" | "Undergraduate" | "Graduate"
 */
export function normalizeEducationLevel(val: string): "Diploma" | "HND" | "Undergraduate" | "Graduate" | undefined {
  if (!val) return undefined;
  const lower = val.toLowerCase().trim();
  
  if (
    lower.includes("undergrad") || 
    lower.includes("reading") || 
    lower.includes("studying") || 
    lower.includes("pursuing") || 
    lower.includes("sliit") || 
    lower.includes("current") || 
    lower.includes("year")
  ) {
    return "Undergraduate";
  }
  
  if (lower.includes("hnd") || lower.includes("higher national") || lower.includes("higher diploma")) {
    return "HND";
  }
  
  if (lower.includes("diploma")) {
    return "Diploma";
  }
  
  if (
    lower.includes("graduate") || 
    lower.includes("degree") || 
    lower.includes("bsc") || 
    lower.includes("beng") || 
    lower.includes("btech") || 
    lower.includes("bachelor") || 
    lower.includes("completed")
  ) {
    return "Graduate";
  }
  
  return undefined;
}

/**
 * Normalize language medium to the strict enum: "Tamil" | "Sinhala" | "English"
 */
export function normalizeLanguage(val: string): "Tamil" | "Sinhala" | "English" | undefined {
  if (!val) return undefined;
  const lower = val.toLowerCase().trim();
  
  if (
    lower.includes("sinhala") || 
    lower.includes("shinhala") || 
    lower.includes("singhala") || 
    lower.includes("sin") || 
    lower.includes("shin")
  ) {
    return "Sinhala";
  }
  
  if (lower.includes("tamil") || lower.includes("tam")) {
    return "Tamil";
  }
  
  if (lower.includes("english") || lower.includes("eng")) {
    return "English";
  }
  
  return undefined;
}
