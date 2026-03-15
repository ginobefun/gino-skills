import type { DataVizElement } from "../../types";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { AnimatedBarChart } from "./AnimatedBarChart";
import { AnimatedCounter } from "./AnimatedCounter";
import { KeyMetricHighlight } from "./KeyMetricHighlight";

export const DataVizOverlay: React.FC<{
  elements: DataVizElement[];
  delay?: number;
}> = ({ elements, delay = 10 }) => {
  if (!elements || elements.length === 0) return null;

  // Max 2 elements per slide
  const items = elements.slice(0, 2);

  return (
    <div style={{ marginTop: 20, width: "100%" }}>
      {items.map((el, i) => {
        const itemDelay = delay + i * 8;

        switch (el.type) {
          case "progress-bar":
            return (
              <AnimatedProgressBar
                key={i}
                label={el.label}
                value={el.value}
                maxValue={el.maxValue}
                unit={el.unit}
                delay={itemDelay}
              />
            );
          case "bar-chart":
            return (
              <AnimatedBarChart
                key={i}
                items={el.items || []}
                unit={el.unit}
                delay={itemDelay}
              />
            );
          case "counter":
            return (
              <AnimatedCounter
                key={i}
                label={el.label}
                value={el.value}
                unit={el.unit}
                delay={itemDelay}
              />
            );
          case "highlight":
            return (
              <KeyMetricHighlight
                key={i}
                label={el.label}
                value={el.value}
                unit={el.unit}
                delay={itemDelay}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
