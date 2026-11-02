import Counter from "@/models/Counter";

/**
 * Extracts a 2-character role-specific prefix from a job/position title.
 */
export function getPrefix(jobTitle: string): string {
  const title = jobTitle.toLowerCase();
  if (title.includes("ml") || title.includes("machine learning")) {
    return "ML";
  }
  if (title.includes("software") || title.includes("se ") || title.includes("swe")) {
    return "SE";
  }
  if (title.includes("frontend") || title.includes("front-end")) {
    return "FE";
  }
  if (title.includes("backend") || title.includes("back-end")) {
    return "BE";
  }
  if (title.includes("fullstack") || title.includes("full-stack")) {
    return "FS";
  }
  if (title.includes("qa") || title.includes("quality")) {
    return "QA";
  }
  if (title.includes("data science") || title.includes("data scientist")) {
    return "DS";
  }
  if (title.includes("devops")) {
    return "DE";
  }
  if (title.includes("design") || title.includes("ui/ux") || title.includes("ui") || title.includes("ux")) {
    return "UI";
  }

  // Generic prefix extractor
  const ignoreWords = ["intern", "internship", "junior", "trainee", "associate", "role", "position"];
  const words = jobTitle
    .split(/[\s\-/]+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ""))
    .filter(w => w.length > 0 && !ignoreWords.includes(w.toLowerCase()));
    
  if (words.length > 0) {
    const prefix = words.map(w => w[0].toUpperCase()).join("");
    if (prefix.length >= 2) return prefix;
    if (words[0].length >= 2) return words[0].substring(0, 2).toUpperCase();
  }
  return "INT";
}

/**
 * Generates the next sequential ID for a given position atomically.
 */
export async function generateNextInternId(positionName: string): Promise<string> {
  const prefix = getPrefix(positionName);
  const counterKey = `intern_id_${prefix}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  const nextNum = counter.seq;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}
