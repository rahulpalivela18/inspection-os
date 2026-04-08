import type { ChecklistItem } from "@/lib/store";

export const DEFAULT_CHECKLIST_NAME = "Client Master Inspection Checklist";

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "c1", category: "BALCONY", point: "Flooring (Tiles): Are all the room corners in right angle?", status: null },
  { id: "c2", category: "BALCONY", point: "Flooring (Tiles): Are the Butt filling grooves uniform?", status: null },
  { id: "c3", category: "BALCONY", point: "Flooring (Tiles): Any colour & shade variation observed in floor tiles", status: null },
  { id: "c4", category: "BALCONY", point: "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing", status: null },
  { id: "c5", category: "BATHROOM", point: "Flooring (Tiles): Are all the room corners in right angle?", status: null },
  { id: "c6", category: "BATHROOM", point: "Flooring (Tiles): Are the Butt filling grooves uniform?", status: null },
  { id: "c7", category: "BEDROOM", point: "Are all the room corners in right angle?", status: null },
  { id: "c8", category: "BEDROOM", point: "Are the Butt filling grooves uniform?", status: null },
  { id: "c9", category: "Common area", point: "Electrical Work: Are fan regulators working smoothly in all directions", status: null },
  { id: "c10", category: "EXTERNAL AREA", point: "Modular Kitchen & Kitchen Platform: Is the functioning of the modular furniture doors satisfactory", status: null },
];
