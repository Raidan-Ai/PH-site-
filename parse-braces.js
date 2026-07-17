import fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');

let braceCount = 0;
let lineNum = 1;
const stack = [];

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '\n') {
    lineNum++;
  }
  
  // Skip strings
  if (char === "'" || char === '"' || char === '`') {
    const quote = char;
    i++;
    while (i < content.length && content[i] !== quote) {
      if (content[i] === '\\') i++;
      if (content[i] === '\n') lineNum++;
      i++;
    }
    continue;
  }
  
  // Skip single line comments
  if (char === '/' && content[i+1] === '/') {
    i += 2;
    while (i < content.length && content[i] !== '\n') {
      i++;
    }
    lineNum++;
    continue;
  }
  
  // Skip block comments
  if (char === '/' && content[i+1] === '*') {
    i += 2;
    while (i < content.length && !(content[i] === '*' && content[i+1] === '/')) {
      if (content[i] === '\n') lineNum++;
      i++;
    }
    i++;
    continue;
  }

  if (char === '{') {
    stack.push({ line: lineNum, index: i });
  } else if (char === '}') {
    if (stack.length === 0) {
      console.log(`Extra closing brace } at line ${lineNum}`);
    } else {
      stack.pop();
    }
  }
}

console.log(`Finished checking. Remaining unclosed braces in stack: ${stack.length}`);
for (const unclosed of stack) {
  console.log(`Unclosed { at line ${unclosed.line}`);
}
