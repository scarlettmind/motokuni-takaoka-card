import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const cardPath = new URL("../docs/assets/Motokuni-Takaoka.vcf", import.meta.url);
const photoPath = new URL("../docs/assets/motokuni-takaoka.jpg", import.meta.url);
const cardBuffer = await readFile(cardPath);
const sourcePhoto = await readFile(photoPath);
const card = cardBuffer.toString("utf8");

assert(card.includes("\r\n"), "vCard must use CRLF line endings");
assert(!/(?<!\r)\n/.test(card), "vCard must not contain bare LF line endings");

const lines = card.split("\r\n");
for (const [index, line] of lines.entries()) {
  assert(Buffer.byteLength(line, "utf8") <= 75, `line ${index + 1} exceeds 75 bytes`);
}

for (const expected of [
  "VERSION:3.0",
  "FN:Motokuni Takaoka",
  "N:Takaoka;Motokuni;;;",
  "ORG:airweave inc.",
  "TEL;TYPE=CELL:+81-90-3386-0705",
  "TEL;TYPE=WORK,VOICE:+81-3-6214-2472",
  "EMAIL;TYPE=INTERNET,WORK:motokuni_takaoka@airweave.jp",
]) {
  assert(lines.includes(expected), `missing required field: ${expected}`);
}

const photoIndex = lines.findIndex((line) => line.startsWith("PHOTO;ENCODING=b;TYPE=JPEG:"));
assert(photoIndex >= 0, "embedded JPEG photo is missing");

let encodedPhoto = lines[photoIndex].slice(lines[photoIndex].indexOf(":") + 1);
for (let index = photoIndex + 1; index < lines.length && lines[index].startsWith(" "); index += 1) {
  encodedPhoto += lines[index].slice(1);
}

const decodedPhoto = Buffer.from(encodedPhoto, "base64");
assert.equal(decodedPhoto[0], 0xff, "photo is not a JPEG");
assert.equal(decodedPhoto[1], 0xd8, "photo is not a JPEG");
assert.equal(decodedPhoto[decodedPhoto.length - 2], 0xff, "photo JPEG is truncated");
assert.equal(decodedPhoto[decodedPhoto.length - 1], 0xd9, "photo JPEG is truncated");

const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
assert.equal(digest(decodedPhoto), digest(sourcePhoto), "embedded photo differs from the source JPEG");

console.log(`Validated vCard with ${decodedPhoto.length} photo bytes and ${lines.length} folded lines.`);
