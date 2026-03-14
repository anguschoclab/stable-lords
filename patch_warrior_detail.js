import fs from 'fs';

let content = fs.readFileSync('src/pages/WarriorDetail.tsx', 'utf-8');

// Update Hero section styling
content = content.replace(
  /<div className="absolute inset-0 bg-gradient-to-r from-arena-fame\/5 to-arena-gold\/5" \/>/g,
  '<div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5 glow-neon-blue rounded-xl" />'
);

// Add neon glowing text/badges
content = content.replace(/bg-arena-gold text-black/g, 'bg-primary text-black glow-neon-green');
content = content.replace(/text-arena-fame/g, 'text-primary glow-neon-green drop-shadow-md');
content = content.replace(/text-arena-pop/g, 'text-accent glow-neon-blue drop-shadow-md');
content = content.replace(/text-destructive/g, 'text-destructive glow-neon-red drop-shadow-md');

// Add glow classes to attributes and physicals
content = content.replace(/<Shield className="h-5 w-5 text-primary" \/>/g, '<Shield className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(20,255,100,0.8)]" />');
content = content.replace(/<Heart className="h-5 w-5 text-destructive" \/>/g, '<Heart className="h-5 w-5 text-destructive drop-shadow-[0_0_8px_rgba(255,50,50,0.8)]" />');

// Highlight high stats with neon glow
content = content.replace(
  /className="h-2"/g,
  'className="h-2 rounded-full overflow-hidden shadow-[0_0_5px_currentColor]"'
);

fs.writeFileSync('src/pages/WarriorDetail.tsx', content);
