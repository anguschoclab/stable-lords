const fs = require('fs');
const path = 'src/pages/Trainers.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '  const currentTrainers = state.trainers ?? [];\n  const hiringPool = state.hiringPool ?? [];',
  '  const currentTrainers = useMemo(() => state.trainers ?? [], [state.trainers]);\n  const hiringPool = useMemo(() => state.hiringPool ?? [], [state.hiringPool]);'
);

fs.writeFileSync(path, content);
