import fs from 'fs';

const content = fs.readFileSync('src/views/AdminDashboard.tsx', 'utf8');

let diff = 0;

const lines = content.split('\n');
lines.forEach((line, i) => {
  const openCount = (line.match(/<div/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  
  if (openCount !== 0 || closeCount !== 0) {
    diff += (openCount - closeCount);
    console.log(`${i+1}: [${diff}] ${line.trim()}`);
  }
});

console.log(`Final Diff: ${diff}`);
