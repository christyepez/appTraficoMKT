"use client";

import { MetricsDashboard } from "../../features/metrics/components/MetricsDashboard";
import { useMetricsDashboard } from "../../features/metrics/hooks/useMetricsDashboard";
import { AppNav } from "../nav";

export default function MetricsPage() {
  const workspace = useMetricsDashboard();
  return (
    <main className="app-shell">
      <AppNav />
      <MetricsDashboard workspace={workspace} />
    </main>
  );
}
