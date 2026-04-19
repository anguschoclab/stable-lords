import { Button } from "@/components/ui/button";
import { Flame, Zap } from "lucide-react";

interface StoryBeginsStepProps {
  onFinish: () => void;
}

export default function StoryBeginsStep({ onFinish }: StoryBeginsStepProps) {
  return (
    <div
      className="p-7 space-y-6 text-center"
      style={{
        background: "linear-gradient(145deg, #150F08 0%, #110C07 60%, #140E08 100%)",
        border: "1px solid rgba(201,151,42,0.3)",
        borderTopColor: "rgba(201,151,42,0.6)",
      }}
    >
      <div
        className="absolute top-0 left-6 right-6 h-0.5 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,151,42,0.7) 30%, rgba(201,151,42,1) 50%, rgba(201,151,42,0.7) 70%, transparent)",
        }}
      />

      <div className="space-y-2">
        <div
          className="w-16 h-16 mx-auto flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,151,42,0.15), rgba(201,151,42,0.05))",
            border: "1px solid rgba(201,151,42,0.3)",
          }}
        >
          <Flame className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-black text-foreground">
          Your Story Begins
        </h2>
        <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-sm mx-auto">
          Stable registered. Warriors enrolled. The imperial commission
          has been notified. The arena awaits.
        </p>
      </div>

      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,151,42,0.2) 40%, rgba(201,151,42,0.2) 60%, transparent)",
        }}
      />

      <Button
        onClick={onFinish}
        className="w-full h-12 gap-2 font-display font-bold tracking-wider uppercase"
        size="lg"
      >
        <Zap className="h-4 w-4 fill-current" />
        Enter the Arena Hub
      </Button>
    </div>
  );
}
