import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Help & Strategy Guide</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Master the arena with these tips.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Strategy Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <Badge variant="outline" className="mr-2">OE</Badge>
            <strong>Offensive Effort</strong> (1-10): How aggressively your warrior attacks. Higher OE means more damage potential but drains endurance faster.
          </div>
          <div>
            <Badge variant="outline" className="mr-2">AL</Badge>
            <strong>Activity Level</strong> (1-10): Movement and tempo. High AL improves initiative but costs stamina. Low AL conserves energy.
          </div>
          <div>
            <Badge variant="outline" className="mr-2">KD</Badge>
            <strong>Kill Desire</strong> (1-10): How ruthlessly your warrior fights when an opponent is wounded. High KD increases kill chance but may leave openings.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Fighting Styles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Each warrior has one of 10 fighting styles that determines their combat approach:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Basher (BA)</strong> — Raw power, high damage, low finesse</li>
            <li><strong>Lunger (LU)</strong> — Initiative-focused, burst offense</li>
            <li><strong>Striker (ST)</strong> — Balanced attacker, versatile</li>
            <li><strong>Slasher (SL)</strong> — Speed-dependent blade work</li>
            <li><strong>Aimed-Blow (AB)</strong> — Precision targeting, critical hits</li>
            <li><strong>Parry-Lunger (PL)</strong> — Defensive start, explosive counter</li>
            <li><strong>Parry-Riposte (PR)</strong> — Counter-fighting specialist</li>
            <li><strong>Parry-Striker (PS)</strong> — Balanced parry + offense</li>
            <li><strong>Total-Parry (TP)</strong> — Ultimate defense, outlasts opponents</li>
            <li><strong>Wall of Steel (WS)</strong> — Defensive all-rounder</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>7 attributes, total ≈ 70 points, range 3–25 each:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>ST (Strength)</strong> — Damage and carry capacity</li>
            <li><strong>CN (Constitution)</strong> — Hit points and recovery</li>
            <li><strong>SZ (Size)</strong> — Weight class, affects damage and encumbrance</li>
            <li><strong>WT (Wit)</strong> — Learning rate and skill ceiling</li>
            <li><strong>WL (Will)</strong> — Endurance and determination</li>
            <li><strong>SP (Speed)</strong> — Initiative and dodge</li>
            <li><strong>DF (Deftness)</strong> — Accuracy and riposte</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
