export function Label_3x4_Groshaat({ data }) {
  if (!data) return null;

  const {
    name = "—",
    net_weight_g,
    batch_no,
    mrp,
    use_by,
    ingredients,
    calories,
    carbohydrates,
    fats,
    protein,
    cholesterol,
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

  const BORDER = "1px solid #111";
  const td = {
    border: BORDER,
    padding: "2px 6px",
    lineHeight: 1.12,
    fontSize: "10px",
    verticalAlign: "middle",
  };

  const mrpText =
    mrp === undefined || mrp === null || mrp === ""
      ? "—"
      : `₹${Number(mrp).toFixed(2)}`;

  const batchShort = (batch_no || "—").toString().slice(0, 8);

  const formatWeight = (val) => {
    if (!val) return "—";
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

  const FSSAI_LOGO_H = 18;
  const FSSAI_NUM_FS = 9;
  const STORAGE_FS = 9.5;
  const SWACHH_H = 25;
  const DUSTBIN_H = 35;

  return (
    <div
      style={{
        width: "4in",
        height: "3in",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        padding: "8px 12px 4px 12px",
        display: "grid",
        gridTemplateRows: "auto 1fr auto auto",
        rowGap: "4px",
        overflow: "hidden",
      }}
    >
      {/* Header: Groshaat logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "6px",      // shifted logo down a bit
          marginBottom: "12px",  // gap below logo
        }}
      >
        <img
          src="/logos/Groshaat.png"
          alt="Groshaat"
          style={{ height: 34, objectFit: "contain" }}
        />
      </div>

      {/* Main 2-column area */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 1fr",
          columnGap: "10px",
          alignItems: "start",
        }}
      >
        {/* LEFT: Ingredients + Nutrition */}
        <div>
          <div
            style={{
              border: BORDER,
              padding: "4px 8px",
              fontWeight: 700,
              fontSize: 9.75,
              marginBottom: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
            }}
          >
            Ingredients: {ingredients || name}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              marginTop: "4px", // reduced gap here
            }}
          >
            <thead>
              <tr>
                <th
                  colSpan={2}
                  style={{
                    ...td,
                    background: "#000",
                    color: "#fff",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  NUTRITIONAL VALUE per 100g approx
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Calories</td>
                <td style={{ ...td, textAlign: "right" }}>{calories || "—"}</td>
              </tr>
              <tr>
                <td style={td}>Carbohydrates</td>
                <td style={{ ...td, textAlign: "right" }}>{carbohydrates || "—"}</td>
              </tr>
              <tr>
                <td style={td}>Fats</td>
                <td style={{ ...td, textAlign: "right" }}>{fats || "—"}</td>
              </tr>
              <tr>
                <td style={td}>Protein</td>
                <td style={{ ...td, textAlign: "right" }}>{protein || "—"}</td>
              </tr>
              <tr>
                <td style={td}>Cholestrol</td>
                <td style={{ ...td, textAlign: "right" }}>{cholesterol || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT: Facts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 6px 1fr",
            rowGap: 5,
            fontSize: 11,
          }}
        >
          <div style={{ fontWeight: 700 }}>Net Weight.</div>
          <div>:</div>
          <div>{formatWeight(net_weight_g)}</div>

          <div style={{ fontWeight: 700 }}>Batch No.</div>
          <div>:</div>
          <div>{batchShort}</div>

          <div style={{ fontWeight: 700 }}>MRP.</div>
          <div>:</div>
          <div>
            {mrpText}
            <div style={{ fontSize: 9 }}>(incl. of all taxes)</div>
          </div>

          <div style={{ fontWeight: 700 }}>Pkd On</div>
          <div>:</div>
          <div>{todayMY}</div>

          <div style={{ fontWeight: 700 }}>Use By</div>
          <div>:</div>
          <div>{useByText}</div>
        </div>
      </div>

      {/* Footer strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          alignItems: "center",
          justifyItems: "center",
          paddingTop: 2,
          columnGap: 12,
        }}
      >
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <img
            src="/logos/fassai.png"
            alt="FSSAI"
            style={{ height: FSSAI_LOGO_H, objectFit: "contain" }}
          />
          <div
            style={{
              fontWeight: 600,
              fontSize: FSSAI_NUM_FS,
              marginTop: 0,
            }}
          >
            10019013001901
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: STORAGE_FS,
            lineHeight: 1.1,
          }}
        >
          <div>Store in a</div>
          <div>cool &amp; dry place</div>
        </div>

        <img
          src="/logos/Swacch-Bharat-Black.png"
          alt="Swachh Bharat"
          style={{ height: SWACHH_H, objectFit: "contain" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            width: "100%",
            paddingLeft: "8px",
          }}
        >
          <img
            src="/logos/dustbin.png"
            alt="Dustbin"
            style={{ height: DUSTBIN_H, objectFit: "contain" }}
          />
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 10.5,
          marginTop: 2,
        }}
      >
        MFG &amp; Packed by : TRINETRA
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: 8.8,
          lineHeight: 1.2,
          padding: "0 14px",
          whiteSpace: "normal",
        }}
      >
        Plot No. 3B, Panch Vatika, Hawa sadak, Civil Lines, Jaipur-302006
        <br />
        Customer Care: 9773337333 | divinerocks2021@gmail.com
      </div>
    </div>
  );
}
