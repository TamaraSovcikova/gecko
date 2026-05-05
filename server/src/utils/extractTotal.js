function extractTotalFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');

  // Look for a line containing a total keyword and a price
  const totalKeywords = /total|amount due|balance due|to pay|grand total|subtotal/i;
  const pricePattern = /(?:GBP|£|\$|€)?\s?(\d+[.,]\d{2})/;

  for (const line of lines) {
    if (totalKeywords.test(line)) {
      const match = line.match(pricePattern);
      if (match) {
        return Number(match[1].replace(',', '.'));
      }
    }
  }

  // Fallback: find all prices and return the largest that looks like a total
  const allPrices = [];
  for (const line of lines) {
    const match = line.match(pricePattern);
    if (match) {
      const value = Number(match[1].replace(',', '.'));
      if (!isNaN(value) && value > 0 && value < 10000) {
        allPrices.push(value);
      }
    }
  }

  if (allPrices.length === 0) return null;
  return Math.max(...allPrices);
}

module.exports = extractTotalFromText;
