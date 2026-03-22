const fs = require('fs');
const path = require('path');

function searchFiles(dir, regexes, ext = '.tsx') {
    const files = fs.readdirSync(dir);
    let results = [];
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            results = results.concat(searchFiles(filepath, regexes, ext));
        } else if (filepath.endsWith(ext)) {
            const content = fs.readFileSync(filepath, 'utf8');
            let match = true;
            for (const r of regexes) {
                if (!r.test(content)) {
                    match = false;
                    break;
                }
            }
            if (match) results.push(filepath);
        }
    }
    return results;
}

const warriorTagRegexes = [
    /className="flex items-center gap-1\.5"/,
    /WarriorLink|Link/,
    /Trophy|Crown/
];
const statBadgeRegexes = [
    /Badge|STYLE_ABBREV/,
    /career|wins|losses/
];

console.log("Potential WarriorNameTag usages:");
console.log(searchFiles('./src', warriorTagRegexes));
console.log("\nPotential StatBadge usages:");
console.log(searchFiles('./src', statBadgeRegexes));
