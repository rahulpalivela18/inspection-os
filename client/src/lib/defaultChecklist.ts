import type { ChecklistItem } from "@/lib/store";

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

  const makeItems = (category: string, points: string[]) =>
    points.map((point) => ({
      id: `c${runningId++}`,
      category,
      point,
      status: null,
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

export const DEFAULT_CHECKLIST: ChecklistItem[] = buildChecklistFromCounts(DEFAULT_SPACE_COUNTS);
