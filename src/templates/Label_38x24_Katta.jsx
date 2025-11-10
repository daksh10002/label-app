// src/templates/Label_38x24_Katta.jsx
// Small MRP sticker for katta packs – size 38mm × 24mm
// All text is bold

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
];

function formatMonthAbbrYear(date) {
  return `${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;
}

function formatFromInput(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (!Number.isNaN(d.getTime())) return formatMonthAbbrYear(d);
  return String(val);
}

function moneyINR(m) {
  if (m === undefined || m === null || m === "") return "—";
  const n = Number(m);
  if (Number.isNaN(n)) return String(m);
  return `₹ ${n.toFixed(2)}`;
}

// ✅ Smart weight formatter (g ↔ kg)
function formatWeight(w) {
  if (!w && w !== 0) return "—";
  if (typeof w === "string" && w.toLowerCase().includes("kg")) return w;
  const num = Number(w);
  if (isNaN(num)) return w;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 2)}kg`;
  }
  return `${num}g`;
}

// ---- Single sticker (38×24 mm) ----
export function Label_38x24_Katta({ data }) {
  if (!data) return null;

  const {
    mrp,
    batch_no,
    net_weight_g,
    // pkd_on ignored (always today)
    use_by,
  } = data ?? {};

  const todayText = formatMonthAbbrYear(new Date());
  const useByText = formatFromInput(use_by);

  const cellLabel = { fontWeight: 700, paddingRight: "3px", whiteSpace: "nowrap" };
  const cellColon = { paddingRight: "2px", width: "6px", fontWeight: 700 };
  const cellValue = { whiteSpace: "nowrap", fontWeight: 700 };

  return (
    <div
      style={{
        width: "38mm",
        height: "24mm", // ↓ slightly smaller than Jar
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, sans-serif",
        fontSize: "9px",
        fontWeight: 700,
        padding: "2mm",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          lineHeight: 1.1,
        }}
      >
        <tbody>
          <tr>
            <td style={cellLabel}>Weight</td>
            <td style={cellColon}>:</td>
            <td style={cellValue}>{formatWeight(net_weight_g)}</td>
          </tr>

          <tr>
            <td style={cellLabel}>Batch No</td>
            <td style={cellColon}>:</td>
            <td style={cellValue}>{batch_no || "—"}</td>
          </tr>

          <tr>
            <td style={cellLabel}>Packed On</td>
            <td style={cellColon}>:</td>
            <td style={cellValue}>{todayText}</td>
          </tr>

          <tr>
            <td style={cellLabel}>Use By</td>
            <td style={cellColon}>:</td>
            <td style={cellValue}>{useByText}</td>
          </tr>

          <tr>
            <td style={cellLabel}>MRP</td>
            <td style={cellColon}>:</td>
            <td style={cellValue}>{moneyINR(mrp)}</td>
          </tr>

          <tr>
            <td colSpan={3} style={{ fontSize: "8px", paddingTop: "1px", fontWeight: 700 }}>
              (incl. of all taxes)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---- Two-up (side-by-side) wrapper ----
export function Label_38x24_KattaPair({ data }) {
  const GAP_MM = 2;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38mm 38mm",
        gap: `${GAP_MM}mm`,
        width: `calc(76mm + ${GAP_MM}mm)`,
        height: "24mm",
        background: "transparent",
      }}
    >
      <Label_38x24_Katta data={data} />
      <Label_38x24_Katta data={data} />
    </div>
  );
}

// ---- Dummy test values ----
export const dummyKattaData = {
  mrp: 920,
  batch_no: "KT-2025",
  net_weight_g: 500,
  use_by: "2026-04-01", // will show "Apr 2026"
};

// For quick preview in dev (optional)
export function Label_38x24_KattaPreview() {
  return <Label_38x24_Katta data={dummyKattaData} />;
}
