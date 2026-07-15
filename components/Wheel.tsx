"use client";

import { useEffect, useRef, useState } from "react";

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6",
  "#ec4899", "#f43f5e", "#14b8a6", "#a855f7",
];

// Point on a circle for an angle measured clockwise from the top (12 o'clock).
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

function truncate(label: string, max: number) {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}

interface WheelProps {
  labels: string[];
  targetIndex: number | null;
  spinToken: number;
  onSettled: () => void;
  spinning: boolean;
}

export function Wheel({ labels, targetIndex, spinToken, onSettled, spinning }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastToken = useRef(spinToken);

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const n = Math.max(labels.length, 1);
  const seg = 360 / n;

  useEffect(() => {
    if (spinToken === lastToken.current || targetIndex == null) return;
    lastToken.current = spinToken;

    // Land the chosen segment's center under the pointer at the top.
    const center = (targetIndex + 0.5) * seg;
    const desiredMod = ((-center) % 360 + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const advance = (desiredMod - currentMod + 360) % 360;
    const target = rotation + 360 * 5 + advance;

    setDuration(4.5);
    setRotation(target);
  }, [spinToken, targetIndex, seg, rotation]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* pointer */}
      <div className="absolute left-1/2 -top-1 z-10 -translate-x-1/2">
        <div
          className="h-0 w-0"
          style={{
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "22px solid #111827",
          }}
        />
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onTransitionEnd={() => spinning && onSettled()}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: duration ? `transform ${duration}s cubic-bezier(0.17, 0.67, 0.12, 0.99)` : "none",
        }}
      >
        {labels.map((label, i) => {
          const a0 = i * seg;
          const a1 = (i + 1) * seg;
          const p0 = polar(cx, cy, r, a0);
          const p1 = polar(cx, cy, r, a1);
          const largeArc = seg > 180 ? 1 : 0;
          const mid = (i + 0.5) * seg;
          const textPos = polar(cx, cy, r * 0.62, mid);
          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y} Z`}
                fill={PALETTE[i % PALETTE.length]}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={textPos.x}
                y={textPos.y}
                fill="#ffffff"
                fontSize={n > 8 ? 10 : 12}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid} ${textPos.x} ${textPos.y})`}
              >
                {truncate(label, n > 8 ? 14 : 18)}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={22} fill="#111827" stroke="#ffffff" strokeWidth={3} />
      </svg>
    </div>
  );
}
