import React from 'react';
import { HeatmapFilterDemo } from '@/components/heatmap-filter-demo';

export default function HeatmapDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Heatmap Time Interval Filter Demo</h1>
      <p className="text-white/70 mb-8">
        This demo showcases a heatmap with a time interval filter that allows switching between hourly and 10-minute views.
      </p>
      <HeatmapFilterDemo />
    </div>
  );
} 