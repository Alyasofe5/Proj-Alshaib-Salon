const fs = require('fs');
const filePath = 'frontend/app/book/[[...slug]]/BookingClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace salon title
content = content.replace(/\{salon\.name\}/g, "{tData(salon.name, lang)}");
content = content.replace(/salon\.name \|\| "\u0627\u0644\u0634\u0627\u064a\u0628"/g, "tData(salon.name || '\u0627\u0644\u0634\u0627\u064a\u0628', lang)");

// Main description replacement
content = content.replace(/(?<=<p[^>]+max-w-\[280px\][^>]+>[\s\S]*?\{lang === 'ar' \? \()salon\.secondary_description\s*&&\s*!.*?(?=\) \:)/g, "tData(salon.secondary_description || salon.description, lang)");

// Employee roles and names
content = content.replace(/\{emp\.name\}/g, "{tData(emp.name, lang)}");
content = content.replace(/emp\.role \|\| "\u062e\u0628\u064a\u0631 \u0645\u0638\u0647\u0631"/g, "tData(emp.role || '\u062e\u0628\u064a\u0631 \u0645\u0638\u0647\u0631', lang)");

// Categories names
content = content.replace(/\{cat\.name\}/g, "{tData(cat.name, lang)}");

// Services titles and descriptions
content = content.replace(/\{srv\.title\}/g, "{tData(srv.title, lang)}");
content = content.replace(/\{srv\.description\}/g, "{tData(srv.description, lang)}");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Auto-translation applied to dynamic JS templates!');
