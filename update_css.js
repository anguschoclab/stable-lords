import fs from 'fs';

const css = fs.readFileSync('src/index.css', 'utf-8');

let updatedCss = css.replace(/:root\s*{[\s\S]*?}/, `:root {
    --background: 220 20% 5%;
    --foreground: 215 30% 92%;

    --card: 220 18% 8%;
    --card-foreground: 215 30% 92%;

    --popover: 220 18% 8%;
    --popover-foreground: 215 30% 92%;

    --primary: 140 80% 55%; /* Neon Green */
    --primary-foreground: 220 20% 5%;

    --secondary: 220 15% 12%;
    --secondary-foreground: 215 30% 92%;

    --muted: 220 12% 16%;
    --muted-foreground: 215 15% 55%;

    --accent: 190 90% 60%; /* Neon Cyan/Blue */
    --accent-foreground: 220 20% 5%;

    --destructive: 0 90% 60%; /* Neon Red */
    --destructive-foreground: 210 40% 98%;

    --border: 220 15% 14%;
    --input: 220 15% 14%;
    --ring: 140 80% 55%;

    --radius: 0.5rem; /* Slightly sharper */

    /* Custom tokens */
    --arena-gold: 45 100% 60%; /* Neon Gold/Yellow */
    --arena-blood: 0 90% 60%; /* Neon Red */
    --arena-fame: 280 80% 70%; /* Neon Purple */
    --arena-pop: 190 90% 60%; /* Neon Cyan/Blue */
    --arena-steel: 215 20% 70%;

    --sidebar-background: 220 20% 4%;
    --sidebar-foreground: 215 30% 85%;
    --sidebar-primary: 140 80% 55%;
    --sidebar-primary-foreground: 220 20% 5%;
    --sidebar-accent: 220 15% 10%;
    --sidebar-accent-foreground: 215 30% 92%;
    --sidebar-border: 220 15% 12%;
    --sidebar-ring: 140 80% 55%;
  }`);

updatedCss = updatedCss.replace(/\.dark\s*{[\s\S]*?}/, `.dark {
    --background: 220 20% 5%;
    --foreground: 215 30% 92%;
  }`);

// Add glow classes if they don't exist
if (!updatedCss.includes('.glow-neon-green')) {
  updatedCss = updatedCss.replace('}\n\n@layer utilities {', '}\n\n@layer utilities {\n  .glow-neon-green {\n    box-shadow: 0 0 10px -2px hsl(140 80% 55% / 0.5);\n  }\n  .glow-neon-red {\n    box-shadow: 0 0 10px -2px hsl(0 90% 60% / 0.5);\n  }\n  .glow-neon-blue {\n    box-shadow: 0 0 10px -2px hsl(190 90% 60% / 0.5);\n  }\n  .glow-neon-gold {\n    box-shadow: 0 0 10px -2px hsl(45 100% 60% / 0.5);\n  }');
}

fs.writeFileSync('src/index.css', updatedCss);
