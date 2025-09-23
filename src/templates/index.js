// src/templates/index.js
import { Label_2x4_Goshudh } from "./Label_2x4_Goshudh.jsx";
import { Label_3x4_Goshudh } from "./Label_3x4_Goshudh.jsx";

// Add other brands’ components as you build them:
// import { Label_3x4_Trinetra } from "./Label_3x4_Trinetra.jsx";
// import { Label_3x4_Groshaat } from "./Label_3x4_Groshaat.jsx";
// import { Label_38x25_Jar } from "./Label_38x25_Jar.jsx";

export function getTemplateComponent(brand, labelSize) {
  const key = `${(brand || "").toLowerCase()}_${(labelSize || "").toLowerCase()}`;

  switch (key) {
    case "goshudh_2x4":
      return Label_2x4_Goshudh;
    case "goshudh_3x4":
      return Label_3x4_Goshudh;

    // Example wiring for others (uncomment when you have them):
    // case "trinetra_3x4": return Label_3x4_Trinetra;
    // case "groshaat_3x4": return Label_3x4_Groshaat;
    // case "common_38x25": return Label_38x25_Jar;

    default:
      // fallback to a safe template so preview never crashes
      return Label_2x4_Goshudh;
  }
}

export function sizeInchesFor(labelSize) {
  const code = (labelSize || "").toLowerCase();
  if (code === "3x4" || code === "4x3") return { widthIn: 4, heightIn: 3 };
  // default and "2x4"
  return { widthIn: 4, heightIn: 2 };
}
