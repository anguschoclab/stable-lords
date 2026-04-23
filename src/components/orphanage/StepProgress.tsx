const STEP_LABELS = ['Establish Identity', 'Choose Warriors', 'First Blood', 'Your Story Begins'];

const STEP_SUBTITLES = [
  'Register your name in the Imperial Ledger',
  'Select three gladiators from the intake pool',
  'Witness the first trial of steel',
  'Your dynasty of blood begins now',
];

interface StepProgressProps {
  step: number;
  total: number;
}

export default function StepProgress({ step, total }: StepProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-display font-bold text-sm text-foreground">
            {STEP_LABELS[step]}
          </span>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
            {STEP_SUBTITLES[step]}
          </p>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/40 font-black uppercase tracking-widest">
          {step + 1} / {total}
        </span>
      </div>
      <div className="h-1 bg-[#1A1208] border border-[rgba(60,42,22,0.5)] overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${((step + 1) / total) * 100}%`,
            background:
              'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)/0.8) 100%)',
            boxShadow: '0 0 8px hsl(var(--accent)/0.3)',
          }}
        />
      </div>
    </div>
  );
}
