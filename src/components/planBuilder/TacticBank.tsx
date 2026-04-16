import { Droppable, Draggable, type DroppableProvided, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd";
import { GripVertical, Zap, Swords, Shield, Target, Activity, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TACTIC_BANK = [
  { id: "Lunge", type: "offensive", label: "Lunge", icon: Zap },
  { id: "Slash", type: "offensive", label: "Slash", icon: Swords },
  { id: "Bash", type: "offensive", label: "Bash", icon: Shield },
  { id: "Decisiveness", type: "offensive", label: "DEC", icon: Target },
  { id: "Dodge", type: "defensive", label: "Dodge", icon: Activity },
  { id: "Parry", type: "defensive", label: "Parry", icon: Shield },
  { id: "Riposte", type: "defensive", label: "Riposte", icon: Flame },
  { id: "Responsiveness", type: "defensive", label: "RESP", icon: Clock },
];

export default function TacticBank() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-arena-gold mb-2">
        <GripVertical className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Tactic Bank</span>
      </div>
      <Droppable droppableId="bank">
        {(provided: DroppableProvided) => (
          <div 
            {...provided.droppableProps} 
            ref={provided.innerRef}
            className="flex flex-col gap-2 p-2 bg-black/40 border border-white/5 rounded-none"
          >
            {TACTIC_BANK.map((t, idx) => (
              <Draggable key={t.id} draggableId={t.id} index={idx}>
                {(dragProvided: DraggableProvided, dragSnapshot: DraggableStateSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={cn(
                      "flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-grab active:cursor-grabbing",
                      dragSnapshot.isDragging ? "bg-arena-blood border-white text-white z-50" : "bg-white/5 border-white/10 text-muted-foreground hover:border-arena-gold/40 hover:text-foreground"
                    )}
                  >
                    <t.icon className="w-4 h-4 shrink-0" />
                    {t.label}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
