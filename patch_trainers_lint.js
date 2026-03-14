import fs from 'fs';

let content = fs.readFileSync('src/pages/Trainers.tsx', 'utf-8');

// The issue is in Trainers.tsx line 177 where useCallback is missing dependencies.
// The hook is probably refreshPool or similar. Let's find it.
const refreshPoolRegex = /const refreshPool = useCallback\(\(\) => \{[\s\S]*?\}, \[state, setState\]\);/;
if (refreshPoolRegex.test(content)) {
    content = content.replace(refreshPoolRegex, `const refreshPool = useCallback(() => {
    const pool = generateHiringPool(5, state.week * 1000 + Date.now());
    // Convert Trainer to TrainerData
    const poolData: TrainerData[] = pool.map((t) => ({
      id: t.id,
      name: t.name,
      tier: t.tier,
      focus: t.focus,
      fame: t.fame,
      contractWeeksLeft: t.contractWeeksLeft,
      retiredFromWarrior: t.retiredFromWarrior,
      retiredFromStyle: t.retiredFromStyle,
      styleBonusStyle: t.styleBonusStyle,
    }));
    setState({ ...state, hiringPool: poolData });
    toast.success("New trainers are available for hire!");
  }, [state, setState]); // currentTrainers and hiringPool are not used inside this callback, but let's check.`);
}

// Ah, wait, the warning was:
// src/pages/Trainers.tsx
//   177:5  warning  React Hook useCallback has missing dependencies: 'currentTrainers' and 'hiringPool'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

// Let's find hireTrainer, which probably uses currentTrainers and hiringPool
const hireTrainerRegex = /const hireTrainer = useCallback\([\s\S]*?\[state, setState, canHire\]\n  \);/;
if (hireTrainerRegex.test(content)) {
    content = content.replace(hireTrainerRegex, `const hireTrainer = useCallback(
    (trainer: TrainerData) => {
      if (!canHire) return;
      const cost = TIER_COST[trainer.tier as TrainerTier] ?? 50;
      if ((state.gold ?? 0) < cost) {
        toast.error(\`Not enough gold! Need \${cost}g to hire.\`);
        return;
      }
      setState({
        ...state,
        trainers: [...currentTrainers, trainer],
        hiringPool: hiringPool.filter((t) => t.id !== trainer.id),
        gold: (state.gold ?? 0) - cost,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: \`Hire: \${trainer.name}\`,
          amount: -cost,
          category: "trainer" as const,
        }],
      });
      toast.success(\`\${trainer.name} has joined your stable! (-\${cost}g)\`);
    },
    [state, setState, canHire, currentTrainers, hiringPool]
  );`);
}

fs.writeFileSync('src/pages/Trainers.tsx', content);
