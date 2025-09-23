// src/pages/_shared.js
// Central helpers for fetching rows and choosing the right label component
// (Inline Supabase client — no import from ../supabaseClient)

import { createClient } from "@supabase/supabase-js";

// 🔐 Direct credentials (you can move to env later)
const SUPABASE_URL = "https://buwiisnrenazeyjcmgmo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1d2lpc25yZW5hemV5amNtZ21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTcyNjksImV4cCI6MjA3NDAzMzI2OX0.L91mL0khI_v36egMn8DmYEL5s5uKTdb__LOacPcpAmA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Templates (make sure these files/exports exist)
import { Label_2x4_Goshudh } from "../templates/Label_2x4_Goshudh.jsx";
import { Label_3x4_Goshudh } from "../templates/Label_3x4_Goshudh.jsx";

/* ---------- STYLE CONSTANTS (inches) ---------- */
export const STYLE_2X4 = { style_code: "2x4in", width_in: 4, height_in: 2 };
export const STYLE_3X4 = { style_code: "3x4in", width_in: 4, height_in: 3 };

// exact-size panel style for preview/export container
export function exactPanelStyle(style) {
  return {
    width: `${style.width_in}in`,
    height: `${style.height_in}in`,
    background: "#fff",
    color: "#000",
    boxSizing: "border-box",
    overflow: "hidden",
  };
}

/* ---------- DATA LOADING (simple_labels) ---------- */

/**
 * Load all rows for a brand from public.simple_labels
 * @param {string} brand e.g. "Goshudh" | "Trinetra" | "Groshaat"
 * @returns {Promise<Array>} rows
 */
export async function loadBrandSimple(brand) {
  const { data, error } = await supabase
    .from("simple_labels")
    .select(
      `
      id, name, brand, style_code, batch_no,
      mrp, net_weight_g, shelf_life_months,
      pkd_on, use_by,
      calories, carbohydrates, fats, protein, cholesterol
    `
    )
    .eq("brand", brand)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

/* ---------- TEMPLATE PICKER ---------- */

/**
 * Decide which React component & size to use for a given row.
 * Uses row.style_code; defaults to 2x4 if missing/unknown.
 * @param {object} row  one record from simple_labels
 * @returns {{ Component: React.FC, style: {style_code:string,width_in:number,height_in:number}, style_code:string }}
 */
export function pickTemplate(row) {
  const code = String(row?.style_code || "").toLowerCase();

  if (code === "3x4" || code === "3x4in") {
    return { Component: Label_3x4_Goshudh, style: STYLE_3X4, style_code: "3x4in" };
  }

  // default / fallback
  return { Component: Label_2x4_Goshudh, style: STYLE_2X4, style_code: "2x4in" };
}

/* ---------- NORMALIZATION (optional) ---------- */
export function toTemplateData(row) {
  return {
    ...row,
    name: row?.name ?? "—",
    batch_no: row?.batch_no ?? "—",
    net_weight_g: row?.net_weight_g ?? null,
    mrp: row?.mrp ?? null,
    pkd_on: row?.pkd_on ?? null,
    use_by: row?.use_by ?? null,
    calories: row?.calories ?? "—",
    carbohydrates: row?.carbohydrates ?? "—",
    fats: row?.fats ?? "—",
    protein: row?.protein ?? "—",
    cholesterol: row?.cholesterol ?? "—",
  };
}

/* ---------- FILENAME HELPER ---------- */
export function buildFilename(row) {
  const code = (row?.style_code || "").replace(/[^\w-]/g, "");
  const nm = (row?.name || "label").replace(/\s+/g, "_");
  const bt = (row?.batch_no || "").replace(/[^\w-]/g, "");
  return `${row?.brand || "Brand"}_${nm}${bt ? "_" + bt : ""}_${code || "2x4in"}.pdf`;
}

/* ---------- COMPAT SHIMS FOR OLD PAGES ---------- */

/**
 * decideStyleCode: legacy helper kept so older pages (e.g. Trinetra.jsx) don’t break.
 * Accepts either a row object or a string code and returns '2x4in' or '3x4in'.
 */
export function decideStyleCode(input) {
  // If a row object was passed
  if (input && typeof input === "object" && input.style_code) {
    const c = String(input.style_code).toLowerCase();
    if (c.includes("3x4")) return "3x4in";
    if (c.includes("2x4")) return "2x4in";
  }
  // If a raw string code was passed
  if (typeof input === "string") {
    const c = input.toLowerCase();
    if (c.includes("3x4")) return "3x4in";
    if (c.includes("2x4")) return "2x4in";
  }
  // Fallback
  return "2x4in";
}

/**
 * sheetStyle: legacy alias to exactPanelStyle so pages that still import
 * sheetStyle keep working without changes.
 */
export function sheetStyle(style) {
  return exactPanelStyle(style);
}
