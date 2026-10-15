import { readFile, writeFile } from 'node:fs/promises'

const names = ['luna', 'milo', 'rocky', 'nala']
const photos = {}
for (const [index, name] of names.entries()) {
  const data = await readFile(
    new URL(`../src/infrastructure/pets/photos/${name}.jpg`, import.meta.url),
  )
  if (data[0] !== 0xff || data[1] !== 0xd8 || data.length > 150000)
    throw new Error(`Fotografía JPEG inválida o demasiado grande: ${name}`)
  photos[`pet-${index + 1}`] =
    `data:image/jpeg;base64,${data.toString('base64')}`
}
await writeFile(
  new URL('../src/infrastructure/pets/demoPetPhotos.ts', import.meta.url),
  `// Generado con scripts/generate-pet-photos.mjs. Fuentes y licencia: docs/fotografias.md\nexport const demoPetPhotos: Readonly<Record<string, string>> = ${JSON.stringify(photos, null, 2)}\n`,
)
