import React, { useState, useMemo } from 'react';
import docsData from '@/data/docs.json';
import { MarkdownReader } from '@/components/MarkdownReader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Book, FileText, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DesignBible() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(docsData.length > 0 ? docsData[0] : null);

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return docsData;
    const lowerQuery = searchQuery.toLowerCase();
    return docsData.filter((doc) =>
      doc.filename.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" /> Design Bibles & Archives
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search and read through the canonical design specifications.
          </p>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        {/* Left Sidebar - Document List */}
        <Card className="w-1/3 flex flex-col min-h-0 border-primary/20 bg-background/50">
          <CardHeader className="pb-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search specs or content..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.filename === doc.filename;
                return (
                  <button
                    key={doc.filename}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/20 text-foreground font-medium border border-primary/30'
                        : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'opacity-70'}`} />
                      <span className="truncate">{doc.filename.replace('.md', '').replace(/_/g, ' ')}</span>
                    </div>
                    {isSelected && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
              {filteredDocs.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No documents found matching "{searchQuery}"
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right Area - Document Content */}
        <Card className="flex-1 flex flex-col min-h-0 border-primary/30 shadow-md">
          {selectedDoc ? (
            <>
              <CardHeader className="shrink-0 border-b border-border bg-secondary/30 pb-4">
                <CardTitle className="flex items-center justify-between font-display text-lg">
                  <span className="truncate">{selectedDoc.filename}</span>
                  <Badge variant="outline" className="ml-2 shrink-0">Markdown</Badge>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1 p-6">
                <MarkdownReader content={selectedDoc.content} />
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <Book className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a document from the left to read.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
