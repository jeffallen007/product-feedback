"use client"

import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts"
import type { DashboardPayload } from "@/lib/types/contracts"

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "var(--color-chart-3)",
  Neutral: "var(--color-chart-4)",
  Negative: "var(--color-chart-5)",
}

export function SentimentOverview({
  sentimentBreakdown,
}: {
  sentimentBreakdown: DashboardPayload["sentimentBreakdown"]
}) {
  const overall = sentimentBreakdown.overall.map((item) => ({
    ...item,
    key: item.label,
  }))
  const bySource = sentimentBreakdown.bySource.map((item) => ({
    source: item.sourceLabel,
    negative: item.negativePercent,
  }))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Sentiment Overview
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Distribution across all analyzed feedback
      </p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {/* Donut */}
        <div className="flex flex-col items-center">
          <ChartContainer
            config={{
              value: { label: "Share" },
              positive: { label: "Positive", color: "var(--chart-3)" },
              neutral: { label: "Neutral", color: "var(--chart-4)" },
              negative: { label: "Negative", color: "var(--chart-5)" },
            }}
            className="aspect-square h-[180px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={overall}
                dataKey="value"
                nameKey="label"
                innerRadius={50}
                outerRadius={75}
                strokeWidth={2}
              >
                {overall.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={SENTIMENT_COLORS[entry.key]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {overall.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: SENTIMENT_COLORS[s.key] }}
                />
                <span className="text-xs text-muted-foreground">
                  {s.label} {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Negative by source */}
        <div>
          <p className="mb-2 text-xs font-medium text-foreground">
            Negative sentiment by source
          </p>
          <ChartContainer
            config={{
              negative: { label: "Negative %", color: "var(--chart-5)" },
            }}
            className="h-[180px] w-full"
          >
            <BarChart
              data={bySource}
              layout="vertical"
              margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="source"
                tickLine={false}
                axisLine={false}
                width={96}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="negative"
                fill="var(--color-negative)"
                radius={4}
                barSize={18}
              >
                <LabelList
                  dataKey="negative"
                  position="right"
                  formatter={(value) => `${value}%`}
                  className="fill-muted-foreground text-[11px]"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  )
}
