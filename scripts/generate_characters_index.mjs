import fs from 'fs';
import path from 'path';

const charactersDir = path.resolve('personnages');
const outputFile = path.resolve('data/index_min/fr/characters.json');

const entries = fs.readdirSync(charactersDir, { withFileTypes: true }).filter(d => d.isDirectory());
const list = entries.map(dir => {
  const slug = dir.name;
  const image = `assets/${slug}.webp`;
  return { slug, name: slug, image };
});
fs.writeFileSync(outputFile, JSON.stringify(list, null, 2));
console.log(`Index mis à jour avec ${list.length} personnages.`);