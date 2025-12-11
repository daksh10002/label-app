// src/templates/Label_2x4_Goshudh_Combo.jsx
import React from "react";

export function Label_2x4_Goshudh_Combo({ data }) {
    if (!data) return null;

    const {
        comboUnitContent,
        comboNetWeight,
        comboMrp,
        packedOnMonth,
        packedOnYear,
    } = data;

    const BORDER = "1px solid #111";

    // Format price
    const mrpText =
        comboMrp === undefined || comboMrp === null
            ? "—"
            : `₹ ${Number(comboMrp).toFixed(2)}`;

    // Format packed on
    const packedOnText = `${packedOnMonth} ${packedOnYear}`;

    return (
        <div
            style={{
                width: "4in",
                height: "2in",
                background: "#fff",
                color: "#000",
                fontFamily: "Arial, Helvetica, sans-serif",
                boxSizing: "border-box",
                padding: "24px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "none",
                overflow: "hidden",
            }}
        >
            {/* MAIN CONTENT AREA */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.4in 10px 1fr",
                    rowGap: "2px",
                    fontSize: "20px",
                    lineHeight: "1.2",
                    alignContent: "start",
                }}
            >
                {/* Unit Content */}
                <div>Unit Content</div>
                <div>:</div>
                <div style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "18px"
                }}>
                    {comboUnitContent}
                </div>

                {/* Net Weight */}
                <div>Net Weight</div>
                <div>:</div>
                <div>{comboNetWeight}</div>

                {/* Packed On */}
                <div>Packed On</div>
                <div>:</div>
                <div>{packedOnText}</div>

                {/* Combo Mrp */}
                <div>Combo Mrp</div>
                <div>:</div>
                <div>{mrpText}</div>

                {/* Tax Note (small under MRP) */}
                <div />
                <div />
                <div style={{ fontSize: "10px", marginTop: "-2px" }}>(Inclusive of all taxes)</div>
            </div>

            {/* FOOTER */}
            <div
                style={{
                    fontSize: "9px",
                    fontWeight: 500,
                    lineHeight: 1.3,
                    marginTop: "auto",
                }}
            >
                <div style={{ fontWeight: "bold" }}>MFG & Packed by : TRINETRA</div>
                <div>
                    Plot No. 3B, Panch Vatika, Hawa sadak, Civil Lines, Jaipur-302006
                </div>
                <div style={{ marginTop: "2px" }}>
                    Customer Care: 9773337333 • customercare@goshudh.com • www.goshudh.com
                </div>
            </div>
        </div>
    );
}
