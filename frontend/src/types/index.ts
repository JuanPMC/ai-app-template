// Status values for features and stories
export type Status = "draft" | "active" | "in_progress" | "done" | "completed" | "archived";

// ── Initiatives ─────────────────────────────────────────────────────

export interface Initiative {
  slug: string;
  name: string;
  entity_count: number;
}

export interface InitiativeCreate {
  name: string;
}

// ── Entities ────────────────────────────────────────────────────────

export interface Entity {
  slug: string;
  initiative_slug: string;
  name: string;
  feature_count: number;
}

export interface EntityCreate {
  name: string;
}

// ── Features ────────────────────────────────────────────────────────

export interface GherkinStep {
  keyword: "Given" | "When" | "Then" | "And" | "But";
  text: string;
}

export interface Feature {
  slug: string;
  initiative_slug: string;
  entity_slug: string;
  title: string;
  description: string;
  status: Status;
  entry: string | null;
  usecase: string | null;
  initiative_tag: string | null;
  integration: string | null;
  stories: Story[];
}

export interface FeatureCreate {
  title: string;
  description?: string;
  status?: Status;
  entry?: string;
  usecase?: string;
  initiative_tag?: string;
  integration?: string;
}

export interface FeatureUpdate {
  title?: string;
  description?: string;
  status?: Status;
  entry?: string;
  usecase?: string;
  initiative_tag?: string;
  integration?: string;
}

export interface FeatureBrief {
  slug: string;
  title: string;
  status: Status;
  story_count: number;
  entry: string | null;
  usecase: string | null;
}

// ── Stories (Scenarios) ─────────────────────────────────────────────

export interface Story {
  index: number;
  title: string;
  status: Status;
  steps: GherkinStep[];
}

export interface StoryCreate {
  title: string;
  steps?: GherkinStep[];
  status?: Status;
}

export interface StoryUpdate {
  title?: string;
  steps?: GherkinStep[];
  status?: Status;
}

export interface StoryBrief {
  index: number;
  title: string;
  status: Status;
}

// ── Tree (sidebar hierarchy) ────────────────────────────────────────

export interface FeatureTree {
  slug: string;
  title: string;
  status: Status;
  entry: string | null;
  usecase: string | null;
  story_count: number;
  stories: StoryBrief[];
}

export interface EntityTree {
  slug: string;
  name: string;
  feature_count: number;
  features: FeatureTree[];
}

export interface InitiativeTree {
  slug: string;
  name: string;
  entity_count: number;
  entities: EntityTree[];
}
