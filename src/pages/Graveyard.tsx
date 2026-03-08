/**
 * Stable Lords — Graveyard & Retired Warriors
 */
import React from "react";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, Armchair, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Graveyard() {
  const { state } = useGame();

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
            <Skull className="h-3.5 w-3.5" /> Fallen ({state.graveyard.length})
          </TabsTrigger>
          <TabsTrigger value="retired" className="gap-1.5">
            <Armchair className="h-3.5 w-3.5" /> Retired ({state.retired.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graveyard" className="space-y-3 mt-4">
          {state.graveyard.length === 0 ? (
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
            state.graveyard.map((w) => (
              <Card key={w.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-semibold text-foreground">{w.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {STYLE_DISPLAY_NAMES[w.style]}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      <Skull className="h-3 w-3 mr-1" /> Week {w.deathWeek}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {w.career.wins}W-{w.career.losses}L-{w.career.kills}K
                    {w.deathCause && <> · {w.deathCause}</>}
                    {w.killedBy && <> · Slain by {w.killedBy}</>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="retired" className="space-y-3 mt-4">
          {state.retired.length === 0 ? (
            <p className="text-muted-foreground italic text-sm">No warriors have retired yet.</p>
          ) : (
            state.retired.map((w) => (
              <Card key={w.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-semibold text-foreground">{w.name}</span>
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
