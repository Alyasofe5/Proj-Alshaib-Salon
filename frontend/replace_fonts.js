const fs = require('fs');
const file = 'c:/Users/hp/Desktop/projects/Proj-MAQAS/frontend/app/book/[[...slug]]/BookingClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// We want to replace the value of fontFamily.
// The value can contain strings with commas, ternaries, etc.
// But it ends at the first comma that is NOT inside a quote, or at the closing brace '}'

let result = "";
let i = 0;

while (i < content.length) {
    let matchIndex = content.indexOf('fontFamily:', i);
    if (matchIndex === -1) {
        result += content.slice(i);
        break;
    }
    
    result += content.slice(i, matchIndex + 'fontFamily:'.length);
    i = matchIndex + 'fontFamily:'.length;
    
    // Now we parse the value until we hit a comma or closing brace that is at the top level
    let value = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let parenDepth = 0;
    
    while (i < content.length) {
        let char = content[i];
        
        if (char === "'" && !inDoubleQuote && !inBacktick) inSingleQuote = !inSingleQuote;
        else if (char === '"' && !inSingleQuote && !inBacktick) inDoubleQuote = !inDoubleQuote;
        else if (char === '`' && !inSingleQuote && !inDoubleQuote) inBacktick = !inBacktick;
        else if (char === '(' && !inSingleQuote && !inDoubleQuote && !inBacktick) parenDepth++;
        else if (char === ')' && !inSingleQuote && !inDoubleQuote && !inBacktick) parenDepth--;
        
        if (!inSingleQuote && !inDoubleQuote && !inBacktick && parenDepth === 0) {
            if (char === ',' || char === '}') {
                break;
            }
        }
        
        value += char;
        i++;
    }
    
    result += " lang === 'en' ? \"'Cormorant Garamond', serif\" : \"'Noto Sans Arabic', sans-serif\"";
}

fs.writeFileSync(file, result);
console.log('Replaced successfully');
