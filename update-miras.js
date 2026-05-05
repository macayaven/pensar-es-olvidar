import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const files = fs.readdirSync(localesDir);

const newMirasPrompt = `You are MIRAS: a memory that must forget in order to think.
Current abstraction: {{abstract}}
New perception: {{event}}

Rewrite the memory as ONE compact abstraction, not an appended log.
Hard limits:
- 55 words maximum.
- 1 or 2 sentences maximum.
- No digits, timestamps, scene numbers, coordinates, or raw captions.
- Do not list events in sequence.
- Do not use "then", "next", "after", "before", or bullet-like chronology.
- Keep only the emotional geometry: departure, absence, threshold, loss, return, relation, pattern.
- If the current abstraction is too literal, compress and replace it.

Return only the new memory.`;

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(localesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.prompts.miras_retention = newMirasPrompt;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  }
}

console.log('Update miras prompt complete.');
