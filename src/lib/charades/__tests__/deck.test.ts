import assert from "node:assert/strict";
import test from "node:test";
import { inflateSync } from "node:zlib";
import {
  buildDeck,
  decodePayload,
  deckFileName,
  encodeDeck,
  extractJson,
  parseLoose,
  splitForQr,
} from "../deck.ts";

const seeded = () => {
  let n = 0;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
};

const cards = Array.from({ length: 12 }, (_, i) => `Card ${i + 1}`);

test("a bare list of strings becomes a playable deck", () => {
  const result = buildDeck({ name: "Disneyland", emoji: "🎢", color: "teal", cards }, { random: seeded() });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.deck.cards.length, 12);
  assert.equal(result.deck.accentColor, "#00C2B2");
  assert.equal(result.deck.emoji, "🎢");
  assert.match(result.deck.id, /^dck_[0-9a-f]{8}$/);
  for (const card of result.deck.cards) assert.match(card.id, /^crd_[0-9a-f]{8}$/);
  assert.equal(new Set(result.deck.cards.map((c) => c.id)).size, 12);
});

test("banned words and hints are accepted under their friendly names", () => {
  const result = buildDeck({
    name: "Rides",
    cards: [{ text: "Space Mountain", banned: ["dark", "Dark", "coaster", "space", "rocket", "stars", "fast"], hint: "Tomorrowland" }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const [card] = result.deck.cards;
  assert.deepEqual(card.taboo, ["dark", "coaster", "space", "rocket", "stars"]);
  assert.equal(card.note, "Tomorrowland");
  assert.ok(result.warnings.some((w) => w.message.includes("needs 10")));
});

test("duplicates are dropped and a missing card list is an error", () => {
  const dupes = buildDeck({ name: "x", cards: ["A", "a", "B"] });
  assert.equal(dupes.ok && dupes.deck.cards.length, 2);
  assert.equal(buildDeck({ name: "x" }).ok, false);
  assert.equal(buildDeck({ name: "x".repeat(61), cards }).ok, false);
});

test("JSON is found inside a chat reply with a code fence", () => {
  const reply = 'Here you go!\n```json\n{"name":"Snacks","cards":["Takis"]}\n```\nEnjoy.';
  assert.deepEqual(extractJson(reply), { name: "Snacks", cards: ["Takis"] });
  assert.throws(() => extractJson("no deck here"));
});

test("payloads are zlib + base64url, the way the app reads them", async () => {
  const result = buildDeck({ name: "Round trip ✨", cards }, { random: seeded() });
  assert.ok(result.ok);
  if (!result.ok) return;
  const payload = await encodeDeck(result.deck);
  assert.match(payload, /^D1\.[A-Za-z0-9_-]+$/);

  // Decoded the way pako would: base64url back to bytes, then zlib inflate.
  const b64 = payload.slice(3).replace(/-/g, "+").replace(/_/g, "/");
  const json = inflateSync(Buffer.from(b64, "base64")).toString("utf8");
  assert.deepEqual(JSON.parse(json), result.deck);

  assert.deepEqual(await decodePayload(`charades://deck?d=${payload}`), result.deck);
});

test("big payloads split into tagged pieces that rejoin", () => {
  const payload = "D1." + "x".repeat(5000);
  const parts = splitForQr(payload);
  assert.ok(parts.length > 1);
  assert.ok(parts.every((p) => p.length <= 1200 && p.startsWith("DQ1.")));
  const joined = parts.map((p) => p.split(".").slice(4).join(".")).join("");
  assert.equal(joined, payload);
});

test("file names are safe", () => {
  assert.equal(deckFileName({ name: "A/B: C?" }), "AB C.charades");
  assert.equal(deckFileName({ name: "///" }), "deck.charades");
});

test("a plain list, one card per line, is a deck", () => {
  assert.deepEqual(parseLoose("- Churro\n2. Mouse ears\n\nFireworks"), { cards: ["Churro", "Mouse ears", "Fireworks"] });
  assert.throws(() => parseLoose("{ broken"));
});
