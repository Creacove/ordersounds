
import React from "react";
import {
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Area,
  Bar,
  Cell,
  Line,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";
import { cn } from "@/lib/utils";

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  height?: string;
  className?: string;
}

export function AreaChart({
  data,
  index,
  categories,
  colors = ["#6366F1"],
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  height = "h-72",
  className,
}: ChartProps) {
  const chartConfig = categories.reduce(
    (acc, category, i) => ({
      ...acc,
      [category]: {
        label: category,
        color: colors[i % colors.length],
      },
    }),
    {}
  );

  return (
    <div className={cn("w-full", height, className)}>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            {showTooltip && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value) =>
                      typeof value === "number" ? valueFormatter(value) : value
                    }
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={0.3}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["#6366F1"],
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  height = "h-72",
  className,
}: ChartProps) {
  const chartConfig = categories.reduce(
    (acc, category, i) => ({
      ...acc,
      [category]: {
        label: category,
        color: colors[i % colors.length],
      },
    }),
    {}
  );

  return (
    <div className={cn("w-full", height, className)}>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            {showTooltip && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value) =>
                      typeof value === "number" ? valueFormatter(value) : value
                    }
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Bar
                key={category}
                dataKey={category}
                fill={colors[i % colors.length]}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["#6366F1"],
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  height = "h-72",
  className,
}: ChartProps) {
  const chartConfig = categories.reduce(
    (acc, category, i) => ({
      ...acc,
      [category]: {
        label: category,
        color: colors[i % colors.length],
      },
    }),
    {}
  );

  return (
    <div className={cn("w-full", height, className)}>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showXAxis && <XAxis dataKey={index} />}
            {showYAxis && <YAxis />}
            {showTooltip && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value) =>
                      typeof value === "number" ? valueFormatter(value) : value
                    }
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            {categories.map((category, i) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colors[i % colors.length]}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

interface PieChartProps {
  data: any[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: string;
  className?: string;
}

export function PieChart({
  data,
  index,
  category,
  colors = ["#6366F1", "#06B6D4", "#8B5CF6", "#F59E0B", "#F43F5E", "#64748B"],
  valueFormatter = (value: number) => value.toString(),
  showLegend = true,
  showTooltip = true,
  height = "h-72",
  className,
}: PieChartProps) {
  const chartConfig = data.reduce(
    (acc, item, i) => ({
      ...acc,
      [item[index]]: {
        label: item[index],
        color: colors[i % colors.length],
      },
    }),
    {}
  );

  return (
    <div className={cn("w-full", height, className)}>
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            {showTooltip && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label as string}
                    formatter={(value) =>
                      typeof value === "number" ? valueFormatter(value) : value
                    }
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            <Pie
              data={data}
              nameKey={index}
              dataKey={category}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={colors[i % colors.length]}
                />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
