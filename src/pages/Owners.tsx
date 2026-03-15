import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Owners() {
  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Hall of Owners
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Learn about the powerful figures behind the rival stables.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p>The Hall of Owners is currently under construction. Check back later to dive into the lore and personalities of the arena's elite.</p>
        </CardContent>
      </Card>
    </div>
  );
}
