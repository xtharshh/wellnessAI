import Svg, { Defs, Filter, FeGaussianBlur, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { colors } from '@/src/theme/colors';

interface GlowLineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

export function GlowLineChart({
  data,
  color = colors.primaryAccent,
  width = 320,
  height = 140,
  label,
}: GlowLineChartProps) {
  if (!data.length) return null;

  const padding = 16;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Defs>
        <Filter id="glow">
          <FeGaussianBlur stdDeviation="2.5" />
        </Filter>
      </Defs>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <Line
          key={ratio}
          x1={padding}
          y1={padding + chartHeight * ratio}
          x2={width - padding}
          y2={padding + chartHeight * ratio}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={4}
        opacity={0.25}
        filter="url(#glow)"
      />
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {label ? (
        <SvgText
          x={padding}
          y={12}
          fill={colors.onSurfaceVariant}
          fontSize="11"
          fontFamily="Inter">
          {label}
        </SvgText>
      ) : null}
    </Svg>
  );
}
