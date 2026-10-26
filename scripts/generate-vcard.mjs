import { readFile, writeFile } from "node:fs/promises";

const photoPath = new URL("../docs/assets/motokuni-takaoka.jpg", import.meta.url);
const outputPath = new URL("../docs/assets/Motokuni-Takaoka.vcf", import.meta.url);
const photo = await readFile(photoPath);

function foldBase64(prefix, encoded) {
  const firstLength = 75 - Buffer.byteLength(prefix, "utf8");
  const lines = [prefix + encoded.slice(0, firstLength)];
  for (let index = firstLength; index < encoded.length; index += 74) {
    lines.push(` ${encoded.slice(index, index + 74)}`);
  }
  return lines;
}

function foldText(line) {
  if (Buffer.byteLength(line, "utf8") <= 75) return [line];
  const lines = [line.slice(0, 75)];
  for (let index = 75; index < line.length; index += 74) lines.push(` ${line.slice(index, index + 74)}`);
  return lines;
}

const textLines = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "PRODID:-//airweave inc.//Digital Business Card 2.0//EN",
  "N:Takaoka;Motokuni;;;",
  "FN:Motokuni Takaoka",
  "ORG:airweave inc.",
  "TITLE:Chairman of the Board\\; President and Chief Executive Officer",
  "TEL;TYPE=CELL:+81-90-3386-0705",
  "TEL;TYPE=WORK,VOICE:+81-3-6214-2472",
  "EMAIL;TYPE=INTERNET,WORK:motokuni_takaoka@airweave.jp",
  "URL;TYPE=WORK:https://airweave.com/",
  "ADR;TYPE=WORK:;;8F Shin-Otemachi Building\\, 2-2-1 Otemachi;Chiyoda-ku;Tokyo;100-0004;Japan",
];

const lines = [
  ...textLines.flatMap(foldText),
  ...foldBase64("PHOTO;ENCODING=b;TYPE=JPEG:", photo.toString("base64")),
  "END:VCARD",
  "",
];

await writeFile(outputPath, lines.join("\r\n"), "utf8");
console.log(`Generated vCard with an embedded ${photo.length}-byte JPEG.`);
