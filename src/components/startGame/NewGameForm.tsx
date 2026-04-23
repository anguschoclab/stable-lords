import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dices, ArrowRight } from "lucide-react";
import { randomOwnerName, randomStableName } from "@/data/randomNames";
import { generateCrest } from "@/engine/crest/crestGenerator";
import { StableCrest } from "@/components/crest/StableCrest";
import type { CrestData } from "@/types/crest.types";
import BackstoryPicker from "@/components/startGame/BackstoryPicker";
import { BACKSTORY_IDS, type BackstoryId } from "@/data/backstories";

interface NewGameFormProps {
  ownerName: string;
  setOwnerName: (name: string) => void;
  stableName: string;
  setStableName: (name: string) => void;
  playerCrest: CrestData;
  setPlayerCrest: (crest: CrestData) => void;
  backstoryId: BackstoryId | null;
  setBackstoryId: (id: BackstoryId) => void;
  onBack: () => void;
  onSubmit: () => void;
  canCreate: boolean;
}

export default function NewGameForm({
  ownerName,
  setOwnerName,
  stableName,
  setStableName,
  playerCrest,
  setPlayerCrest,
  backstoryId,
  setBackstoryId,
  onBack,
  onSubmit,
  canCreate,
}: NewGameFormProps) {
  const randomizeCrest = () => {
    const newCrest = generateCrest({
      seed: Math.floor(Math.random() * 100000),
      philosophy: "Balanced",
      tier: "Established"
    });
    setPlayerCrest(newCrest);
  };

  const randomizeBackstory = () => {
    const id = BACKSTORY_IDS[Math.floor(Math.random() * BACKSTORY_IDS.length)]!;
    setBackstoryId(id);
  };

  const randomizeAll = () => {
    setOwnerName(randomOwnerName());
    setStableName(randomStableName());
    randomizeCrest();
    randomizeBackstory();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-[#0C0806]"
    >
      <div className="relative z-10 w-full max-w-xl space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground/60 hover:text-accent text-[11px] font-black uppercase tracking-widest transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETURN TO TITLE
        </button>

        <div
          className="relative p-8 space-y-7"
          style={{
            background: "linear-gradient(145deg, #150F08 0%, #110C07 60%, #140E08 100%)",
            border: "1px solid rgba(60, 42, 22, 0.9)",
            borderTopColor: "rgba(100, 70, 36, 0.55)",
            borderLeftColor: "rgba(80, 56, 28, 0.5)",
          }}
        >
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(201,151,42,0.5) 30%, rgba(201,151,42,0.8) 50%, rgba(201,151,42,0.5) 70%, transparent)",
            }}
          />

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5))", padding: "1px" }}>
                <div className="w-full h-full rounded-full bg-[#0C0806]" />
              </div>
              <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "radial-gradient(ellipse at 35% 35%, rgba(160, 40, 48, 0.95) 0%, #872228 55%, rgba(100, 20, 26, 0.9) 100%)", boxShadow: "0 4px 16px rgba(135, 34, 40, 0.5), inset 0 1px 0 rgba(255, 200, 200, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)" }}>
                <Dices className="h-6 w-6 text-[#F2D5B8]" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                FORGE YOUR STABLE
              </h2>
              <p className="text-muted-foreground text-xs mt-2 leading-relaxed max-w-[280px] mx-auto">
                The orphanage doors creak open. Beyond them lies the roar of the crowd, the clash of steel, and a chance to forge legends.
              </p>
            </div>
          </div>

          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,151,42,0.2) 40%, rgba(201,151,42,0.2) 60%, transparent)" }} />

          <Button
            variant="outline"
            type="button"
            onClick={randomizeAll}
            title="Randomize everything"
            className="w-full h-10 gap-2 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5 text-[11px] font-black uppercase tracking-wider"
          >
            <Dices className="h-4 w-4 text-accent/70" />
            RANDOMIZE ALL
          </Button>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="owner-name" className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70">
                YOUR NAME
              </label>
              <div className="flex gap-2">
                <Input
                  id="owner-name"
                  placeholder="e.g. Master Thorne"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  maxLength={24}
                  autoFocus
                  className="flex-1 h-10 text-sm bg-[#0A0705] border-[rgba(60,42,22,0.8)] focus:border-accent/40 focus:ring-accent/20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setOwnerName(randomOwnerName())}
                  title="Random name"
                  aria-label="Randomize your name"
                  className="h-10 w-10 shrink-0 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5"
                >
                  <Dices className="h-4 w-4 text-accent/70" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="stable-name" className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70">
                STABLE NAME
              </label>
              <div className="flex gap-2">
                <Input
                  id="stable-name"
                  placeholder="e.g. The Iron Wolves"
                  value={stableName}
                  onChange={(e) => setStableName(e.target.value)}
                  maxLength={30}
                  className="flex-1 h-10 text-sm bg-[#0A0705] border-[rgba(60,42,22,0.8)] focus:border-accent/40 focus:ring-accent/20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setStableName(randomStableName())}
                  title="Random name"
                  aria-label="Randomize stable name"
                  className="h-10 w-10 shrink-0 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5"
                >
                  <Dices className="h-4 w-4 text-accent/70" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70 flex items-center gap-2">
                HERALDIC SEAL
                <span className="text-[8px] text-muted-foreground/50 normal-case tracking-normal">— Your sigil in the arena</span>
              </label>
              
              <div className="relative p-6 flex flex-col items-center gap-4" style={{ background: `linear-gradient(145deg, rgba(201,151,42,0.05) 0%, rgba(${parseInt(playerCrest.primaryColor.slice(1,3), 16)}, ${parseInt(playerCrest.primaryColor.slice(3,5), 16)}, ${parseInt(playerCrest.primaryColor.slice(5,7), 16)}, 0.03) 50%, rgba(21,15,8,0.8) 100%)`, border: "1px solid rgba(201, 151, 42, 0.25)", borderTopColor: "rgba(201, 151, 42, 0.4)" }}>
                <div className="absolute top-0 left-4 right-4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,151,42,0.3) 30%, rgba(201,151,42,0.5) 50%, rgba(201,151,42,0.3) 70%, transparent)" }} />
                
                <div className="relative">
                  <StableCrest 
                    crest={playerCrest} 
                    size={80} 
                    showMantling 
                    className="drop-shadow-[0_0_15px_rgba(201,151,42,0.2)]"
                  />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground italic">
                    {playerCrest.fieldType} field • {playerCrest.shieldShape} shield
                  </p>
                  <p className="text-[9px] text-accent/60 uppercase tracking-widest">
                    {playerCrest.charge.name}
                    {playerCrest.charge.count > 1 && ` ×${playerCrest.charge.count}`}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  type="button"
                  onClick={randomizeCrest}
                  title="Randomize heraldry"
                  aria-label="Randomize your heraldic crest"
                  className="h-9 px-4 gap-2 border-[rgba(60,42,22,0.8)] bg-[#0A0705] hover:border-accent/40 hover:bg-accent/5 text-[11px] font-black uppercase tracking-wider"
                >
                  <Dices className="h-4 w-4 text-accent/70" />
                  RANDOMIZE HERALDRY
                </Button>
              </div>
            </div>
          </div>

          <BackstoryPicker
            value={backstoryId}
            onChange={setBackstoryId}
            onRandomize={randomizeBackstory}
          />

          <Button
            onClick={onSubmit}
            disabled={!canCreate}
            className="w-full h-12 gap-2 font-display font-bold text-sm tracking-wider uppercase"
            size="lg"
          >
            ENTER THE ORPHANAGE
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
