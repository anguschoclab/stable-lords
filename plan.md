1. **Refactor `src/pages/RunRound.tsx`**:
   - Add `import { StatBadge } from "@/components/ui/StatBadge";`.
   - Add `import { WarriorNameTag } from "@/components/ui/WarriorNameTag";`.
   - Replace `<Badge variant="outline" className="text-xs">{STYLE_DISPLAY_NAMES[mp.playerWarrior.style]}</Badge>` with `<StatBadge styleName={mp.playerWarrior.style} showFullName />` and similarly for `mp.rivalWarrior.style`.
   - Replace `<WarriorLink name={mp.playerWarrior.name} id={mp.playerWarrior.id} className="font-semibold" />` with `<WarriorNameTag name={mp.playerWarrior.name} id={mp.playerWarrior.id} />` and similarly for `mp.rivalWarrior`.

2. **Refactor `src/pages/Recruit.tsx`**:
   - In `RecruitCard`, replace `<Badge variant="outline" className="text-[10px]">{styleName}</Badge>` with `<StatBadge styleName={warrior.style} showFullName />`.
   - Ensure `StatBadge` is imported.

3. **Refactor `src/pages/Orphanage.tsx`**:
   - In the mapping of `orphanPool`, replace `<Badge variant="secondary" className="text-[10px]">{STYLE_DISPLAY_NAMES[pw.style]}</Badge>` with `<StatBadge styleName={pw.style} variant="secondary" showFullName />`.
   - Ensure `StatBadge` is imported.

4. **Update `refactoring_suggestions.md`**:
   - Check off any newly handled consolidation tasks. Since some were already marked `[x]` but undone, re-verifying they are checked off.

5. **Pre commit checks**:
   - Run tests `pnpm run test` and `pnpm run lint` and ensure proper verification.
