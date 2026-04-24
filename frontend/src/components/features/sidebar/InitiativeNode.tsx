import { useState } from "react";
import { TreeView } from "@/components/ui/TreeView";
import { EntityNode } from "./EntityNode";
import type { InitiativeTree } from "@/types";
import type { SelectedItem } from "@/pages/ManagerPage";

interface InitiativeNodeProps {
  initiative: InitiativeTree;
  selectedItem: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
}

export function InitiativeNode({
  initiative,
  selectedItem,
  onSelect,
}: InitiativeNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const isSelected =
    selectedItem?.type === "initiative" &&
    selectedItem.initiativeSlug === initiative.slug;

  return (
    <TreeView
      label={initiative.name}
      icon="🚀"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      isSelected={isSelected}
      onClick={() =>
        onSelect({ type: "initiative", initiativeSlug: initiative.slug })
      }
    >
      {initiative.entities.map((entity) => (
        <EntityNode
          key={entity.slug}
          entity={entity}
          initiativeSlug={initiative.slug}
          selectedItem={selectedItem}
          onSelect={onSelect}
        />
      ))}
    </TreeView>
  );
}
