const fs = require('fs');

const extractVocab = (filePath, category) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());
  
  const vocab = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match word and pronunciation like "abandon /əˈbændən/ (v.)" or "book /bʊk/"
    const match = line.match(/^([a-zA-Z-]+)\s+\/(.+?)\/(?:\s*\((.+?)\))?/);
    
    if (match) {
      if (i + 2 < lines.length) {
        const word = match[1];
        const phonetic = match[2];
        const pos = match[3] || '';
        const translation = lines[i + 1];
        const sentenceLine = lines[i + 2];
        
        let sentenceEng = sentenceLine;
        let sentenceChi = '';
        
        // Extract chinese part in parentheses
        // Handle both full-width （） and half-width () parentheses
        const sentenceMatch = sentenceLine.match(/(.+?)[(（](.+?)[)）]/);
        if (sentenceMatch) {
          sentenceEng = sentenceMatch[1].trim();
          sentenceChi = sentenceMatch[2].trim();
        }

        vocab.push({
          word,
          phonetic,
          pos,
          translation,
          sentenceEng,
          sentenceChi,
          category
        });
        i += 2; // skip the next two lines since we consumed them
      }
    }
  }
  
  return vocab;
};

// Ensure path to the files
const file7000 = 'C:/Users/09087.noel.huang/.gemini/antigravity/brain/73844901-2772-488c-99f6-6c6f25915dfe/.system_generated/steps/5/content.md';
const file1000 = 'C:/Users/09087.noel.huang/.gemini/antigravity/brain/73844901-2772-488c-99f6-6c6f25915dfe/.system_generated/steps/6/content.md';

const vocab7000 = fs.existsSync(file7000) ? extractVocab(file7000, 'intermediate') : [];
const vocab1000 = fs.existsSync(file1000) ? extractVocab(file1000, 'basic') : [];

// Remove duplicates if any
const allVocabs = [...vocab1000, ...vocab7000];
const uniqueVocabs = [];
const seen = new Set();
for (const v of allVocabs) {
  if (!seen.has(v.word.toLowerCase())) {
    seen.add(v.word.toLowerCase());
    uniqueVocabs.push(v);
  }
}

const outDir = 'src/data';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(`${outDir}/vocab.json`, JSON.stringify(uniqueVocabs, null, 2));

console.log(`Extracted ${vocab1000.length} basic and ${vocab7000.length} intermediate words.`);
console.log(`Saved ${uniqueVocabs.length} unique words to ${outDir}/vocab.json`);
