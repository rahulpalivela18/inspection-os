import type { ChecklistItem, DimensionUnit, ReportDimension } from "@/lib/store";

export type ReportSpaceCounts = {
  bedrooms: number;
  bathrooms: number;
  balconies: number;
};

export const DEFAULT_CHECKLIST_NAME = "Client Master Inspection Checklist";

export const DEFAULT_SPACE_COUNTS: ReportSpaceCounts = {
  bedrooms: 1,
  bathrooms: 1,
  balconies: 1,
};

type ChecklistCategoryTemplate = {
  key: string;
  label: string;
  repeatable: boolean;
  points: string[];
};

export const CHECKLIST_CATEGORY_TEMPLATES: ChecklistCategoryTemplate[] = [
  {
    key: "balcony",
    label: "Balcony",
    repeatable: true,
    points: [
      "Flooring (Tiles): Are all the room corners in right angle?",
      "Flooring (Tiles): Are the butt filling grooves uniform?",
      "Flooring (Tiles): Any colour & shade variation observed in floor tiles",
      "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing",
    ],
  },
  {
    key: "bathroom",
    label: "Bathroom",
    repeatable: true,
    points: [
      "Flooring (Tiles): Are all the room corners in right angle?",
      "Flooring (Tiles): Are the butt filling grooves uniform?",
    ],
  },
  {
    key: "bedroom",
    label: "Bedroom",
    repeatable: true,
    points: [
      "Are all the room corners in right angle?",
      "Are the butt filling grooves uniform?",
    ],
  },
  {
    key: "common-area",
    label: "Common Area",
    repeatable: false,
    points: [
      "Electrical Work: Are fan regulators working smoothly in all directions",
    ],
  },
  {
    key: "external-area",
    label: "External Area",
    repeatable: false,
    points: [
      "Modular Kitchen & Kitchen Platform: Is the functioning of the modular furniture doors satisfactory",
    ],
  },
];

const toSafeCount = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

export const buildChecklistFromCounts = (
  counts: ReportSpaceCounts = DEFAULT_SPACE_COUNTS
): ChecklistItem[] => {
  const normalizedCounts: ReportSpaceCounts = {
    bedrooms: toSafeCount(counts.bedrooms),
    bathrooms: toSafeCount(counts.bathrooms),
    balconies: toSafeCount(counts.balconies),
  };

  let runningId = 1;

  const makeItems = (category: string, points: string[], failOn: "Y" | "N" = "N") =>
    points.map((point) => ({
      id: `c${runningId++}`,
      category,
      point,
      status: null,
      failOn,
    }));

  return CHECKLIST_CATEGORY_TEMPLATES.flatMap((template) => {
    if (template.repeatable) {
      const count =
        template.key === "bedroom"
          ? normalizedCounts.bedrooms
          : template.key === "bathroom"
            ? normalizedCounts.bathrooms
            : normalizedCounts.balconies;

      return Array.from({ length: count }, (_, index) =>
        makeItems(`${template.label} ${index + 1}`, template.points)
      ).flat();
    }

    return makeItems(template.label, template.points);
  });
};

type WorkspaceTemplate = {
  id: string;
  category: string;
  point: string;
  isRepeatable: boolean;
  spaceType?: string | null;
  failOn?: string | null;
  order: number;
};

const SPACE_TYPE_ORDER: Array<{ spaceType: string; label: string; countKey: keyof ReportSpaceCounts }> = [
  { spaceType: "bedroom", label: "Bedroom", countKey: "bedrooms" },
  { spaceType: "bathroom", label: "Bathroom", countKey: "bathrooms" },
  { spaceType: "balcony", label: "Balcony", countKey: "balconies" },
];

export const buildChecklistFromWorkspaceTemplates = (
  templates: WorkspaceTemplate[],
  counts: ReportSpaceCounts = DEFAULT_SPACE_COUNTS
): ChecklistItem[] => {
  const normalizedCounts: ReportSpaceCounts = {
    bedrooms: toSafeCount(counts.bedrooms),
    bathrooms: toSafeCount(counts.bathrooms),
    balconies: toSafeCount(counts.balconies),
  };

  const sorted = [...templates].sort((a, b) => a.order - b.order);
  let runningId = 1;
  const result: ChecklistItem[] = [];

  const repeatableBySpaceType: Record<string, WorkspaceTemplate[]> = {};
  const nonRepeatable: WorkspaceTemplate[] = [];

  for (const tmpl of sorted) {
    if (tmpl.isRepeatable && tmpl.spaceType) {
      if (!repeatableBySpaceType[tmpl.spaceType]) repeatableBySpaceType[tmpl.spaceType] = [];
      repeatableBySpaceType[tmpl.spaceType].push(tmpl);
    } else {
      nonRepeatable.push(tmpl);
    }
  }

  for (const { spaceType, label, countKey } of SPACE_TYPE_ORDER) {
    const items = repeatableBySpaceType[spaceType] ?? [];
    const count = normalizedCounts[countKey];
    for (let i = 1; i <= count; i++) {
      for (const tmpl of items) {
        result.push({
          id: `c${runningId++}`,
          category: `${label} ${i}`,
          point: tmpl.point,
          status: null,
          failOn: (tmpl.failOn === "Y" || tmpl.failOn === "N") ? tmpl.failOn : "N",
        });
      }
    }
  }

  const seenCategories = new Set<string>();
  const nonRepeatableOrdered: WorkspaceTemplate[] = [];
  for (const tmpl of nonRepeatable) {
    if (!seenCategories.has(tmpl.category)) seenCategories.add(tmpl.category);
    nonRepeatableOrdered.push(tmpl);
  }

  for (const tmpl of nonRepeatableOrdered) {
    result.push({
      id: `c${runningId++}`,
      category: tmpl.category,
      point: tmpl.point,
      status: null,
      failOn: (tmpl.failOn === "Y" || tmpl.failOn === "N") ? tmpl.failOn : "N",
    });
  }

  return result;
};

export const DEFAULT_DIMENSION_UNIT: DimensionUnit = "ft";

export const buildDimensionsFromChecklist = (
  checklist: ChecklistItem[] = [],
  existingDimensions: ReportDimension[] = [],
  defaultUnit: DimensionUnit = DEFAULT_DIMENSION_UNIT
): ReportDimension[] => {
  const spaces = Array.from(new Set(checklist.map((item) => item.category)));
  const existingBySpace = new Map(existingDimensions.map((dimension) => [dimension.space, dimension]));

  return spaces.map((space, index) => {
    const existing = existingBySpace.get(space);

    return {
      id: existing?.id ?? `d${index + 1}`,
      space,
      length: existing?.length ?? "",
      width: existing?.width ?? "",
      unit: existing?.unit ?? defaultUnit,
      notes: existing?.notes ?? "",
    };
  });
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = buildChecklistFromCounts(DEFAULT_SPACE_COUNTS);
