import { TreeView } from "@/components/ui/TreeView";
import type { StoryBrief } from "@/types";

interface StoryNodeProps {
  story: StoryBrief;
  isSelected: boolean;
  onSelect: () => void;
}

export function StoryNode({ story, isSelected, onSelect }: StoryNodeProps) {
  return (
    <TreeView
      label={story.title}
      icon="📝"
      isLeaf
      isSelected={isSelected}
      onClick={onSelect}
    />
  );
}
