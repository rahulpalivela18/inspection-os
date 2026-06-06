import type { ChecklistItem } from "@/lib/store";
import { getSpaceCount } from "@/lib/defaultChecklist";

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

  const repeatableCategories = ["bedroom", "bathroom", "balcony"];
  const categorySet = Array.from(new Set(templates.map((t) => t.category)));

  for (const cat of categorySet) {
    const catTemplates = templates.filter((t) => t.category === cat);
    const catLower = cat.toLowerCase().trim();
    const isBuiltinRepeatable = repeatableCategories.includes(catLower);

    let count = 1;
    let isRepeatable = false;

    if (isBuiltinRepeatable) {
      count = getSpaceCount(spaceCounts, cat) || 1;
      isRepeatable = true;
    } else if (cat in spaceCounts) {
      count = spaceCounts[cat];
      isRepeatable = count > 0;
    }

    for (let i = 1; i <= count; i++) {
      const category = isRepeatable ? `${cat} ${i}` : cat;

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
