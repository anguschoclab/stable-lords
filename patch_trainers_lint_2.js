import fs from 'fs';

let content = fs.readFileSync('src/pages/Trainers.tsx', 'utf-8');

// Replace:
// const currentTrainers = state.trainers ?? [];
// const hiringPool = state.hiringPool ?? [];

const replacer = `const currentTrainers = useMemo(() => state.trainers ?? [], [state.trainers]);
  const hiringPool = useMemo(() => state.hiringPool ?? [], [state.hiringPool]);`;

content = content.replace(/const currentTrainers = state.trainers \?\? \[\];\n  const hiringPool = state.hiringPool \?\? \[\];/, replacer);

fs.writeFileSync('src/pages/Trainers.tsx', content);
