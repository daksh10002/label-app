// src/templates/Label_2x4_Goshudh.jsx
export function Label_2x4_Goshudh({ data }) {
  if (!data) return null;

  const {
    name,
    net_weight_g,
    batch_no,
    mrp,
    // pkd_on is ignored for display; we always show today's Month YYYY
    use_by,
    ingredients,
    calories,
    carbohydrates,
    fats,
    protein,
    cholesterol,
  } = data;

  // ---- Date helpers (Month YYYY) ----
  const formatMonthYear = (date) =>
    date.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const formatMonthYearFromInput = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return formatMonthYear(d);
    // if it's already like "September 2025" or any non-parseable string, show as-is
    return String(val);
  };

  const pkdOnText = formatMonthYear(new Date());       // always today
  const useByText = formatMonthYearFromInput(use_by);  // from row

  const mrpText =
    mrp === undefined || mrp === null || mrp === ""
      ? "—"
      : `₹${Number(mrp).toFixed(2)}`;

  const batchShort = (batch_no || "—").toString().slice(0, 8);

  const BORDER = "1px solid #111";
  const TD = {
    border: BORDER,
    padding: "2px 4px",
    lineHeight: 1.15,
    verticalAlign: "middle",
    fontSize: "10px",
  };

  return (
    <div
      style={{
        width: "4in",
        height: "2in",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        padding: "20px 20px 18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "none",
        overflow: "hidden",
      }}
    >
      {/* CONTENT */}
      <div
        style={{
          display: "grid",
          // Wider left column so Ingredients + table have more space
          gridTemplateColumns: "1.2fr 0.8fr",
          columnGap: "6px",
          flex: 1,
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              border: BORDER,
              padding: "3px 6px",
              fontWeight: 700,
              fontSize: "9.5px",
              lineHeight: 1.15,
              whiteSpace: "nowrap",   // keep on one line
              overflow: "hidden",
              textOverflow: "clip",
            }}
          >
            Ingredients:{" "}
            <span style={{ fontWeight: 700 }}>{ingredients || name || "—"}</span>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "3px",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: "58%" }} />
              <col style={{ width: "42%" }} />
            </colgroup>
            <thead>
              <tr>
                <th
                  colSpan={2}
                  style={{
                    ...TD,
                    background: "#000",
                    color: "#fff",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "9px",
                    whiteSpace: "nowrap",
                  }}
                >
                  NUTRITIONAL VALUE per 100g approx
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={TD}>Calories</td>
                <td style={{ ...TD, textAlign: "right" }}>{calories || "—"}</td>
              </tr>
              <tr>
                <td style={TD}>Carbohydrates</td>
                <td style={{ ...TD, textAlign: "right" }}>
                  {carbohydrates || "—"}
                </td>
              </tr>
              <tr>
                <td style={TD}>Fats</td>
                <td style={{ ...TD, textAlign: "right" }}>{fats || "—"}</td>
              </tr>
              <tr>
                <td style={TD}>Protein</td>
                <td style={{ ...TD, textAlign: "right" }}>{protein || "—"}</td>
              </tr>
              <tr>
                <td style={TD}>Cholesterol</td>
                <td style={{ ...TD, textAlign: "right" }}>
                  {cholesterol || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 6px 1fr",
            rowGap: "4px",
            fontSize: "10px",
            alignContent: "start",
          }}
        >
          <div style={{ fontWeight: 700 }}>Net Weight.</div>
          <div>:</div>
          <div>{net_weight_g ? `${net_weight_g}g` : "—"}</div>

          <div style={{ fontWeight: 700 }}>Batch No.</div>
          <div>:</div>
          <div>{batchShort}</div>

          {/* MRP row */}
          <div style={{ fontWeight: 700 }}>MRP.</div>
          <div>:</div>
          <div>{mrpText}</div>

          {/* Tax note as its own row, aligned under MRP label */}
          <div></div>
          <div></div>
          <div style={{ fontSize: "8px", marginTop: "-2px" }}>
            (incl. of all taxes)
          </div>

          <div style={{ fontWeight: 700 }}>Pkd On</div>
          <div>:</div>
          <div>{pkdOnText}</div>

          <div style={{ fontWeight: 700 }}>Use By</div>
          <div>:</div>
          <div>{useByText}</div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          fontSize: "8.5px",
          fontWeight: 700,
          lineHeight: 1.25,
          marginTop: "4px",
        }}
      >
        <div>
          Customer care: Plot No. 3B, Panch vatika, Hawa Sadak, Civil lines
          Jaipur-302006
        </div>
        <div>+91 9773337333 || customercare@goshudh.com</div>
      </div>
    </div>
  );
}
