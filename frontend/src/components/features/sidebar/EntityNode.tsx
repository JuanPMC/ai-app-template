import { useState } from "react";
import { TreeView } from "@/components/ui/TreeView";
import { FeatureNode } from "./FeatureNode";
import type { EntityTree } from "@/types";
import type { SelectedItem } from "@/pages/ManagerPage";

interface EntityNodeProps {
  entity: EntityTree;
  initiativeSlug: string;
  selectedItem: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
}

export function EntityNode({
  entity,
  initiativeSlug,
  selectedItem,
  onSelect,
}: EntityNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const isSelected =
    selectedItem?.type === "entity" &&
    selectedItem.initiativeSlug === initiativeSlug &&
    selectedItem.entitySlug === entity.slug;

  return (
    <TreeView
      label={entity.name}
      icon="📁"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      isSelected={isSelected}
      onClick={() =>
        onSelect({
          type: "entity",
          initiativeSlug,
          entitySlug: entity.slug,
        })
      }
    >
      {entity.features.map((feature) => (
        <FeatureNode
          key={feature.slug}
          feature={feature}
          initiativeSlug={initiativeSlug}
          entitySlug={entity.slug}
          selectedItem={selectedItem}
          onSelect={onSelect}
        />
      ))}
    </TreeView>
  );
}
