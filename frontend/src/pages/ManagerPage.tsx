import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SidebarTree } from "@/components/features/sidebar/SidebarTree";
import { DetailPanel } from "@/components/features/detail-panel/DetailPanel";
import { useCreateInitiative } from "@/services/initiativeApi";

export interface SelectedItem {
  type: "initiative" | "entity" | "feature" | "story";
  initiativeSlug: string;
  entitySlug?: string;
  featureSlug?: string;
  storyIndex?: number;
}

export function ManagerPage() {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showInitForm, setShowInitForm] = useState(false);
  const [initName, setInitName] = useState("");
  const createMutation = useCreateInitiative();

  const handleCreateInitiative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initName.trim()) return;
    createMutation.mutate(
      { name: initName.trim() },
      {
        onSuccess: (initiative) => {
          setInitName("");
          setShowInitForm(false);
          setSelectedItem({ type: "initiative", initiativeSlug: initiative.slug });
        },
      }
    );
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold mb-3">Initiative Manager</h1>
          {!showInitForm ? (
            <Button onClick={() => setShowInitForm(true)}>+ New Initiative</Button>
          ) : (
            <form onSubmit={handleCreateInitiative} className="flex gap-2">
              <input
                type="text"
                value={initName}
                onChange={(e) => setInitName(e.target.value)}
                placeholder="Initiative name..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                autoFocus
              />
              <Button type="submit" disabled={createMutation.isPending}>
                Create
              </Button>
              <Button variant="ghost" onClick={() => setShowInitForm(false)}>
                Cancel
              </Button>
            </form>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarTree selectedItem={selectedItem} onSelect={setSelectedItem} />
        </div>
      </aside>

      {/* Detail Panel */}
      <main className="flex-1 overflow-y-auto p-6">
        <DetailPanel
          selectedItem={selectedItem}
          onClearSelection={() => setSelectedItem(null)}
          onSelect={setSelectedItem}
        />
      </main>
    </div>
  );
}
