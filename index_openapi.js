const fs = require('fs');
const path = require('path');

const docsDir = './openApi/docs/';
const outputFile = './openapi/index.yaml';

const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.yaml'));

let combinedDocs = '';

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  combinedDocs += fileContent + '\n';
});

fs.writeFileSync(outputFile, combinedDocs);
console.log(`Files combined into ${outputFile}`);