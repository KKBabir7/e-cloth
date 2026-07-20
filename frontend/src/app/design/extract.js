const fs = require('fs');
const file = 'f:/ecommarce/frontend/src/app/design/page.js';
let content = fs.readFileSync(file, 'utf8');

const extract = (tagStart) => {
  const start = content.indexOf(tagStart);
  if (start === -1) return '';
  const end = content.indexOf('</Tab>', start);
  if (end === -1) return '';
  const innerStart = content.indexOf('>', start) + 1;
  return content.substring(innerStart, end).trim();
};

const textContent = extract('<Tab eventKey="text" title="Text">');
const imageContent = extract('<Tab eventKey="image" title="Image">');
const shapeContent = extract('<Tab eventKey="shape" title="Shape">');
const stickerContent = extract('<Tab eventKey="sticker" title="Sticker">');

if (!textContent || !imageContent || !shapeContent || !stickerContent) {
  console.error("Failed to extract one of the tabs!");
  process.exit(1);
}

const helperFunc = `
  const renderMobileDrawerContent = () => {
    switch(mobileActiveTab) {
      case 'text': return ( <div className="d-flex flex-column gap-2">${textContent}</div> );
      case 'upload': return ( <div className="d-flex flex-column gap-2">${imageContent}</div> );
      case 'shape': return ( <div className="d-flex flex-column gap-2">${shapeContent}</div> );
      case 'sticker': return ( <div className="d-flex flex-column gap-2">${stickerContent}</div> );
      default: return null;
    }
  };
`;

const insertPos = content.indexOf('if (isMounted && isMobileView) {');
if (insertPos === -1) {
  console.error("Failed to find insertion point");
  process.exit(1);
}

// Remove any existing renderMobileDrawerContent if we accidentally added it or a partial one exists
if (content.includes('const renderMobileDrawerContent = () => {')) {
   // Already injected? We'll just replace everything before isMounted && isMobileView
   console.log("Already exists, skipping or need manual cleanup");
} else {
  content = content.substring(0, insertPos) + helperFunc + '\n  ' + content.substring(insertPos);
  fs.writeFileSync(file, content);
  console.log('Successfully injected renderMobileDrawerContent!');
}
