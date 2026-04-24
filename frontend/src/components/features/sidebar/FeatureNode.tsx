import { useState } from "react";
import { TreeView } from "@/components/ui/TreeView";
import { StoryNode } from "./StoryNode";
import type { FeatureTree } from "@/types";
import type { SelectedItem } from "@/pages/ManagerPage";

interface FeatureNodeProps {
  feature: FeatureTree;
  initiativeSlug: string;
  entitySlug: string;
  selectedItem: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
}

export function FeatureNode({
  feature,
  initiativeSlug,
  entitySlug,
  selectedItem,
  onSelect,
}: FeatureNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const isSelected =
    selectedItem?.type === "feature" &&
    selectedItem.initiativeSlug === initiativeSlug &&
    selectedItem.entitySlug === entitySlug &&
    selectedItem.featureSlug === feature.slug;

  return (
    <TreeView
      label={`${feature.title} (${feature.status})`}
      icon="⚙️"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      isSelected={isSelected}
      onClick={() =>
        onSelect({
          type: "feature",
          initiativeSlug,
          entitySlug,
          featureSlug: feature.slug,
        })
      }
    >
      {feature.stories.map((story) => (
        <StoryNode
          key={story.index}
          story={story}
          isSelected={
            selectedItem?.type === "story" &&
            selectedItem.initiativeSlug === initiativeSlug &&
            selectedItem.entitySlug === entitySlug &&
            selectedItem.featureSlug === feature.slug &&
            selectedItem.storyIndex === story.index
          }
          onSelect={() =>
            onSelect({
              type: "story",
              initiativeSlug,
              entitySlug,
              featureSlug: feature.slug,
              storyIndex: story.index,
            })
          }
        />
      ))}
    </TreeView>
  );
}
