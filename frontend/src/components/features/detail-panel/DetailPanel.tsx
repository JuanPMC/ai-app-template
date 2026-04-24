import { EmptyState } from "./EmptyState";
import { InitiativeDetail } from "./InitiativeDetail";
import { EntityDetail } from "./EntityDetail";
import { FeatureDetail } from "./FeatureDetail";
import { StoryDetail } from "./StoryDetail";
import type { SelectedItem } from "@/pages/ManagerPage";

interface DetailPanelProps {
  selectedItem: SelectedItem | null;
  onClearSelection: () => void;
  onSelect: (item: SelectedItem) => void;
}

export function DetailPanel({ selectedItem, onClearSelection, onSelect }: DetailPanelProps) {
  if (!selectedItem) {
    return <EmptyState />;
  }

  switch (selectedItem.type) {
    case "initiative":
      return (
        <InitiativeDetail
          initiativeSlug={selectedItem.initiativeSlug}
          onClearSelection={onClearSelection}
          onSelect={onSelect}
        />
      );
    case "entity":
      return (
        <EntityDetail
          initiativeSlug={selectedItem.initiativeSlug}
          entitySlug={selectedItem.entitySlug!}
          onClearSelection={onClearSelection}
          onSelect={onSelect}
        />
      );
    case "feature":
      return (
        <FeatureDetail
          initiativeSlug={selectedItem.initiativeSlug}
          entitySlug={selectedItem.entitySlug!}
          featureSlug={selectedItem.featureSlug!}
          onClearSelection={onClearSelection}
          onSelect={onSelect}
        />
      );
    case "story":
      return (
        <StoryDetail
          initiativeSlug={selectedItem.initiativeSlug}
          entitySlug={selectedItem.entitySlug!}
          featureSlug={selectedItem.featureSlug!}
          storyIndex={selectedItem.storyIndex!}
          onClearSelection={onClearSelection}
        />
      );
  }
}
