import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src/i18n/locales');
const files = fs.readdirSync(localesDir);

for (const file of files) {
  if (file.endsWith('.json')) {
    const filePath = path.join(localesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    data.prompts.judge = data.prompts.judge.replace(
      /"understanding": <int> }/g,
      '"understanding": <int>, "justification": "<a short 1-sentence justification>" }'
    );
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

console.log('Update complete.');
