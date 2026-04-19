export const DEFAULT_CHECKLIST_POINTS: Array<{
  category: string;
  point: string;
  isRepeatable: boolean;
  spaceType?: string;
}> = [
  // Bedroom (repeatable)
  { category: "Bedroom", point: "Are all the room corners in right angle?", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Are the butt filling grooves uniform?", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Flooring (Tiles): Any colour & shade variation observed in floor tiles", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Electrical Work: Are fan regulators working smoothly in all directions", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Electrical Work: Are all electrical switches functioning properly", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Doors & Windows: Are doors and windows opening and closing smoothly", isRepeatable: true, spaceType: "bedroom" },
  { category: "Bedroom", point: "Doors & Windows: Are door/window handles and locks functioning properly", isRepeatable: true, spaceType: "bedroom" },

  // Bathroom (repeatable)
  { category: "Bathroom", point: "Flooring (Tiles): Are all the room corners in right angle?", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Flooring (Tiles): Are the butt filling grooves uniform?", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Flooring (Tiles): Any colour & shade variation observed in tiles", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Plumbing: Is the water pressure adequate", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Plumbing: Are all taps and fittings functioning properly", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Plumbing: Is the drainage functioning properly without water logging", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Sanitary Fixtures: Are all sanitary fixtures properly fixed", isRepeatable: true, spaceType: "bathroom" },
  { category: "Bathroom", point: "Waterproofing: Any seepage or dampness observed on walls/ceiling", isRepeatable: true, spaceType: "bathroom" },

  // Balcony (repeatable)
  { category: "Balcony", point: "Flooring (Tiles): Are all the room corners in right angle?", isRepeatable: true, spaceType: "balcony" },
  { category: "Balcony", point: "Flooring (Tiles): Are the butt filling grooves uniform?", isRepeatable: true, spaceType: "balcony" },
  { category: "Balcony", point: "Flooring (Tiles): Any colour & shade variation observed in floor tiles", isRepeatable: true, spaceType: "balcony" },
  { category: "Balcony", point: "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing", isRepeatable: true, spaceType: "balcony" },
  { category: "Balcony", point: "Safety Railing: Is the safety railing properly fixed and stable", isRepeatable: true, spaceType: "balcony" },
  { category: "Balcony", point: "Drainage: Is the drainage slope adequate to avoid water stagnation", isRepeatable: true, spaceType: "balcony" },

  // Common Area (non-repeatable)
  { category: "Common Area", point: "Electrical Work: Are fan regulators working smoothly in all directions", isRepeatable: false },
  { category: "Common Area", point: "Electrical Work: Are all electrical switches functioning properly", isRepeatable: false },
  { category: "Common Area", point: "Flooring: Any chipping or cracks observed in flooring", isRepeatable: false },
  { category: "Common Area", point: "Walls: Any dampness or seepage observed on walls", isRepeatable: false },
  { category: "Common Area", point: "Ceiling: Any dampness or seepage observed on ceiling", isRepeatable: false },
  { category: "Common Area", point: "Doors & Windows: Main door functioning properly with proper locks", isRepeatable: false },

  // External Area (non-repeatable)
  { category: "External Area", point: "Modular Kitchen & Kitchen Platform: Is the functioning of the modular furniture doors satisfactory", isRepeatable: false },
  { category: "External Area", point: "Modular Kitchen: Is the kitchen countertop free from chips and cracks", isRepeatable: false },
  { category: "External Area", point: "External Walls: Any cracks or dampness observed on external walls", isRepeatable: false },
  { category: "External Area", point: "Waterproofing: Any water seepage observed from terrace/external walls", isRepeatable: false },
];
