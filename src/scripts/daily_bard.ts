import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const NARRATIVE_FILE = path.join(process.cwd(), "src/data/narrativeContent.json");
const REPORT_FILE = path.join(process.cwd(), "Daily_Bard_Report.md");

const VALID_VARIABLES = ["%A", "%D", "%W", "%BP"];

/**
 * Strict Zod Schema for Narrative Templates.
 * Enforces allowed variables using .refine().
 */
const templateStringSchema = z.string().refine(
  (str) => {
    const foundVars = str.match(/%\w+/g) || [];
    return foundVars.every((v) => VALID_VARIABLES.includes(v));
  },
  { message: "String contains unauthorized % variables. Only %A, %D, %W, %BP are allowed." }
);

const CategorySchema = z.object({
  glancing: z.array(templateStringSchema),
  solid: z.array(templateStringSchema),
  mastery: z.array(templateStringSchema), // Flashy (Always for Favorite Weapon)
  critical_human: z.array(templateStringSchema), // Super Flashy (Low Skill)
  critical_supernatural: z.array(templateStringSchema), // Super Flashy (Legendary)
  fatal: z.array(templateStringSchema), // Killer (The blow itself)
});

const DefenseSchema = z.object({
  success: z.array(templateStringSchema),
  stumbling: z.array(templateStringSchema),
});

export const NarrativeSchema = z.object({
  strikes: z.record(z.string(), CategorySchema),
  defenses: z.record(z.string(), DefenseSchema),
  attacks: z.record(z.string(), z.array(templateStringSchema)),
  passives: z.record(z.string(), z.array(templateStringSchema)),
  conclusions: z.record(z.string(), z.array(templateStringSchema)),
  insights: z.record(z.string(), z.array(templateStringSchema)),
  promoters: z.record(z.string(), z.record(z.string(), z.array(templateStringSchema))), // promoter.[personality].pitch
  media: z.record(z.string(), z.array(templateStringSchema)), // media.[type]
  persona: z.record(z.string(), z.array(templateStringSchema)), // persona.[trait]
  recruitment: z.record(z.string(), z.array(templateStringSchema)), // recruitment.[origin/blurb]
  memorials: z.record(z.string(), z.array(templateStringSchema)), // memorials.[epigraph]
  fanfare: z.record(z.string(), z.array(templateStringSchema)), // fanfare.[victory]
  meta: z.record(z.string(), z.array(templateStringSchema)), // meta.[tooltip]
});

type ValidatedJSON = z.infer<typeof NarrativeSchema>;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock-key");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

/**
 * Traverses the JSON and identifies paths where variety is low.
 */
function fetch_narrative_deficits(data: ValidatedJSON): string[] {
  const deficits: string[] = [];

  for (const [type, severities] of Object.entries(data.strikes)) {
    for (const [sev, templates] of Object.entries(severities)) {
      if (templates.length < 15) { // Increased target variety
        deficits.push(`strikes.${type}.${sev}`);
      }
    }
  }

  for (const [type, outcomes] of Object.entries(data.defenses)) {
    for (const [outcome, templates] of Object.entries(outcomes)) {
      if (templates.length < 12) {
        deficits.push(`defenses.${type}.${outcome}`);
      }
    }
  }

  const extraCategories: (keyof ValidatedJSON)[] = [
    "attacks", "passives", "conclusions", "insights", "media", 
    "persona", "recruitment", "memorials", "fanfare", "meta"
  ];
  for (const cat of extraCategories) {
    if (typeof data[cat] !== 'object' || data[cat] === null) continue;
    for (const [subCat, templates] of Object.entries(data[cat])) {
      if (Array.isArray(templates)) {
        if (templates.length < 12) deficits.push(`${cat}.${subCat}`);
      } else if (typeof templates === 'object') {
        // Handle nested (e.g., promoters.[personality].pitch)
        for (const [key, tps] of Object.entries(templates)) {
           if (Array.isArray(tps) && tps.length < 12) deficits.push(`${cat}.${subCat}.${key}`);
        }
      }
    }
  }

  return deficits;
}

/**
 * Calls Gemini 1.5 Flash to generate new templates for a specific deficit path.
 */
async function request_bardic_inspiration(deficitPath: string, context: string = ""): Promise<string> {
  const [root, type, leaf] = deficitPath.split(".");

  const systemPrompt = `You are the Bard of the Blood Sands, a brutal arena announcer.
You generate high-fantasy combat and world descriptions for a text-based game.

STRICT RULE: You MUST ONLY use the following variables:
- %A: The Attacker / Active Subject
- %D: The Defender / Passive Subject
- %W: The Weapon / Tool / Entity
- %BP: The Body Part (e.g., "head", "left arm", "chest")
- %S: The Stable / Team Name

TIER DEFINITIONS:
- Standard (glancing/solid): Practical, gritty, and dirt-covered.
- Flashy (mastery): Masterful, fluid, and rehearsed. Effortless grace.
- Super Flashy - Human (critical_human): Explosive, cinematic impact. Peak physical feat.
- Super Flashy - Supernatural (critical_supernatural): Mythic, hyper-real effects (spectral light, blade-singing, reality-tearing).
- Killer (fatal): Final, visceral, and gruesome terminal strikes.

Format your response as a JSON object with a single key "new_templates" which is an array of 5 unique strings.
Context: You are writing for ${deficitPath}. ${context}`;

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "mock-key") {
    try {
      const result = await model.generateContent(`${systemPrompt}\n\nGenerate 3 new templates for ${deficitPath}.`);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error.message);
      return "{}";
    }
  } else {
    // Mock for local testing
    console.log(`[MOCK] Generating for ${deficitPath}`);
    return JSON.stringify({
      new_templates: [
        `%A drives their %W into %D's %BP with a sickening crunch. (Mock 1)`,
        `A spray of crimson follows as %A's %W bites deep into the %BP. (Mock 2)`,
        `%D gasps as %A's %W finds a gap, punishing the %BP. (Mock 3)`,
      ],
    });
  }
}

/**
 * The Agentic Loop: Validates LLM output and retries with errors if necessary.
 */
async function validate_with_retry(deficitPath: string, retries = 3): Promise<string[] | null> {
  let errorContext = "";
  for (let i = 0; i < retries; i++) {
    const rawResponse = await request_bardic_inspiration(deficitPath, errorContext);
    try {
      const parsed = JSON.parse(rawResponse);
      const templates = parsed.new_templates;
      if (!Array.isArray(templates)) throw new Error("Missing new_templates array");

      // Validate each template individually to pinpoint errors
      for (const t of templates) {
        templateStringSchema.parse(t);
      }

      return templates;
    } catch (err: any) {
      console.warn(`Validation failed for ${deficitPath} (Attempt ${i + 1}/${retries}): ${err.message}`);
      errorContext = `Your previous response failed validation: ${err.message}. Fix the variables and regenerate. Ensure you only use %A, %D, %W, %BP.`;
    }
  }
  return null;
}

/**
 * Atomic merge and write to the archive.
 */
async function commit_to_archive(newTemplatesMap: Record<string, string[]>) {
  const rawData = fs.readFileSync(NARRATIVE_FILE, "utf-8");
  const data: ValidatedJSON = JSON.parse(rawData);

  let report = "# Daily Bard Report\n\n";
  let addedCount = 0;

  for (const [path, items] of Object.entries(newTemplatesMap)) {
    const segments = path.split(".");
    let target: any = data;
    for (let i = 0; i < segments.length - 1; i++) {
      target = target[segments[i]];
    }
    const leaf = segments[segments.length - 1];
    
    // Merge and Deduplicate
    const uniqueTemplates = [...new Set([...target[leaf], ...items])];
    const newItemsCount = uniqueTemplates.length - target[leaf].length;
    
    target[leaf] = uniqueTemplates;
    
    report += `### Added to ${path} (${newItemsCount} new unique templates)\n`;
    items.forEach(it => report += `- ${it}\n`);
    addedCount += newItemsCount;
  }

  if (addedCount > 0) {
    fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(data, null, 2), "utf-8");
    fs.writeFileSync(REPORT_FILE, report, "utf-8");
    console.log(`Successfully added ${addedCount} new templates.`);
  } else {
    console.log("No new templates were added.");
  }
}

/**
 * Global deduplication sweep for the entire archive.
 */
function deduplicate_full_archive(data: ValidatedJSON) {
  for (const severities of Object.values(data.strikes)) {
    for (const sev of Object.keys(severities)) {
      (severities as any)[sev] = [...new Set((severities as any)[sev])];
    }
  }
  for (const outcomes of Object.values(data.defenses)) {
    for (const outcome of Object.keys(outcomes)) {
      (outcomes as any)[outcome] = [...new Set((outcomes as any)[outcome])];
    }
  }
  const extraCategories: (keyof ValidatedJSON)[] = [
    "attacks", "passives", "conclusions", "insights", "media", 
    "persona", "recruitment", "memorials", "fanfare", "meta", "promoters"
  ];
  for (const cat of extraCategories) {
    if (!data[cat]) continue;
    for (const subCat of Object.keys(data[cat])) {
      const val = (data[cat] as any)[subCat];
      if (Array.isArray(val)) {
        (data[cat] as any)[subCat] = [...new Set(val)];
      } else if (typeof val === 'object') {
        for (const leaf of Object.keys(val)) {
          if (Array.isArray(val[leaf])) {
            val[leaf] = [...new Set(val[leaf])];
          }
        }
      }
    }
  }
}

async function main() {
  console.log("📜 The Bard of the Blood Sands is waking up...");

  const rawData = fs.readFileSync(NARRATIVE_FILE, "utf-8");
  const data: ValidatedJSON = NarrativeSchema.parse(JSON.parse(rawData));

  // 1. Deficit Detection
  const deficits = fetch_narrative_deficits(data);
  console.log(`Found ${deficits.length} deficit paths.`);

  // 2. Generation Loop
  const newTemplatesMap: Record<string, string[]> = {};
  const targetDeficits = deficits.slice(0, 5);

  for (const path of targetDeficits) {
    console.log(`Processing: ${path}...`);
    const validated = await validate_with_retry(path);
    if (validated) {
      newTemplatesMap[path] = validated;
    }
  }

  // 3. Commit & Deduplicate
  await commit_to_archive(newTemplatesMap);
  
  // 4. Final Full-Sweep Cleanup (ensures even static/legacy duplicates are purged)
  const freshData = JSON.parse(fs.readFileSync(NARRATIVE_FILE, "utf-8"));
  deduplicate_full_archive(freshData);
  fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(freshData, null, 2), "utf-8");

  console.log("✅ Bardic duties complete.");
}

main().catch(console.error);
