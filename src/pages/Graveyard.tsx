/**
 * Stable Lords — Graveyard & Retired Warriors
 */
import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, Armchair, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { WarriorLink } from "@/components/EntityLink";

export default function Graveyard() {
  const { state } = useGameStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Hall of Warriors</h1>
        <p className="text-muted-foreground text-sm mt-1">
          The fallen and the honored. Every warrior is remembered.
        </p>
      </div>

      <Tabs defaultValue="graveyard">
        <TabsList>
          <TabsTrigger value="graveyard" className="gap-1.5">
            <Skull className="h-3.5 w-3.5" /> Fallen ({state.graveyard.filter(w => w.stableId === state.player.id || !w.stableId).length})
          </TabsTrigger>
          <TabsTrigger value="retired" className="gap-1.5">
            <Armchair className="h-3.5 w-3.5" /> Retired ({state.retired.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graveyard" className="space-y-3 mt-4">
          {state.graveyard.filter(w => w.stableId === state.player.id || !w.stableId).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Skull className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">No warriors have fallen… yet. Send them into the arena to tempt fate.</p>
                <Link to="/run-round">
                  <Button variant="outline" size="sm" className="gap-2 mt-2">
                    <Zap className="h-4 w-4" /> Run a Round
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            state.graveyard.filter(w => w.stableId === state.player.id || !w.stableId).map((w) => (
              <Card key={w.id} className="border-destructive/20 bg-background/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <WarriorLink name={w.name} id={w.id} className="font-display font-semibold text-foreground text-lg" />
                      <span className="text-sm text-muted-foreground">{STYLE_DISPLAY_NAMES[w.style]}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      <Skull className="h-3 w-3 mr-1" /> Week {w.deathWeek}
                    </Badge>
                  </div>
                  {w.deathEvent?.deathSummary ? (
                    <p className="text-sm italic text-muted-foreground border-l-2 border-destructive/50 pl-3 py-1 my-2">
                      "{w.deathEvent.deathSummary}"
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {w.deathCause && <>Cause of death: {w.deathCause}</>}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Record: {w.career.wins}W-{w.career.losses}L-{w.career.kills}K</span>
                    {w.deathEvent?.killerId && <span>Slain by: <WarriorLink name={w.killedBy || w.deathEvent.killerId} /></span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="retired" className="space-y-3 mt-4">
          {state.retired.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                <Armchair className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No warriors have retired yet. Warriors can be retired from their detail page.
              </CardContent>
            </Card>
          ) : (
            state.retired.map((w) => (
              <Card key={w.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <WarriorLink name={w.name} id={w.id} className="font-display font-semibold text-foreground" />
                      <span className="text-sm text-muted-foreground ml-2">
                        {STYLE_DISPLAY_NAMES[w.style]}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Retired Wk {w.retiredWeek}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {w.career.wins}W-{w.career.losses}L-{w.career.kills}K
                    {w.titles.length > 0 && <> · 🏆 {w.titles.join(", ")}</>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
