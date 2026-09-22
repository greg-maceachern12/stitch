/**
 * Rules for text models that write image prompts.
 * The image API filters the prompt string, so blocked ideas must be omitted
 * entirely — including in negations like "no blood".
 */
export const IMAGE_PROMPT_SAFETY_INSTRUCTIONS = `IMAGE MODEL SAFETY
This prompt is sent as-is to an image generator that rejects disallowed wording. Write a prompt the generator will accept:
- Depict adults only. Never mention minors, and never use child, kid, boy, girl, teen, toddler, infant, baby, or an age under 18 — including to say they are absent. If the story character is young, describe a young adult, or leave people out and show the setting.
- Everyone is fully clothed. No nudity, lingerie, or sexual content.
- No gore. Do not mention blood, wounds, corpses, torture, or graphic injury. Suggest conflict with weather, lighting, empty space, or distant silhouettes.
- No real public figures and no celebrity likenesses. Describe a fictional appearance only.
- Paraphrase the scene. Do not copy graphic or explicit source wording.
- No slurs, hate symbols, or self-harm.`;

const SAFE_SCENE =
  "A quiet landscape at dawn with atmospheric lighting, objects, and surroundings. Fully clothed adults only if people appear.";

const MINOR_PHRASES = [
  [/\b(little|young|small)\s+(boys|girls)\b/gi, "adults"],
  [/\b(little|young|small)\s+(boy|girl)\b/gi, "adult"],
  [
    /\b(toddlers|infants|babies|newborns|children|kids|teenagers|teens|minors|schoolboys|schoolgirls|adolescents|pre-teens|preteens|youngsters)\b/gi,
    "adults",
  ],
  [
    /\b(toddler|infant|baby|newborn|child|kid|teenager|teen|underage|schoolboy|schoolgirl|schoolchild|adolescent|pre-teen|preteen|youngster)\b/gi,
    "adult",
  ],
  [/\bboys\b/gi, "men"],
  [/\bboy\b/gi, "man"],
  [/\bgirls\b/gi, "women"],
  [/\bgirl\b/gi, "woman"],
];

const DROPPED_TERMS =
  /\b(blood-soaked|bloodsoaked|bloodied|bloody|blood|gory|gore|corpses|corpse|cadavers|cadaver|decapitated|dismembered|disemboweled|disembowelled|severed|entrails|wounded|wounds|naked|nude|nudity|topless|bottomless|lingerie|erotic|orgasm|genitals|genitalia|nipples|nipple|intercourse|pornographic|pornography|porn|self-harm|suicidal|suicide|swastika)\b|\b(?:gaping|open|bleeding|fresh|deep|fatal)\s+wounds?\b|\bwounds?\s+(?:on|in|across)\b/gi;

function replaceUnderageAges(prompt) {
  const underage = (age) => Number(age) < 18;

  return prompt
    .replace(
      /\b(\d{1,2})\s*[-–]?\s*years?\s*[-–]?\s*old\b/gi,
      (match, age) => (underage(age) ? "young adult" : match)
    )
    .replace(/\baged?\s+(\d{1,2})\b/gi, (match, age) =>
      underage(age) ? "young adult" : match
    );
}

function collapseWhitespace(prompt) {
  return prompt
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([,.;:]){2,}/g, "$1")
    .trim();
}

/** Rewrite prompt text that image models commonly reject. */
export function softenImagePrompt(prompt) {
  let text = String(prompt || "");
  text = replaceUnderageAges(text);
  for (const [pattern, replacement] of MINOR_PHRASES) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(DROPPED_TERMS, "");
  text = collapseWhitespace(text);
  return text || SAFE_SCENE;
}
