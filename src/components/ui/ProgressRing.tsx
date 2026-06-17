import React from "react";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subtitle?: string;
}

export default function ProgressRing({
  percentage,
  size = 180,
  strokeWidth = 14,
  label,
  subtitle,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const isWarn = percentage < 50;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#daede3"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isWarn ? "url(#warnGradient)" : "url(#successGradient)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
          className="animate-pulse-soft"
        />
        <defs>
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#52b788" />
            <stop offset="100%" stopColor="#1b4332" />
          </linearGradient>
          <linearGradient id="warnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9bc87" />
            <stop offset="100%" stopColor="#c98d55" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-bold text-slate-850">
          {percentage.toFixed(0)}%
        </span>
        {label && <span className="text-sm text-forest-600 font-medium mt-1">{label}</span>}
        {subtitle && <span className="text-xs text-forest-500 mt-0.5">{subtitle}</span>}
      </div>
    </div>
  );
}
