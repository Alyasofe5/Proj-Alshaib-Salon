const fs = require('fs');
const content = fs.readFileSync('frontend/app/book/[[...slug]]/BookingClient.tsx', 'utf8');

const mapStart = content.indexOf('const AUTO_TRANSLATE_MAP');
const mapEnd = content.indexOf('};', mapStart);
const mapText = content.substring(mapStart, mapEnd + 2);

const keyRegex = /\"(.*?)\":/g;
const keys = [];
let match;
while ((match = keyRegex.exec(mapText)) !== null) {
    keys.push(match[1]);
}

const seen = new Set();
const dups = [];
keys.forEach(k => {
    if (seen.has(k)) {
        console.log('Duplicate:', k);
        dups.push(k);
    }
    seen.add(k);
});
