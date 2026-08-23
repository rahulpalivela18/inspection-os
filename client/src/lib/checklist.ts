import type { ChecklistItem } from "@/lib/store";

export function buildChecklistWithPreservedResponses(
  templates: Array<{
    category: string;
    point: string;
    triggerOn?: "yes" | "no";
  }>,
  currentChecklist: ChecklistItem[] = [],
  spaceCounts: Record<string, number> = {},
): ChecklistItem[] {
  const preservedItems = new Map(
    currentChecklist.map((item) => [`${item.category}:::${item.point}`, item]),
  );

  const items: ChecklistItem[] = [];
  let runningId = currentChecklist.length;

  const categorySet = Array.from(new Set(templates.map((t) => t.category)));

  for (const cat of categorySet) {
    const catTemplates = templates.filter((t) => t.category === cat);
    const count = cat in spaceCounts ? spaceCounts[cat] : 1;
    if (count <= 0) continue;

    for (let i = 1; i <= count; i++) {
      const category = count > 1 ? `${cat} ${i}` : cat;

      for (const template of catTemplates) {
        const key = `${category}:::${template.point}`;
        const existing = preservedItems.get(key);

        if (existing) {
          items.push({ ...existing, triggerOn: template.triggerOn ?? "no" });
        } else {
          items.push({
            id: `c${++runningId}`,
            category,
            point: template.point,
            status: null,
            triggerOn: template.triggerOn ?? "no",
          });
        }
      }
    }
  }

  return items;
}
