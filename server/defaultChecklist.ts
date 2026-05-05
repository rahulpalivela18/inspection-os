export const DEFAULT_CHECKLIST_POINTS: Array<{
  category: string;
  point: string;
  triggerOn?: "yes" | "no";
}> = [
  // Bedroom (repeats based on bedroom count)
  { category: "Bedroom", point: "Are all the room corners in right angle?" },
  { category: "Bedroom", point: "Are the butt filling grooves uniform?" },
  { category: "Bedroom", point: "Flooring (Tiles): Any colour & shade variation observed in floor tiles", triggerOn: "yes" },
  { category: "Bedroom", point: "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing", triggerOn: "yes" },
  { category: "Bedroom", point: "Electrical Work: Are fan regulators working smoothly in all directions" },
  { category: "Bedroom", point: "Electrical Work: Are all electrical switches functioning properly" },
  { category: "Bedroom", point: "Doors & Windows: Are doors and windows opening and closing smoothly" },
  { category: "Bedroom", point: "Doors & Windows: Are door/window handles and locks functioning properly" },

  // Bathroom (repeatable)
  { category: "Bathroom", point: "Flooring (Tiles): Are all the room corners in right angle?" },
  { category: "Bathroom", point: "Flooring (Tiles): Are the butt filling grooves uniform?" },
  { category: "Bathroom", point: "Flooring (Tiles): Any colour & shade variation observed in tiles", triggerOn: "yes" },
  { category: "Bathroom", point: "Plumbing: Is the water pressure adequate" },
  { category: "Bathroom", point: "Plumbing: Are all taps and fittings functioning properly" },
  { category: "Bathroom", point: "Plumbing: Is the drainage functioning properly without water logging" },
  { category: "Bathroom", point: "Sanitary Fixtures: Are all sanitary fixtures properly fixed" },
  { category: "Bathroom", point: "Waterproofing: Any seepage or dampness observed on walls/ceiling", triggerOn: "yes" },

  // Balcony (repeatable)
  { category: "Balcony", point: "Flooring (Tiles): Are all the room corners in right angle?" },
  { category: "Balcony", point: "Flooring (Tiles): Are the butt filling grooves uniform?" },
  { category: "Balcony", point: "Flooring (Tiles): Any colour & shade variation observed in floor tiles", triggerOn: "yes" },
  { category: "Balcony", point: "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing", triggerOn: "yes" },
  { category: "Balcony", point: "Safety Railing: Is the safety railing properly fixed and stable" },
  { category: "Balcony", point: "Drainage: Is the drainage slope adequate to avoid water stagnation" },

  // Common Area (non-repeatable)
  { category: "Common Area", point: "Electrical Work: Are fan regulators working smoothly in all directions" },
  { category: "Common Area", point: "Electrical Work: Are all electrical switches functioning properly" },
  { category: "Common Area", point: "Flooring: Any chipping or cracks observed in flooring" },
  { category: "Common Area", point: "Walls: Any dampness or seepage observed on walls", triggerOn: "yes" },
  { category: "Common Area", point: "Ceiling: Any dampness or seepage observed on ceiling", triggerOn: "yes" },
  { category: "Common Area", point: "Doors & Windows: Main door functioning properly with proper locks" },

  // External Area (non-repeatable)
  { category: "External Area", point: "Modular Kitchen & Kitchen Platform: Is the functioning of the modular furniture doors satisfactory" },
  { category: "External Area", point: "Modular Kitchen: Is the kitchen countertop free from chips and cracks", triggerOn: "yes" },
  { category: "External Area", point: "External Walls: Any cracks or dampness observed on external walls", triggerOn: "yes" },
  { category: "External Area", point: "Waterproofing: Any water seepage observed from terrace/external walls", triggerOn: "yes" },
];
