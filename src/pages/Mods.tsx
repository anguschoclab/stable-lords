import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';

export default function Mods() {
  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" /> House Rules & Mods
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Load optional modifiers to customize your experience.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Code className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p>Modding support and house rules are planned for a future update.</p>
        </CardContent>
      </Card>
    </div>
  );
}
