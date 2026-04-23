/**
 * Offseason — year-end retrospective and setup for the next season.
 * Reuses YearEndRecap for the retrospective block and a small nav panel
 * for common offseason actions (recruit, trainers, ledger).
 */
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { YearEndRecap } from '@/components/ledger/YearEndRecap';
import { CalendarDays, UserPlus, GraduationCap, BookOpen } from 'lucide-react';

export default function Offseason() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Offseason"
        subtitle="YEAR-END · RETROSPECTIVE · SEASON TRANSITION"
        icon={CalendarDays}
      />

      <YearEndRecap />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/5">
        <Link to="/stable/recruit">
          <Surface
            variant="glass"
            className="px-5 py-4 border-border/30 hover:border-primary/50 transition-all flex items-center gap-3"
          >
            <UserPlus className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-black uppercase tracking-tight">Refresh Roster</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Scout new recruits
              </div>
            </div>
          </Surface>
        </Link>
        <Link to="/ops/personnel">
          <Surface
            variant="glass"
            className="px-5 py-4 border-border/30 hover:border-primary/50 transition-all flex items-center gap-3"
          >
            <GraduationCap className="h-5 w-5 text-arena-gold" />
            <div>
              <div className="text-sm font-black uppercase tracking-tight">Revise Staff</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Trainers + mentors
              </div>
            </div>
          </Surface>
        </Link>
        <Link to="/ops/finance">
          <Surface
            variant="glass"
            className="px-5 py-4 border-border/30 hover:border-primary/50 transition-all flex items-center gap-3"
          >
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-black uppercase tracking-tight">Ledger</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Full year-end detail
              </div>
            </div>
          </Surface>
        </Link>
      </div>
    </div>
  );
}
