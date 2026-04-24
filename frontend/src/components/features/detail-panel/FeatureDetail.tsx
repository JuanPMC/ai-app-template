import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFeature, useUpdateFeature, useDeleteFeature } from "@/services/featureApi";
import { useCreateStory } from "@/services/storyApi";
import type { SelectedItem } from "@/pages/ManagerPage";
import type { Status } from "@/types";

const STATUSES: Status[] = ["draft", "active", "in_progress", "done", "completed", "archived"];

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-dark/10 text-dark",
  active: "bg-accent text-dark",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  completed: "bg-green-200 text-green-900",
  archived: "bg-dark/5 text-muted",
};

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
  const [editEntry, setEditEntry] = useState("");
  const [editUsecase, setEditUsecase] = useState("");
  const [editInitiativeTag, setEditInitiativeTag] = useState("");
  const [editIntegration, setEditIntegration] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [showStoryForm, setShowStoryForm] = useState(false);

  if (isLoading || !feature) {
    return <p className="text-muted">Loading...</p>;
  }

  const startEdit = () => {
    setEditTitle(feature.title);
    setEditDesc(feature.description);
    setEditStatus(feature.status);
    setEditEntry(feature.entry ?? "");
    setEditUsecase(feature.usecase ?? "");
    setEditInitiativeTag(feature.initiative_tag ?? "");
    setEditIntegration(feature.integration ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate(
      {
        initiativeSlug,
        entitySlug,
        featureSlug,
        data: {
          title: editTitle,
          description: editDesc,
          status: editStatus,
          entry: editEntry || undefined,
          usecase: editUsecase || undefined,
          initiative_tag: editInitiativeTag || undefined,
          integration: editIntegration || undefined,
        },
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
        <h2 className="text-lg font-bold text-dark">Edit Feature</h2>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Title"
        />
        <textarea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          className="w-full rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark h-24 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Description"
        />
        <select
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value as Status)}
          className="rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Entry Point <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={editEntry}
              onChange={(e) => setEditEntry(e.target.value)}
              className="w-full rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. bos.clients"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Use Case <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={editUsecase}
              onChange={(e) => setEditUsecase(e.target.value)}
              className="w-full rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. initiate-payment"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Initiative</label>
            <input
              type="text"
              value={editInitiativeTag}
              onChange={(e) => setEditInitiativeTag(e.target.value)}
              className="w-full rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. npp"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Integration</label>
            <input
              type="text"
              value={editIntegration}
              onChange={(e) => setEditIntegration(e.target.value)}
              className="w-full rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. asl"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="accent" onClick={saveEdit} disabled={updateMutation.isPending}>Save</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="inline-block rounded-lg bg-accent/30 px-3 py-1 text-xs font-semibold text-dark mb-3">
            Feature
          </span>
          <h2 className="text-2xl font-bold text-dark">{feature.title}</h2>
        </div>
        <span className={`rounded-xl px-3 py-1 text-xs font-medium ${STATUS_STYLES[feature.status]}`}>
          {feature.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-sm text-muted mb-2">
        {initiativeSlug} / {entitySlug}
      </p>
      {feature.description && (
        <p className="text-sm text-dark/70 mb-4">{feature.description}</p>
      )}

      {(feature.entry || feature.usecase || feature.initiative_tag || feature.integration) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {feature.entry && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
              <span className="text-purple-500">entry:</span>{feature.entry}
            </span>
          )}
          {feature.usecase && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
              <span className="text-indigo-500">usecase:</span>{feature.usecase}
            </span>
          )}
          {feature.initiative_tag && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              <span className="text-amber-500">initiative:</span>{feature.initiative_tag}
            </span>
          )}
          {feature.integration && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-800">
              <span className="text-teal-500">integration:</span>{feature.integration}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-8">
        <Button variant="primary" onClick={startEdit}>Edit</Button>
        <Button variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
          Delete
        </Button>
      </div>

      <div className="border-t border-dark/10 pt-6">
        <h3 className="text-sm font-semibold text-dark mb-4">
          User Stories ({feature.stories.length})
        </h3>
        <div className="space-y-2 mb-4">
          {feature.stories.map((story) => (
            <div
              key={story.index}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dark/10 bg-bg-base cursor-pointer hover:border-accent/50 hover:shadow-sm transition-all text-sm"
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
              <span className="flex-1 font-medium text-dark">{story.title}</span>
              <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[story.status]}`}>
                {story.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>

        {!showStoryForm ? (
          <Button variant="accent" onClick={() => setShowStoryForm(true)}>+ New Story</Button>
        ) : (
          <div className="rounded-2xl border border-dark/10 bg-bg-base p-4">
            <form onSubmit={handleCreateStory} className="flex gap-2">
              <input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="Story title..."
                className="flex-1 rounded-xl border border-dark/20 bg-white px-4 py-2.5 text-sm text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                autoFocus
              />
              <Button variant="primary" type="submit" disabled={createStoryMutation.isPending}>Create</Button>
              <Button variant="ghost" onClick={() => setShowStoryForm(false)}>Cancel</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
