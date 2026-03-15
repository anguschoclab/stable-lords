const fs = require('fs');
const file = 'src/pages/TrainingPlanner.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{burns\.filter\(b => b\.severity !== "low"\)\.map\(\(b, i\) => \([\s\S]*?\)\)\}/;
const match = content.match(regex);
console.log(match ? "Found!" : "Not found");

const replace = `{burns.reduce((acc, b, i) => {
              if (b.severity !== "low") {
                acc.push(
                  <div key={i} className={\`flex items-center gap-2 text-[10px] \${
                    b.severity === "high" ? "text-destructive" : "text-amber-500"
                  }\`}>
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span className="font-medium">{ATTRIBUTE_LABELS[b.attribute]}:</span>
                    <span>{b.reason}</span>
                  </div>
                );
              }
              return acc;
            }, [] as React.ReactNode[])}`;

if (match) {
  content = content.replace(regex, replace);
  fs.writeFileSync(file, content);
}
