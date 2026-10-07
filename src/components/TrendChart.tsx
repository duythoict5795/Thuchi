import React, { useState } from 'react';
import { formatVND } from '../utils/storage';

interface TrendChartProps {
  mode: 'month' | 'year';
  labels: string[];
  incomeData: number[];
  expenseData: number[];
}

export const TrendChart: React.FC<TrendChartProps> = ({
  mode,
  labels,
  incomeData,
  expenseData,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxValue = Math.max(1, ...incomeData, ...expenseData) * 1.15;
  const chartHeight = 180;
  const chartWidth = Math.max(340, labels.length * (mode === 'month' ? 24 : 45));

  // Helper for Y coordinate
  const getY = (val: number) => {
    return chartHeight - (val / maxValue) * (chartHeight - 30);
  };

  // Build expense line path
  const expensePoints = expenseData.map((val, idx) => {
    const x = (idx / (labels.length - 1 || 1)) * (chartWidth - 40) + 20;
    const y = getY(val);
    return `${x},${y}`;
  });
  const expensePath = `M ${expensePoints.join(' L ')}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Xu hướng dòng tiền ({mode === 'month' ? 'Theo ngày' : 'Theo tháng'})
        </h4>
        <div className="flex items-center gap-4 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span className="text-slate-600">Thu nhập</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-red-500" />
            <span className="text-slate-600">Chi tiêu</span>
          </div>
        </div>
      </div>

      <div className="relative border border-slate-100 bg-slate-50/50 rounded-2xl p-3 overflow-hidden">
        {/* Tooltip display */}
        {hoveredIdx !== null && (
          <div className="mb-2 p-2 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              {mode === 'month' ? `Ngày ${labels[hoveredIdx]}` : `Tháng ${labels[hoveredIdx]}`}
            </span>
            <div className="flex items-center gap-3 tabular-nums font-semibold">
              <span className="text-emerald-600">+{formatVND(incomeData[hoveredIdx] || 0)}</span>
              <span className="text-red-500">-{formatVND(expenseData[hoveredIdx] || 0)}</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <div style={{ minWidth: `${chartWidth}px` }} className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} className="w-full overflow-visible">
              {/* Horizontal grid lines */}
              {[0, 0.33, 0.66, 1].map((pct, i) => {
                const y = chartHeight - pct * (chartHeight - 30);
                return (
                  <line
                    key={i}
                    x1="10"
                    y1={y}
                    x2={chartWidth - 10}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Income Bars */}
              {incomeData.map((val, idx) => {
                const x = (idx / (labels.length - 1 || 1)) * (chartWidth - 40) + 20;
                const barWidth = mode === 'month' ? 8 : 16;
                const barHeight = Math.max(0, chartHeight - getY(val));
                const y = getY(val);

                return (
                  <rect
                    key={`bar-${idx}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill="#10b981"
                    opacity={hoveredIdx === idx ? 1 : 0.8}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}

              {/* Expense Line & Points */}
              {expenseData.some((v) => v > 0) && (
                <>
                  <path
                    d={expensePath}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {expenseData.map((val, idx) => {
                    const x = (idx / (labels.length - 1 || 1)) * (chartWidth - 40) + 20;
                    const y = getY(val);
                    const isHovered = hoveredIdx === idx;
                    return (
                      <circle
                        key={`pt-${idx}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 4.5 : 2.5}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    );
                  })}
                </>
              )}

              {/* X Axis Labels */}
              {labels.map((lbl, idx) => {
                // If mode is month, show every 2-3 days to avoid crowding
                if (mode === 'month' && idx % 3 !== 0 && idx !== labels.length - 1) return null;
                const x = (idx / (labels.length - 1 || 1)) * (chartWidth - 40) + 20;
                return (
                  <text
                    key={`lbl-${idx}`}
                    x={x}
                    y={chartHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#94a3b8"
                  >
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
