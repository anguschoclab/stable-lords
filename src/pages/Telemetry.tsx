import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function Telemetry() {
  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Telemetry & Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View error logs and system telemetry.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p>The telemetry dashboard is currently being built.</p>
        </CardContent>
      </Card>
    </div>
  );
}
