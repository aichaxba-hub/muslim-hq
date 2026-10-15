// Staple prices used by the Zakat al-Fitr calculator.
// Researched from published government and market data — refresh once a year, just before Ramadan.
// U.S. Bureau of Labor Statistics CPI average prices are quoted per pound (453.6 g),
// so convert to per-kilogram by dividing by 0.45359237.

export const FITR_PRICE_AS_OF = "September 2026";

export const FITR_PRICE_SOURCE =
  "U.S. Bureau of Labor Statistics CPI average prices (Sep 2026); barley from typical U.S. store-brand retail.";

// Per kilogram, in US dollars.
export const FITR_PRICES: Record<string, number> = {
  "Wheat flour": 1.2, // $0.545/lb white all-purpose flour (BLS APU0000701111) ÷ 0.4536
  "Black beans": 3.68, // $1.669/lb dried beans, any type (BLS APU0000714233) ÷ 0.4536
  Barley: 5.05, // ~$2.29/lb pearled barley, typical store brand ÷ 0.4536
};
