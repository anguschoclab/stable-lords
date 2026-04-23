import React, { useState, useEffect, useRef } from 'react';
import { Check, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  label?: string;
}

export function EditableText({
  value,
  onSave,
  className,
  inputClassName,
  label,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = tempValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        <Input
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            'h-8 bg-neutral-900/60 border-primary/50 focus:ring-1 focus:ring-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]',
            inputClassName
          )}
        />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            onClick={handleSave}
            aria-label="Save"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={handleCancel}
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 cursor-pointer transition-all duration-300',
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="relative z-10">{value}</span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Edit2 className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary animate-pulse-slow" />
      </div>

      {/* Subtle hover background effect */}
      <div className="absolute -inset-2 rounded-none bg-primary/0 group-hover:bg-primary/5 border border-primary/0 group-hover:border-primary/10 transition-all duration-300" />

      {label && (
        <span className="absolute -top-4 left-0 text-[8px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      )}
    </div>
  );
}
