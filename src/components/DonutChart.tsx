import React, { useState } from 'react';
import { formatVND } from '../utils/storage';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

interface DonutChartProps {
  title?: string;
  slices: DonutSlice[];
  centerLabel?: string;
  onSliceClick?: (slice: DonutSlice) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  slices,
  centerLabel = 'Tổng cộng',
  onSliceClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-xs font-medium text-slate-500">Chưa có dữ liệu chi tiêu trong kỳ này</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 200;
  const radius = 80;
  const strokeWidth = 32;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Start at top

  const hoveredSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {formatVND(total)}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full transform -rotate-90 drop-shadow-sm"
          >
            {slices.map((slice, index) => {
              const percentage = slice.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = 0;
              const angle = currentAngle;
              currentAngle += percentage * 360;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={slice.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${angle + 90} ${center} ${center})`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSliceClick && onSliceClick(slice)}
                  style={{
                    filter: isHovered ? 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none',
                  }}
                />
              );
            })}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
              {hoveredSlice ? hoveredSlice.label : centerLabel}
            </span>
            <span className="text-sm font-bold text-slate-800 tabular-nums tracking-tight mt-0.5">
              {hoveredSlice ? formatVND(hoveredSlice.value) : formatVND(total)}
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 tabular-nums">
              {hoveredSlice
                ? `${((hoveredSlice.value / total) * 100).toFixed(1)}%`
                : `${slices.length} mục`}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full flex-1 space-y-2">
          {slices.map((slice, idx) => {
            const pct = ((slice.value / total) * 100).toFixed(1);
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSliceClick && onSliceClick(slice)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer border ${
                  isHovered
                    ? 'bg-slate-100/90 border-slate-200'
                    : 'bg-slate-50/70 hover:bg-slate-100/60 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{slice.label}</p>
                    {slice.sublabel && (
                      <p className="text-[10px] text-slate-400 truncate">{slice.sublabel}</p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {formatVND(slice.value)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 block tabular-nums">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
