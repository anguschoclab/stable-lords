const fs = require('fs');

const path = 'src/pages/Trainers.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original sed command missed the opening 'const TIER_COLORS' line.
// So we need to remove lines 37, 38, 39 left over by the sed. Let's just do a proper replace.
content = content.replace(/const TIER_COLORS: Record<string, string> = \{\s+<\/Card>\s+\);\s+\}\s+export default function Trainers/g, 'export default function Trainers');

content = content.replace(
  'import { GraduationCap, UserPlus, UserMinus, RefreshCw, Armchair, Sparkles, Clock, Coins } from "lucide-react";',
  'import { GraduationCap, UserPlus, RefreshCw, Armchair, Coins } from "lucide-react";'
);

content = content.replace(
  'import { toast } from "sonner";',
  'import { toast } from "sonner";\nimport TrainerCard from "@/components/TrainerCard";'
);

fs.writeFileSync(path, content);
