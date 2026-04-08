// src/templates/Label_3x3.jsx

export function Label_3x3({ data }) {
  if (!data) return null;

  const {
    name = "—",
    net_weight_g = "—",
    batch_no = "—",
    mrp = "—",
    use_by = "—",
    ingredients = "",
    calories = "0 Kcal",
    carbohydrates = "0g",
    fats = "0g",
    protein = "0g",
    cholesterol = "0g",
  } = data;

  const formatMonthYear = (date) =>
    date.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const formatMonthYearFromInput = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return formatMonthYear(d);
    return String(val);
  };

  const todayMY = formatMonthYear(new Date());
  const useByText = formatMonthYearFromInput(use_by);

  const BORDER = "0.5px solid #333";
  const td = {
    border: BORDER,
    padding: "5px 8px",
    lineHeight: 1.2,
    fontSize: "12px",
    verticalAlign: "middle",
  };

  const mrpText =
    mrp === undefined || mrp === null || mrp === "" || mrp === "—"
      ? "—"
      : `₹${Number(mrp).toFixed(2)}`;

  const batchShort = (batch_no || "—").toString().slice(0, 12);

  const formatWeight = (val) => {
    if (!val || val === "—") return "—";
    if (typeof val === "string") {
      const lower = val.toLowerCase();
      if (lower.includes("kg") || lower.includes("g")) return val;
      const num = parseFloat(val);
      if (!isNaN(num)) {
        return num >= 1000
          ? `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 2)}kg`
          : `${num}g`;
      }
      return val;
    }
    if (typeof val === "number") {
      return val >= 1000
        ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 2)}kg`
        : `${val}g`;
    }
    return "—";
  };

  return (
    <div
      style={{
        width: "3in",
        height: "3in",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "8px",
          boxSizing: "border-box",
          gap: "6px",
        }}
      >
        {/* Row 1: Ingredients */}
        <div
          style={{
            border: BORDER,
            padding: "3px 6px",
            fontSize: "10.5px",
            fontWeight: 600,
            whiteSpace: "normal",
            wordBreak: "break-word",
            textAlign: "left",
            lineHeight: 1.1,
          }}
        >
          Ingredients: {ingredients || name}
        </div>

        {/* Row 2: Nutritional Value */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              border: BORDER,
              borderBottom: "none",
              textAlign: "center",
              fontWeight: 800,
              fontSize: "13.5px",
              padding: "3px 0",
              backgroundColor: "transparent",
              color: "#000",
            }}
          >
            Nutritional Value
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 0",
              border: BORDER,
              borderBottom: "none",
              backgroundColor: "transparent",
              color: "#000",
            }}
          >
            Per 100g Approx
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              marginTop: 0,
            }}
          >
            <tbody>
              <tr>
                <td style={td}>Calories</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{calories}</td>
              </tr>
              <tr>
                <td style={td}>Carbohydrates</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{carbohydrates}</td>
              </tr>
              <tr>
                <td style={td}>Fats</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{fats}</td>
              </tr>
              <tr>
                <td style={td}>Protein</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{protein}</td>
              </tr>
              <tr>
                <td style={td}>Cholesterol</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{cholesterol}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Row 3: Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 6px 1fr",
            columnGap: "4px",
            rowGap: "2px",
            fontSize: "11px",
            fontWeight: 600,
            marginTop: "2px",
          }}
        >
          <div>Net Weight</div>
          <div>:</div>
          <div>{formatWeight(net_weight_g)}</div>

          <div>Batch No.</div>
          <div>:</div>
          <div>{batchShort}</div>

          <div style={{ lineHeight: 1 }}>
            MRP.
            <div style={{ fontSize: "8px", fontWeight: 400 }}>(Incl. of all taxes)</div>
          </div>
          <div>:</div>
          <div>{mrpText}</div>

          <div>Packed On</div>
          <div>:</div>
          <div>{todayMY}</div>

          <div>Use By</div>
          <div>:</div>
          <div>{useByText}</div>
        </div>
      </div>
    </div>
  );
}
