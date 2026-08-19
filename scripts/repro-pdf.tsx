import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import CapturePDF from "../client/src/components/CapturePDF";

const capture = {
  projectTitle: "Sky Lounge",
  title: "Rahul",
  imageUrl:
    "https://storage.googleapis.com/reportgen-images-rahul/1781932994059-b2fb844c-checklist_c305.jpg",
  imageWidth: 1200,
  imageHeight: 800,
  totalCaptures: 1,
  pins: [
    { id: "e5cbbc4b", number: 1, label: "Unsealed joint", x: 0.8, y: 0.3, severity: "Info", status: "Open" },
    { id: "da0df652", number: 2, label: "Crack in plaster", x: 0.3, y: 0.7, severity: "Minor", status: "Open" },
    { id: "d08c51e2", number: 3, label: "Water stain on ceiling", x: 0.5, y: 0.5, severity: "Major", status: "Open" },
  ],
};

const cover = {
  projectTitle: "Sky Lounge",
  totalCaptures: 1,
  totalHotspots: 3,
  severityBreakdown: [
    { severity: "Major", count: 1 },
    { severity: "Cosmetic", count: 0 },
    { severity: "Minor", count: 1 },
    { severity: "Info", count: 1 },
  ],
  statusBreakdown: [{ status: "Open", count: 3 }],
};

const out = process.argv[2] || "/tmp/repro.pdf";
await renderToFile(
  React.createElement(CapturePDF, { captures: [capture], cover }),
  out
);
console.log("wrote", out);
