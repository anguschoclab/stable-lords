import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function ArchivesStyles() {
  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Style Archives
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Encyclopedia of the fighting styles.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p>The Style Archives are currently being compiled. Soon you will be able to browse detailed breakdowns of all 10 combat styles.</p>
        </CardContent>
      </Card>
    </div>
  );
}
