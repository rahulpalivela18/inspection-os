import type {
  ChecklistItem,
  DimensionUnit,
  ReportDimension,
} from "@/lib/store";

export type ReportSpaceCounts = {
  bedrooms: number;
  bathrooms: number;
  balconies: number;
};

export const DEFAULT_SPACE_COUNTS: ReportSpaceCounts = {
  bedrooms: 1,
  bathrooms: 1,
  balconies: 1,
};

export const DEFAULT_DIMENSION_UNIT: DimensionUnit = "ft";

export const buildDimensionsFromChecklist = (
  checklist: ChecklistItem[] = [],
  existingDimensions: ReportDimension[] = [],
  defaultUnit: DimensionUnit = DEFAULT_DIMENSION_UNIT,
): ReportDimension[] => {
  const spaces = Array.from(new Set(checklist.map((item) => item.category)));
  const existingBySpace = new Map(existingDimensions.map((d) => [d.space, d]));

  return spaces.map((space, index) => {
    const existing = existingBySpace.get(space);
    return {
      id: existing?.id ?? `d${index + 1}`,
      space,
      spaceName: existing?.spaceName ?? space,
      length: existing?.length ?? "",
      width: existing?.width ?? "",
      unit: existing?.unit ?? defaultUnit,
      notes: existing?.notes ?? "",
    };
  });
};
