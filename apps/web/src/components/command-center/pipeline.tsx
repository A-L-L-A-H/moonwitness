import type { PipelineCard, PipelineColumn } from "@moonwitness/types";
import { KanbanColumn, Grid } from "@moonwitness/ui";
import { SectionHeading } from "./section-heading";

export interface PipelineProps {
  columns: PipelineColumn[];
  onOpenCard: (card: PipelineCard) => void;
}

export function Pipeline({ columns, onOpenCard }: PipelineProps) {
  return (
    <section aria-labelledby="cc-pipeline-heading" className="scroll-mt-24">
      <SectionHeading
        id="cc-pipeline-heading"
        title="EDITORIAL"
        accent="PIPELINE"
        note="click a card, no dragging"
      />
      <Grid cols={{ md: 2, xl: 4 }} gap={4}>
        {columns.map((column) => (
          <KanbanColumn key={column.stage} column={column} onOpenItem={onOpenCard} />
        ))}
      </Grid>
    </section>
  );
}
