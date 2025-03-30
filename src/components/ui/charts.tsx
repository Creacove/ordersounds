
import * as React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "./chart";

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  height?: string;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  [key: string]: any;
}

interface PieChartProps {
  data: any[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  [key: string]: any;
}

export function AreaChart({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  showLegend = true,
  valueFormatter = (value: number) => value.toString(),
  ...props
}: ChartProps) {
  return (
    <ChartContainer
      config={{
        primary: {
          theme: {
            light: colors[0],
            dark: colors[0],
          },
        },
        ...categories.reduce(
          (acc, category, i) => ({
            ...acc,
            [category]: {
              theme: {
                light: colors[i % colors.length],
                dark: colors[i % colors.length],
              },
            },
          }),
          {}
        ),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            {categories.map((category, i) => (
              <linearGradient key={category} id={`color-${category}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey={index} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip 
            formatter={valueFormatter} 
            contentStyle={{ 
              backgroundColor: "var(--background)", 
              borderColor: "var(--border)" 
            }} 
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              fillOpacity={1}
              fill={`url(#color-${category})`}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  showLegend = true,
  valueFormatter = (value: number) => value.toString(),
  ...props
}: ChartProps) {
  return (
    <ChartContainer
      config={{
        ...categories.reduce(
          (acc, category, i) => ({
            ...acc,
            [category]: {
              theme: {
                light: colors[i % colors.length],
                dark: colors[i % colors.length],
              },
            },
          }),
          {}
        ),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={index} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
          <Tooltip 
            formatter={valueFormatter} 
            contentStyle={{ 
              backgroundColor: "var(--background)", 
              borderColor: "var(--border)" 
            }} 
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  showLegend = true,
  valueFormatter = (value: number) => value.toString(),
  ...props
}: ChartProps) {
  return (
    <ChartContainer
      config={{
        ...categories.reduce(
          (acc, category, i) => ({
            ...acc,
            [category]: {
              theme: {
                light: colors[i % colors.length],
                dark: colors[i % colors.length],
              },
            },
          }),
          {}
        ),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={index} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
          <Tooltip 
            formatter={valueFormatter} 
            contentStyle={{ 
              backgroundColor: "var(--background)", 
              borderColor: "var(--border)" 
            }} 
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function PieChart({
  data,
  index,
  category,
  colors = ["#2563eb", "#4ade80", "#f43f5e", "#facc15", "#8b5cf6"],
  valueFormatter = (value: number) => value.toString(),
  className,
  ...props
}: PieChartProps) {
  return (
    <ChartContainer
      config={{
        ...data.reduce(
          (acc, item, i) => ({
            ...acc,
            [item[index]]: {
              theme: {
                light: colors[i % colors.length],
                dark: colors[i % colors.length],
              },
            },
          }),
          {}
        ),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={category}
            nameKey={index}
            cx="50%"
            cy="50%"
            outerRadius={80}
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={valueFormatter} 
            contentStyle={{ 
              backgroundColor: "var(--background)", 
              borderColor: "var(--border)" 
            }} 
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

