import fs from 'fs';

const content = fs.readFileSync('src/views/AdminDashboard.tsx', 'utf8');

let divOpen = 0;
let divClose = 0;

const lines = content.split('\n');
lines.forEach((line, i) => {
  const openCount = (line.match(/<div/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  divOpen += openCount;
  divClose += closeCount;
  
  if (line.includes('const render') || line.includes('return (') || line.includes('return (')) {
     console.log(`${i+1}: Diff=${divOpen - divClose} | ${line.trim()}`);
  }
});

console.log(`Final Diff: ${divOpen - divClose}`);
