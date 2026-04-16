import { Button } from "@/components/ui/button";
import { Swords, ArrowLeft, RefreshCw } from "lucide-react";
import WarriorCard from "@/components/orphanage/WarriorCard";

interface WarriorSelectionStepProps {
  orphanPool: ReturnType<typeof import("@/data/orphanPool").generateOrphanPool>;
  selected: Set<string>;
  onToggleWarrior: (id: string) => void;
  onRerollPool: () => void;
  onBack: () => void;
  onNext: () => void;
}

export default function WarriorSelectionStep({
  orphanPool,
  selected,
  onToggleWarrior,
  onRerollPool,
  onBack,
  onNext,
}: WarriorSelectionStepProps) {
  return (
    <div className="space-y-4">
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: "#110C07",
          border: "1px solid rgba(60,42,22,0.7)",
          borderTopColor: "rgba(100,70,36,0.35)",
        }}
      >
        <div>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Choose{" "}
            <strong className="text-foreground">3 gladiators</strong> from
            the intake pool to form your starting stable.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="px-2.5 py-0.5 text-[10px] font-mono font-black"
              style={{
                background: "rgba(20,15,8,0.8)",
                border: "1px solid rgba(60,42,22,0.6)",
                color: selected.size === 3
                  ? "hsl(var(--accent))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {selected.size}/3 SELECTED
            </div>
          </div>
        </div>
        <button aria-label="button"
          onClick={onRerollPool}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-accent transition-colors px-3 py-2"
        >
          <RefreshCw className="h-3 w-3" />
          New Batch
        </button>
      </div>

      <div className="space-y-1.5">
        {orphanPool.map((pw) => (
          <WarriorCard
            key={pw.id}
            warrior={pw}
            isSelected={selected.has(pw.id)}
            canSelect={selected.size < 3 || selected.has(pw.id)}
            onClick={() => onToggleWarrior(pw.id)}
          />
        ))}
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={selected.size < 3}
          className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
          size="lg"
        >
          To the Arena <Swords className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
