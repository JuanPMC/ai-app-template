import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDeleteEntity } from "@/services/entityApi";
import { useCreateFeature } from "@/services/featureApi";
import type { SelectedItem } from "@/pages/ManagerPage";

interface EntityDetailProps {
  initiativeSlug: string;
  entitySlug: string;
  onClearSelection: () => void;
  onSelect: (item: SelectedItem) => void;
}

export function EntityDetail({
  initiativeSlug,
  entitySlug,
  onClearSelection,
  onSelect,
}: EntityDetailProps) {
  const [showForm, setShowForm] = useState(false);
  const [featureTitle, setFeatureTitle] = useState("");
  const deleteMutation = useDeleteEntity();
  const createFeatureMutation = useCreateFeature();

  const handleDelete = () => {
    if (confirm(`Delete entity "${entitySlug}" and all its features?`)) {
      deleteMutation.mutate(
        { initiativeSlug, entitySlug },
        { onSuccess: onClearSelection }
      );
    }
  };

  const handleCreateFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim()) return;
    createFeatureMutation.mutate(
      {
        initiativeSlug,
        entitySlug,
        data: { title: featureTitle.trim() },
      },
      {
        onSuccess: (feature) => {
          setFeatureTitle("");
          setShowForm(false);
          onSelect({
            type: "feature",
            initiativeSlug,
            entitySlug,
            featureSlug: feature.slug,
          });
        },
      }
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">
        {entitySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        Entity in {initiativeSlug}
      </p>

      <div className="mb-6">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>+ New Feature</Button>
        ) : (
          <form onSubmit={handleCreateFeature} className="flex gap-2">
            <input
              type="text"
              value={featureTitle}
              onChange={(e) => setFeatureTitle(e.target.value)}
              placeholder="Feature title..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
              autoFocus
            />
            <Button type="submit" disabled={createFeatureMutation.isPending}>
              Create
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </form>
        )}
      </div>

      <Button variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
        Delete Entity
      </Button>
    </div>
  );
}
