
import React from 'react';
import { Chapter } from '../types';

interface PacingGraphProps {
  chapters: Chapter[];
}

export const PacingGraph: React.FC<PacingGraphProps> = ({ chapters }) => {
  // Mock data simulation if pacingScore isn't generated yet
  // In a real app, this comes from the AI analysis
  const data = chapters.slice(-10).map((c, i) => c.pacingScore || Math.floor(Math.random() * 5) + 3); 
  
  const max = 10;
  const height = 40;
  const width = 100;
  
  if (data.length < 2) return <div className="text-[10px] text-stone-600 italic">Not enough data for pacing analysis</div>;

  const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d / max) * height);
      return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
        <div className="flex justify-between items-end mb-1">
             <span className="text-[9px] uppercase tracking-widest text-stone-500">Narrative Tension (Last 10 Ch.)</span>
             <span className="text-[9px] text-cyan-500 font-mono animate-pulse">{data[data.length-1]}/10</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
             {/* Gradient Def */}
             <defs>
                <linearGradient id="pacingGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path 
                d={`M 0 ${height} L ${points} L ${width} ${height} Z`} 
                fill="url(#pacingGradient)" 
                stroke="none"
            />
            <polyline 
                points={points} 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            {/* Current Pulse Dot */}
            <circle cx={width} cy={height - ((data[data.length-1] / max) * height)} r="3" fill="#06b6d4" className="animate-ping" />
            <circle cx={width} cy={height - ((data[data.length-1] / max) * height)} r="2" fill="white" />
        </svg>
    </div>
  );
};
