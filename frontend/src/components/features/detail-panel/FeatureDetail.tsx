import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFeature, useUpdateFeature, useDeleteFeature } from "@/services/featureApi";
import { useCreateStory } from "@/services/storyApi";
import type { SelectedItem } from "@/pages/ManagerPage";
import type { Status } from "@/types";

const STATUSES: Status[] = ["draft", "active", "in_progress", "done", "completed", "archived"];

interface FeatureDetailProps {
  initiativeSlug: string;
  entitySlug: string;
  featureSlug: string;
  onClearSelection: () => void;
  onSelect: (item: SelectedItem) => void;
}

export function FeatureDetail({
  initiativeSlug,
  entitySlug,
  featureSlug,
  onClearSelection,
  onSelect,
}: FeatureDetailProps) {
  const { data: feature, isLoading } = useFeature(initiativeSlug, entitySlug, featureSlug);
  const updateMutation = useUpdateFeature();
  const deleteMutation = useDeleteFeature();
  const createStoryMutation = useCreateStory();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<Status>("draft");
  const [storyTitle, setStoryTitle] = useState("");
  const [showStoryForm, setShowStoryForm] = useState(false);

  if (isLoading || !feature) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  const startEdit = () => {
    setEditTitle(feature.title);
    setEditDesc(feature.description);
    setEditStatus(feature.status);
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate(
      {
        initiativeSlug,
        entitySlug,
        featureSlug,
        data: { title: editTitle, description: editDesc, status: editStatus },
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleDelete = () => {
    if (confirm(`Delete feature "${featureSlug}"?`)) {
      deleteMutation.mutate(
        { initiativeSlug, entitySlug, featureSlug },
        { onSuccess: onClearSelection }
      );
    }
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim()) return;
    createStoryMutation.mutate(
      {
        initiativeSlug,
        entitySlug,
        featureSlug,
        data: {
          title: storyTitle.trim(),
          steps: [
            { keyword: "Given", text: "" },
            { keyword: "When", text: "" },
            { keyword: "Then", text: "" },
          ],
        },
      },
      {
        onSuccess: (story) => {
          setStoryTitle("");
          setShowStoryForm(false);
          onSelect({
            type: "story",
            initiativeSlug,
            entitySlug,
            featureSlug,
            storyIndex: story.index,
          });
        },
      }
    );
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit Feature</h2>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          placeholder="Title"
        />
        <textarea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white h-24"
          placeholder="Description"
        />
        <select
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value as Status)}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button onClick={saveEdit} disabled={updateMutation.isPending}>Save</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xl font-semibold">{feature.title}</h2>
        <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{feature.status}</span>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        Feature in {initiativeSlug}/{entitySlug}
      </p>
      {feature.description && (
        <p className="text-sm text-zinc-300 mb-6">{feature.description}</p>
      )}

      <div className="flex gap-2 mb-6">
        <Button onClick={startEdit}>Edit</Button>
        <Button variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
          Delete
        </Button>
      </div>

      <h3 className="text-sm font-semibold text-zinc-400 mb-3">
        User Stories ({feature.stories.length})
      </h3>
      <ul className="space-y-2 mb-4">
        {feature.stories.map((story) => (
          <li
            key={story.index}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded cursor-pointer hover:bg-zinc-800 text-sm"
            onClick={() =>
              onSelect({
                type: "story",
                initiativeSlug,
                entitySlug,
                featureSlug,
                storyIndex: story.index,
              })
            }
          >
            <span className="flex-1">{story.title}</span>
            <span className="text-xs text-zinc-500">{story.status}</span>
          </li>
        ))}
      </ul>

      {!showStoryForm ? (
        <Button onClick={() => setShowStoryForm(true)}>+ New Story</Button>
      ) : (
        <form onSubmit={handleCreateStory} className="flex gap-2">
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Story title..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
            autoFocus
          />
          <Button type="submit" disabled={createStoryMutation.isPending}>Create</Button>
          <Button variant="ghost" onClick={() => setShowStoryForm(false)}>Cancel</Button>
        </form>
      )}
    </div>
  );
}
