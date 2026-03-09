import { useCountUp } from "@/hooks/useCountUp";

const MetricItem = ({ end, decimals, suffix, label }: { end: number; decimals: number; suffix: string; label: string }) => {
  const { ref, display } = useCountUp({ end, decimals, suffix });
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2 tracking-tight">
        {display}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

const metrics = [
  { end: 97.8, decimals: 1, suffix: "%", label: "Field-Level Accuracy" },
  { end: 18, decimals: 0, suffix: "x", label: "Faster Than Manual" },
  { end: 60, decimals: 0, suffix: "%", label: "Cost Reduction" },
  { end: 100, decimals: 0, suffix: "%", label: "Field Traceability" },
];

const MetricsStrip = () => (
  <section className="py-16 px-4 bg-primary/5 border-y border-primary/20">
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
      {metrics.map((m) => (
        <MetricItem key={m.label} {...m} />
      ))}
    </div>
  </section>
);

export default MetricsStrip;
