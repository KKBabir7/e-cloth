const fs = require('fs');
const file = 'f:/ecommarce/frontend/src/app/design/page.js';
let content = fs.readFileSync(file, 'utf8');

const extractTab = (eventKey, funcName) => {
  const startStr = '<Tab eventKey="' + eventKey + '"';
  const startIdx = content.indexOf(startStr);
  if (startIdx === -1) return null;
  const contentStartIdx = content.indexOf('>', startIdx) + 1;
  
  let endIdx = contentStartIdx;
  let depth = 1;
  while(endIdx < content.length && depth > 0) {
     const nextTabStart = content.indexOf('<Tab ', endIdx);
     const nextTabEnd = content.indexOf('</Tab>', endIdx);
     if (nextTabEnd === -1) break;
     
     if (nextTabStart !== -1 && nextTabStart < nextTabEnd) {
         depth++;
         endIdx = nextTabStart + 4;
     } else {
         depth--;
         if (depth === 0) {
             endIdx = nextTabEnd;
             break;
         }
         endIdx = nextTabEnd + 6;
     }
  }
  
  const innerContent = content.substring(contentStartIdx, endIdx);
  return { startIdx, endIdx: endIdx + 6, innerContent, funcName };
};

const tabs = [
  extractTab('text', 'TextTabContent'),
  extractTab('image', 'ImageTabContent'),
  extractTab('shape', 'ShapeTabContent'),
  extractTab('sticker', 'StickerTabContent')
];

let functionsStr = '\n\n';
for(const tab of tabs) {
  if (!tab) continue;
  functionsStr += '  const ' + tab.funcName + ' = () => (\n    <>\n      ' + tab.innerContent + '\n    </>\n  );\n\n';
}

fs.writeFileSync('f:/ecommarce/frontend/src/app/design/functions.txt', functionsStr);
console.log('Saved to functions.txt, length:', functionsStr.length);
