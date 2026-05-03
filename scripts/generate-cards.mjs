import { randomBytes } from "crypto";

const [, , countArg = "10", tierArg = "1"] = process.argv;
const count = Number.parseInt(countArg, 10);
const tier = Number.parseInt(tierArg, 10);

if (!Number.isInteger(count) || count <= 0) {
  throw new Error("Usage: node scripts/generate-cards.mjs <count> <tier>");
}

if (![1, 2, 3].includes(tier)) {
  throw new Error("Tier must be 1, 2, or 3.");
}

const createCode = () => {
  const value = randomBytes(9).toString("hex").toUpperCase();

  return `SPELL-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
};

const codes = Array.from({ length: count }, createCode);
const values = codes.map((code) => `  ('${code}', ${tier})`).join(",\n");

console.log(`insert into public.cards (code, tier)\nvalues\n${values}\non conflict (code) do nothing;`);
