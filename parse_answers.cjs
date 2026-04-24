const fs = require('fs');

const content = fs.readFileSync('src/data/AnswersBook_Content.txt', 'utf-8');
const lines = content.split('\n');

const answers = [];
let currentAnswer = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  if (line.startsWith('Page：')) {
    currentAnswer = {
      page: parseInt(line.replace('Page：', ''), 10),
      answer: '',
      explanation: ''
    };
    answers.push(currentAnswer);
  } else if (line.startsWith('答案：') && currentAnswer) {
    currentAnswer.answer = line.replace('答案：', '').trim();
  } else if (line.startsWith('解析：') && currentAnswer) {
    currentAnswer.explanation = line.replace('解析：', '').trim();
  } else if (currentAnswer) {
    // If explanation spans multiple lines
    currentAnswer.explanation += ' ' + line;
  }
}

fs.writeFileSync('src/data/answers.js', 'export const answersData = ' + JSON.stringify(answers, null, 2) + ';\n');
console.log('Successfully written ' + answers.length + ' answers to src/data/answers.js');
