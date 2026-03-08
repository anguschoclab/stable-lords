/**
 * Stable Lords — Scouting Page
 * Scout rival warriors to gather intel before fights.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { generateScoutReport, getScoutCost, type ScoutQuality } from "@/engine/scouting";
import type { Warrior, ScoutReportData, RivalStableData } from "@/types/game";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Eye, Shield, Coins, Users, Swords } from "lucide-react";
import { toast } from "sonner";

const QUALITIES: ScoutQuality[] = ["Basic", "Detailed", "Expert"];

export default function Scouting() {
  const { state, setState } = useGame();
  const [selectedRival, setSelectedRival] = useState<string | null>(null);
  const [selectedWarrior, setSelectedWarrior] = useState<string | null>(null);

  const rivals = state.rivals ?? [];
  const reports = state.scoutReports ?? [];

  const activeRival = useMemo(
    () => rivals.find((r) => r.owner.id === selectedRival),
    [rivals, selectedRival]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w) => w.id === selectedWarrior),
    [activeRival, selectedWarrior]
  );

  const existingReport = useMemo(
    () => activeWarrior ? reports.find((r) => r.warriorName === activeWarrior.name) : null,
    [reports, activeWarrior]
  );

  const handleScout = useCallback(
    (quality: ScoutQuality) => {
      if (!activeWarrior) return;
      const cost = getScoutCost(quality);
      if ((state.gold ?? 0) < cost) {
        toast.error(`Not enough gold! Scouting costs ${cost}g.`);
        return;
      }

      const report = generateScoutReport(activeWarrior, quality, state.week);
      const reportData: ScoutReportData = report;

      // Remove old report for same warrior if exists
      const newReports = [
        ...(state.scoutReports ?? []).filter((r) => r.warriorName !== activeWarrior.name),
        reportData,
      ];

      setState({
        ...state,
        scoutReports: newReports,
        gold: (state.gold ?? 0) - cost,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: `Scout: ${activeWarrior.name} (${quality})`,
          amount: -cost,
          category: "other" as const,
        }],
      });
      toast.success(`Intel gathered on ${activeWarrior.name}! (-${cost}g)`);
    },
    [state, setState, activeWarrior]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" /> Scouting
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gather intel on rival warriors before entering the arena.
        </p>
      </div>

      {rivals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No rival stables detected. Start a new game to generate rivals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rival Stables List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Rival Stables
            </h3>
            {rivals.map((rival) => (
              <Card
                key={rival.owner.id}
                className={`cursor-pointer transition-all ${
                  selectedRival === rival.owner.id ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/30"
                }`}
                onClick={() => {
                  setSelectedRival(rival.owner.id);
                  setSelectedWarrior(null);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    <span className="font-display font-semibold text-sm">{rival.owner.stableName}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {rival.roster.filter((w) => w.status === "Active").length} warriors
                    </span>
                    <span>{rival.owner.personality}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warriors in selected rival */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {activeRival ? `${activeRival.owner.stableName} Warriors` : "Select a Stable"}
            </h3>
            {activeRival?.roster.filter((w) => w.status === "Active").map((w) => {
              const hasReport = reports.some((r) => r.warriorName === w.name);
              return (
                <Card
                  key={w.id}
                  className={`cursor-pointer transition-all ${
                    selectedWarrior === w.id ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedWarrior(w.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-display font-semibold text-sm">{w.name}</span>
                        <Badge variant="outline" className="text-[10px] ml-2">
                          {STYLE_DISPLAY_NAMES[w.style]}
                        </Badge>
                      </div>
                      {hasReport && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Eye className="h-3 w-3" /> Scouted
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {w.career.wins}W-{w.career.losses}L
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!activeRival && (
              <p className="text-sm text-muted-foreground italic">Click a rival stable to see their warriors.</p>
            )}
          </div>

          {/* Scout Report / Action */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Intel Report
            </h3>
            {activeWarrior ? (
              <>
                {/* Scout buttons */}
                {!existingReport && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Commission a scouting report on <span className="text-foreground font-semibold">{activeWarrior.name}</span>.
                      </p>
                      <div className="space-y-2">
                        {QUALITIES.map((q) => {
                          const cost = getScoutCost(q);
                          const canAfford = (state.gold ?? 0) >= cost;
                          return (
                            <Button
                              key={q}
                              variant={q === "Expert" ? "default" : "outline"}
                              className="w-full justify-between"
                              disabled={!canAfford}
                              onClick={() => handleScout(q)}
                            >
                              <span className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5" /> {q} Scout
                              </span>
                              <Badge variant="outline" className="font-mono gap-1">
                                <Coins className="h-3 w-3 text-arena-gold" /> {cost}g
                              </Badge>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Existing report */}
                {existingReport && (
                  <Card className="border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        {existingReport.warriorName}
                        <Badge variant="secondary" className="text-[10px]">{existingReport.quality}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Style:</span>{" "}
                        <span className="font-semibold">{STYLE_DISPLAY_NAMES[existingReport.style as keyof typeof STYLE_DISPLAY_NAMES] ?? existingReport.style}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Record:</span>{" "}
                        <span className="font-mono">{existingReport.record}</span>
                      </div>

                      {/* Attribute ranges */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground">Estimated Attributes</div>
                        {ATTRIBUTE_KEYS.map((key) => {
                          const range = existingReport.attributeRanges[key];
                          if (!range) return null;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-8 font-mono">{key}</span>
                              <div className="flex-1">
                                <Progress value={(((range[0] + range[1]) / 2) / 25) * 100} className="h-1.5" />
                              </div>
                              <span className="text-xs font-mono w-12 text-right">{range[0]}-{range[1]}</span>
                            </div>
                          );
                        })}
                      </div>

                      {existingReport.suspectedOE && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-muted-foreground">Suspected OE: <span className="text-foreground font-medium">{existingReport.suspectedOE}</span></span>
                          <span className="text-muted-foreground">AL: <span className="text-foreground font-medium">{existingReport.suspectedAL}</span></span>
                        </div>
                      )}

                      {existingReport.knownInjuries.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Known injuries:</span>{" "}
                          <span className="text-destructive">{existingReport.knownInjuries.join(", ")}</span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground italic">{existingReport.notes}</p>

                      {/* Upgrade option */}
                      {existingReport.quality !== "Expert" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleScout(existingReport.quality === "Basic" ? "Detailed" : "Expert")}
                        >
                          Upgrade Intel
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Select a warrior to scout.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
