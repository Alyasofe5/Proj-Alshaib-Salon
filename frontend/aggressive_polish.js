const fs = require('fs');
const path = require('path');

const MAPPINGS = [
    // Colors
    { from: /#FCFAF1/gi, to: 'var(--color-text-primary)' },
    { from: /#DACDBD/gi, to: 'var(--color-text-secondary)' },
    { from: /#8A8A8A/gi, to: 'var(--color-text-muted)' },
    { from: /#5A5A5A/gi, to: 'var(--color-text-muted)' },
    { from: /#1A1A1A/gi, to: 'var(--color-background)' },
    { from: /#2D2D2D/gi, to: 'var(--color-cards)' },
    { from: /#111113/gi, to: 'var(--color-background)' },
    { from: /#141416/gi, to: 'var(--color-cards)' },
    { from: /#4A4535/gi, to: 'var(--border-subtle)' },
    { from: /#CACACA/gi, to: 'var(--color-text-secondary)' },
    { from: /#888/g, to: 'var(--color-text-muted)' },
    
    // Accents
    { from: /#C3D809/gi, to: '#C3D809' }, // ensure it's exactly this lime
    { from: /#D4EC0A/gi, to: '#D4EC0A' }, // hover lime
    { from: /#4CAF50/gi, to: '#C3D809' }, // replace standard green with lime for brand consistency? No, keep status.
    
    // Transitions
    { from: /rgba\(195,216,9,0.12\)/g, to: 'var(--border-subtle)' },
    { from: /rgba\(195,216,9,0.15\)/g, to: 'var(--border-subtle)' },
    { from: /rgba\(195,216,9,0.2\)/g, to: 'rgba(195,216,9,0.15)' },
];

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        MAPPINGS.forEach(m => {
            if (m.from.test(content)) {
                content = content.replace(m.from, m.to);
                changed = true;
            }
        });
        
        // Specifc fix for StatCard 'gold' prop usage
        if (content.includes('color="gold"')) {
            content = content.replace(/color="gold"/g, 'color="lime"');
            changed = true;
        }
        
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Aggressive Update: ${filePath}`);
        }
    } catch (e) {}
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                walk(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            processFile(fullPath);
        }
    });
}

console.log("Starting AGGRESSIVE ADMIN polisher...");
walk('.');
console.log("Polish complete.");
