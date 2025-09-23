// src/templates/Label_38x25_Jar.jsx
// Small MRP sticker for jars – size 38mm × 25mm
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

// ---- Single sticker (38×25 mm) ----
export function Label_38x25_Jar({ data }) {
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
        height: "25mm",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, sans-serif",
        fontSize: "9px",
        fontWeight: 700, // make entire label bold by default
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
          lineHeight: 1.2,
        }}
      >
        <tbody>
          <tr>
            <td style={cellLabel}>Weight</td>
            <td style={cellColon}>:</td>
            <td style={cellValue}>{net_weight_g ? `${net_weight_g}g` : "—"}</td>
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
export function Label_38x25_JarPair({ data }) {
  const GAP_MM = 2;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38mm 38mm",
        gap: `${GAP_MM}mm`,
        width: `calc(76mm + ${GAP_MM}mm)`,
        height: "25mm",
        background: "transparent",
      }}
    >
      <Label_38x25_Jar data={data} />
      <Label_38x25_Jar data={data} />
    </div>
  );
}

// ---- Dummy test values ----
export const dummyJarData = {
  mrp: 890,
  batch_no: "GS-439",
  net_weight_g: 250,
  use_by: "2026-03-01", // will show "Mar 2026"
};

// For quick preview in dev (optional)
export function Label_38x25_JarPreview() {
  return <Label_38x25_Jar data={dummyJarData} />;
}
