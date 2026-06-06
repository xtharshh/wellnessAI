import { useState } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, Filter, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/src/hooks/useTheme';

interface GlowLineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

export function GlowLineChart({
  data,
  color,
  width = 320,
  height = 140,
  label,
}: GlowLineChartProps) {
  const { colors, isDark } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeColor = color || colors.primaryAccent;

  if (!data.length) return null;

  const padding = 16;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((value, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y, value, index };
  });

  const pointsStr = pts.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const activePt = hoveredIndex !== null ? pts[hoveredIndex] : null;

  // Tooltip position computations
  const tooltipWidth = 54;
  const tooltipHeight = 24;
  let tooltipX = 0;
  let tooltipY = 0;

  if (activePt) {
    tooltipX = activePt.x - tooltipWidth / 2;
    // Clamp within boundaries
    if (tooltipX < 4) tooltipX = 4;
    if (tooltipX + tooltipWidth > width - 4) tooltipX = width - tooltipWidth - 4;

    tooltipY = activePt.y - tooltipHeight - 8;
    if (tooltipY < 4) {
      tooltipY = activePt.y + 12; // place below point if too close to top
    }
  }

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
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
          strokeWidth={1}
        />
      ))}
      <Polyline
        points={pointsStr}
        fill="none"
        stroke={activeColor}
        strokeWidth={4}
        opacity={isDark ? 0.25 : 0.15}
        filter="url(#glow)"
      />
      <Polyline
        points={pointsStr}
        fill="none"
        stroke={activeColor}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Render vertical indicator line and point highlight on hover/touch */}
      {activePt && (
        <>
          <Line
            x1={activePt.x}
            y1={padding}
            x2={activePt.x}
            y2={padding + chartHeight}
            stroke={activeColor}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.6}
          />
          <Circle
            cx={activePt.x}
            cy={activePt.y}
            r={6}
            fill={activeColor}
            stroke={isDark ? '#0c0d12' : '#ffffff'}
            strokeWidth={2}
          />
        </>
      )}

      {/* Render tooltip overlay above other graphics */}
      {activePt && (
        <G>
          <Rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            rx={6}
            fill={colors.surfaceContainerHigh}
            stroke={activeColor}
            strokeWidth={1.5}
            opacity={0.95}
          />
          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + tooltipHeight / 2 + 4}
            fill={colors.onSurface}
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
          >
            {activePt.value}
          </SvgText>
        </G>
      )}

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

      {/* Hover/Touch target circles */}
      {pts.map((pt) => (
        <Circle
          key={pt.index}
          cx={pt.x}
          cy={pt.y}
          r={22}
          fill="transparent"
          {...(Platform.OS === 'web'
            ? ({
                onMouseEnter: () => setHoveredIndex(pt.index),
                onMouseLeave: () => setHoveredIndex(null),
                onPointerDown: () => setHoveredIndex(pt.index),
                onPointerUp: () => setHoveredIndex(null),
              } as any)
            : ({
                onPressIn: () => setHoveredIndex(pt.index),
                onPressOut: () => setHoveredIndex(null),
              } as any))}
        />
      ))}
    </Svg>
  );
}
