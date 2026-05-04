import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const files = fs.readdirSync(localesDir);

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(localesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const target = `"understanding": <int> }`;
    const replacement = `"understanding": <int>, "justification": "<a short 1-sentence justification for these scores>" }`;
    
    content = content.replaceAll(target, replacement);
    fs.writeFileSync(filePath, content);
  }
}

console.log('Update complete.');
