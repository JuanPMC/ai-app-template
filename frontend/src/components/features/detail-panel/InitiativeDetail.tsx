import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDeleteInitiative } from "@/services/initiativeApi";
import { useCreateEntity } from "@/services/entityApi";
import type { SelectedItem } from "@/pages/ManagerPage";

interface InitiativeDetailProps {
  initiativeSlug: string;
  onClearSelection: () => void;
  onSelect: (item: SelectedItem) => void;
}

export function InitiativeDetail({
  initiativeSlug,
  onClearSelection,
  onSelect,
}: InitiativeDetailProps) {
  const [newEntityName, setNewEntityName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const deleteMutation = useDeleteInitiative();
  const createEntityMutation = useCreateEntity();

  const handleDelete = () => {
    if (confirm(`Delete initiative "${initiativeSlug}" and all its contents?`)) {
      deleteMutation.mutate(initiativeSlug, { onSuccess: onClearSelection });
    }
  };

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    createEntityMutation.mutate(
      { initiativeSlug, data: { name: newEntityName.trim() } },
      {
        onSuccess: (entity) => {
          setNewEntityName("");
          setShowForm(false);
          onSelect({ type: "entity", initiativeSlug, entitySlug: entity.slug });
        },
      }
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">
        {initiativeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </h2>
      <p className="text-sm text-zinc-400 mb-6">Initiative</p>

      <div className="mb-6">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>+ New Entity</Button>
        ) : (
          <form onSubmit={handleCreateEntity} className="flex gap-2">
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="Entity name..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
              autoFocus
            />
            <Button type="submit" disabled={createEntityMutation.isPending}>
              Create
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </form>
        )}
      </div>

      <Button variant="ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
        Delete Initiative
      </Button>
    </div>
  );
}
