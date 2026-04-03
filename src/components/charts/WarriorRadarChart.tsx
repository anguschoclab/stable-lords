import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Warrior, ATTRIBUTE_LABELS, ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from "@/types/game";

interface WarriorRadarChartProps {
  warrior: Warrior;
}

const chartConfig: ChartConfig = {
  current: {
    label: "Current Stats",
    color: "hsl(var(--primary))",
  },
  potential: {
    label: "Genetic Potential",
    color: "hsl(var(--muted-foreground))",
  },
};

export function WarriorRadarChart({ warrior }: WarriorRadarChartProps) {
  const data = ATTRIBUTE_KEYS.map((key) => ({
    attribute: ATTRIBUTE_LABELS[key],
    current: warrior.attributes[key],
    potential: warrior.potential ? warrior.potential[key] : warrior.attributes[key],
    fullMark: ATTRIBUTE_MAX,
  }));

  return (
    <div className="w-full aspect-square max-w-md mx-auto">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid className="fill-muted/20" />
          <PolarAngleAxis
            dataKey="attribute"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, ATTRIBUTE_MAX]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Potential"
            dataKey="potential"
            stroke="hsl(var(--muted-foreground))"
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.1}
            strokeDasharray="4 4"
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
