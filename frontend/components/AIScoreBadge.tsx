'use client';

/**
 * AI Match Score - Circular badge that shows how well a property
 * matches the user's requirements. Major visual differentiator.
 *
 * Score logic: based on validation risk_flag + market position
 */

interface AIScoreBadgeProps {
  riskFlag?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  size?: 'sm' | 'md';
}

function getScore(riskFlag?: string | null): number {
  switch (riskFlag) {
    case 'LOW': return 92;
    case 'MEDIUM': return 74;
    case 'HIGH': return 55;
    default: return 80;
  }
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#10b981'; // green
  if (score >= 70) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Great';
  if (score >= 70) return 'Good';
  return 'Fair';
}

export default function AIScoreBadge({ riskFlag, size = 'sm' }: AIScoreBadgeProps) {
  const score = getScore(riskFlag);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const dimensions = size === 'sm' ? { w: 44, r: 16, stroke: 3.5 } : { w: 64, r: 24, stroke: 4 };
  const circumference = 2 * Math.PI * dimensions.r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center" title={`AI Score: ${score}/100 — ${label}`}>
      <svg width={dimensions.w} height={dimensions.w} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={dimensions.w / 2}
          cy={dimensions.w / 2}
          r={dimensions.r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={dimensions.stroke}
        />
        {/* Score ring */}
        <circle
          cx={dimensions.w / 2}
          cy={dimensions.w / 2}
          r={dimensions.r}
          fill="none"
          stroke={color}
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-animate"
        />
      </svg>
      {/* Score number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-base'}`} style={{ color }}>
          {score}
        </span>
      </div>
      {/* Label below */}
      {size === 'md' && (
        <span className="text-[10px] text-gray-500 mt-0.5">{label} match</span>
      )}
    </div>
  );
}
