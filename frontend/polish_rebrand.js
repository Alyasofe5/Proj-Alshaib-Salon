const fs = require('fs');
const path = require('path');

const MAPPINGS = [
    // Backgrounds & Surfaces
    { from: /#2D2D2D/gi, to: 'var(--color-cards)' },
    { from: /#1[aA]1[aA]1[aA]/g, to: 'var(--color-background)' },
    { from: /#[23][aA][23][aA][23][aA]/g, to: 'var(--color-surface)' }, // generic dark grays
    { from: /#101115/g, to: 'var(--color-background)' },
    { from: /#1C1D21/g, to: 'var(--color-cards)' },
    { from: /rgba\(45,45,45,.95\)/g, to: 'rgba(10,10,11,.92)' },
    
    // Text Colors
    { from: /#FCFAF1/gi, to: 'var(--color-text-primary)' },
    { from: /#DACDBD/gi, to: 'var(--color-text-secondary)' },
    { from: /#F[56]F[56]F[56]/gi, to: 'var(--color-text-primary)' }, // platinum/white variants
    
    // Borders
    { from: /rgba\(195,216,9,.12\)/g, to: 'var(--border-subtle)' },
    { from: /rgba\(195,216,9,.08\)/g, to: 'var(--border-subtle)' },
    
    // Brand Gradient Fix (if any leftover)
    { from: /#8A6026/gi, to: '#C3D809' },
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
        
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
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

console.log("Starting FINAL POLISH rebrand...");
walk('.');
console.log("Polish complete.");
