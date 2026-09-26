/**
 * ML-assisted expense category classifier.
 *
 * Two-layer approach:
 *  1. Keyword rules (fast, high precision for common merchants)
 *  2. User history model: for each category the user has used, compute
 *     word-overlap similarity between the new description and past expense notes.
 *     Returns the top match with a confidence score.
 *
 * Falls back to null when confidence < THRESHOLD.
 */

const Expense = require("../models/Expense");

const THRESHOLD = 0.35;

// Layer 1 - keyword rules (UK-focused merchants + generic terms)
const KEYWORD_RULES = [
  {
    category: "Food & Drink",
    terms: [
      "tesco",
      "sainsbury",
      "asda",
      "waitrose",
      "morrisons",
      "lidl",
      "aldi",
      "co-op",
      "coop",
      "marks spencer",
      "m&s",
      "food",
      "grocery",
      "supermarket",
      "restaurant",
      "cafe",
      "coffee",
      "starbucks",
      "costa",
      "mcdonalds",
      "kfc",
      "subway",
      "pizza",
      "uber eats",
      "deliveroo",
      "just eat",
      "takeaway",
      "pub",
      "bar",
      "burger",
      "lunch",
      "dinner",
      "breakfast",
    ],
  },
  {
    category: "Transport",
    terms: [
      "tfl",
      "oyster",
      "tube",
      "bus",
      "train",
      "rail",
      "uber",
      "bolt",
      "taxi",
      "petrol",
      "fuel",
      "bp",
      "shell",
      "esso",
      "parking",
      "national rail",
      "gwr",
      "avanti",
      "southern rail",
      "thameslink",
    ],
  },
  {
    category: "Housing",
    terms: [
      "rent",
      "mortgage",
      "landlord",
      "estate agent",
      "letting",
      "council tax",
      "utility",
      "utilities",
      "gas",
      "electricity",
      "water",
      "broadband",
      "wifi",
      "internet",
      "bt internet",
      "virgin media",
      "sky broadband",
    ],
  },
  {
    category: "Entertainment",
    terms: [
      "netflix",
      "spotify",
      "disney",
      "amazon prime",
      "cinema",
      "vue",
      "odeon",
      "cineworld",
      "theatre",
      "concert",
      "ticketmaster",
      "eventbrite",
      "steam",
      "playstation",
      "xbox",
      "game",
      "apple tv",
      "youtube premium",
    ],
  },
  {
    category: "Shopping",
    terms: [
      "amazon",
      "ebay",
      "asos",
      "primark",
      "h&m",
      "zara",
      "next",
      "topshop",
      "john lewis",
      "boots",
      "superdrug",
      "clothing",
      "shoes",
      "fashion",
      "clothes",
      "delivery",
    ],
  },
  {
    category: "Health",
    terms: [
      "gym",
      "pharmacy",
      "dentist",
      "doctor",
      "nhs",
      "prescription",
      "optician",
      "health",
      "medical",
      "physio",
      "yoga",
      "fitness",
      "anytime fitness",
      "pure gym",
      "david lloyd",
    ],
  },
  {
    category: "Education",
    terms: [
      "udemy",
      "coursera",
      "skillshare",
      "pluralsight",
      "book",
      "kindle",
      "course",
      "tuition",
      "university",
      "college",
      "student",
    ],
  },
  {
    category: "Savings",
    terms: ["savings", "transfer to savings", "isa", "investment", "vanguard", "monzo pot", "moneybox"],
  },
  {
    category: "Subscriptions",
    terms: [
      "subscription",
      "monthly fee",
      "annual fee",
      "membership",
      "premium",
      "pro plan",
      "apple",
      "google one",
      "icloud",
      "microsoft 365",
    ],
  },
];

function tokenise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function keywordMatch(description) {
  const tokens = new Set(tokenise(description));
  let best = null;
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let hits = 0;
    for (const term of rule.terms) {
      const termTokens = term.split(/\s+/);
      if (termTokens.length === 1) {
        if (tokens.has(term)) hits += 2;
      } else {
        // Multi-word phrase: check substring
        if (description.toLowerCase().includes(term)) hits += 3;
      }
    }
    if (hits > bestScore) {
      bestScore = hits;
      best = rule.category;
    }
  }

  return bestScore >= 2
    ? { category: best, confidence: Math.min(0.95, 0.5 + bestScore * 0.05), method: "keyword" }
    : null;
}

function cosineSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  if (intersection === 0) return 0;
  return intersection / Math.sqrt(setA.size * setB.size);
}

async function historyMatch(userId, description) {
  const expenses = await Expense.find({ userId, note: { $exists: true, $ne: "" } })
    .select("category note")
    .limit(300)
    .lean();

  if (expenses.length === 0) return null;

  const descTokens = tokenise(description);
  if (descTokens.length === 0) return null;

  // Group notes by category
  const byCategory = {};
  expenses.forEach((e) => {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(tokenise(e.note));
  });

  let bestCat = null;
  let bestScore = 0;
  for (const [cat, noteTokensList] of Object.entries(byCategory)) {
    const avgSim = noteTokensList.reduce((s, t) => s + cosineSimilarity(descTokens, t), 0) / noteTokensList.length;
    if (avgSim > bestScore) {
      bestScore = avgSim;
      bestCat = cat;
    }
  }

  return bestScore >= THRESHOLD
    ? { category: bestCat, confidence: Math.round(bestScore * 100) / 100, method: "history" }
    : null;
}

/**
 * Classify a description string into a spend category.
 * Returns { category, confidence, method } or null if below threshold.
 */
async function classify(userId, description) {
  const keyResult = keywordMatch(description);
  if (keyResult && keyResult.confidence >= 0.7) return keyResult;

  const histResult = await historyMatch(userId, description);
  if (histResult) return histResult;

  return keyResult; // may be null if no match
}

module.exports = { classify };
