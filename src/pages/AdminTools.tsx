import React, { useState } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Download, Upload, Trash2, ShieldAlert, FastForward, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { exportActiveSlot, deleteSlot } from '@/state/saveSlots';
import { advanceWeek } from '@/state/gameStore';
import { computeNextSeason } from '@/engine/weekPipeline';


export default function AdminTools() {
  const { state, setState, doReset } = useGameStore();

  const handleExport = () => {
    exportActiveSlot();
    toast.success('Save exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Basic validation
        if (data && data.state) {
           setState(data.state);
           toast.success('Save imported successfully');
        } else {
           toast.error('Invalid save file format');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to parse save file');
      }
    };
    reader.readAsText(file);
  };

  const skipWeek = () => {
    setState(advanceWeek(state));
    toast.success('Advanced one week');
  };


  const skipFTUE = () => {
    setState({ 
      ...state, 
      ftueComplete: true, 
      isFTUE: false,
      player: {
        id: state.player?.id || "admin-0",
        name: state.player?.name || "Master Admin",
        stableName: state.player?.stableName || "The Admin Lords",
        fame: state.player?.fame || 0,
        renown: state.player?.renown || 0,
        titles: state.player?.titles || 0,
        ...(state.player || {})
      }
    });
    toast.success('FTUE skipped. State unlocked.');
  };

  const skipSeason = () => {
    let newState = { ...state };
    for(let i=0; i<13; i++) {
        newState = advanceWeek(newState);
    }
    newState.season = computeNextSeason(newState.week);
    setState(newState);
    toast.success('Advanced one season');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Admin & Telemetry Tools
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage saves, view telemetry, and trigger system events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" /> Save Management
            </CardTitle>
            <CardDescription>Import or export your save data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExport} className="w-full gap-2" variant="outline">
              <Download className="h-4 w-4" /> Export Current Save (JSON)
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="w-full gap-2 pointer-events-none" variant="outline">
                <Upload className="h-4 w-4" /> Import Save (JSON)
              </Button>
            </div>
            <Button onClick={doReset} className="w-full gap-2" variant="destructive">
              <Trash2 className="h-4 w-4" /> Hard Reset
            </Button>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FastForward className="h-5 w-5" /> Time Control
            </CardTitle>
            <CardDescription>Artificially advance the simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={skipWeek} className="w-full gap-2" variant="secondary">
              Skip 1 Week
            </Button>
            <Button onClick={skipSeason} className="w-full gap-2" variant="secondary">
              Skip Season (13 Weeks)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-muted/20 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" /> Telemetry & System State
            </CardTitle>
            <CardDescription>Raw state dump for debugging</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="bg-muted p-4 rounded-md overflow-x-auto max-h-[300px] text-xs font-mono">
                {JSON.stringify({
                    week: state.week,
                    season: state.season,
                    rosterSize: state.roster.length,
                    gold: state.gold,
                    activeTournaments: state.tournaments.length,
                    rivalCount: state.rivals?.length || 0
                }, null, 2)}
             </div>
          </CardContent>
        </Card>
      </div>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Debug & Development
            </CardTitle>
            <CardDescription>Bypass safety checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={skipFTUE} className="w-full gap-2" variant="destructive">
              Skip FTUE (Unlock All)
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
