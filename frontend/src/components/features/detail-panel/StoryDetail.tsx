import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFeature } from "@/services/featureApi";
import { useUpdateStory, useDeleteStory } from "@/services/storyApi";
import type { GherkinStep, Status } from "@/types";

const STATUSES: Status[] = ["draft", "active", "in_progress", "done", "completed", "archived"];
const KEYWORDS = ["Given", "When", "Then", "And", "But"] as const;

interface StoryDetailProps {
  initiativeSlug: string;
  entitySlug: string;
  featureSlug: string;
  storyIndex: number;
  onClearSelection: () => void;
}

export function StoryDetail({
  initiativeSlug,
  entitySlug,
  featureSlug,
  storyIndex,
  onClearSelection,
}: StoryDetailProps) {
  const { data: feature, isLoading } = useFeature(initiativeSlug, entitySlug, featureSlug);
  const updateMutation = useUpdateStory();
  const deleteMutation = useDeleteStory();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<Status>("draft");
  const [editSteps, setEditSteps] = useState<GherkinStep[]>([]);

  if (isLoading || !feature) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  const story = feature.stories[storyIndex];
  if (!story) {
    return <p className="text-red-400">Story not found</p>;
  }

  const startEdit = () => {
    setEditTitle(story.title);
    setEditStatus(story.status);
    setEditSteps([...story.steps]);
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate(
      {
        initiativeSlug,
        entitySlug,
        featureSlug,
        storyIndex,
        data: { title: editTitle, status: editStatus, steps: editSteps },
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleDelete = () => {
    if (confirm(`Delete story "${story.title}"?`)) {
      deleteMutation.mutate(
        { initiativeSlug, entitySlug, featureSlug, storyIndex },
        { onSuccess: onClearSelection }
      );
    }
  };

  const updateStep = (idx: number, field: keyof GherkinStep, value: string) => {
    setEditSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addStep = () => {
    setEditSteps((prev) => [...prev, { keyword: "And", text: "" }]);
  };

  const removeStep = (idx: number) => {
    setEditSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit Story</h2>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          placeholder="Story title"
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

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-400">Steps</h3>
          {editSteps.map((step, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                value={step.keyword}
                onChange={(e) => updateStep(idx, "keyword", e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white w-24"
              >
                {KEYWORDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input
                type="text"
                value={step.text}
                onChange={(e) => updateStep(idx, "text", e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
                placeholder="step description..."
              />
              <button
                onClick={() => removeStep(idx)}
                className="text-red-400 hover:text-red-300 text-sm px-1"
              >
                x
              </button>
            </div>
          ))}
          <Button variant="ghost" onClick={addStep}>+ Add Step</Button>
        </div>

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
        <h2 className="text-xl font-semibold">{story.title}</h2>
        <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{story.status}</span>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Scenario #{storyIndex} in {featureSlug}
      </p>

      <div className="space-y-1 mb-6">
        {story.steps.map((step, idx) => (
          <div key={idx} className="flex gap-2 text-sm">
            <span className="text-blue-400 font-mono w-16 text-right">{step.keyword}</span>
            <span className="text-zinc-300">{step.text}</span>
          </div>
        ))}
        {story.steps.length === 0 && (
          <p className="text-zinc-500 text-sm">No steps defined</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={startEdit}>Edit</Button>
        <Button variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
          Delete
        </Button>
      </div>
    </div>
  );
}
