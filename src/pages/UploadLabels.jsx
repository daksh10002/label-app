import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconCheck, IconUpload, IconAlertTriangle } from "@tabler/icons-react";
import Papa from "papaparse";
import { supabase } from "../supabaseClient.js";

// --- CONFIG YOU CAN TWEAK ---
const ALLOWED_BRANDS = ["Goshudh", "Trinetra", "Groshaat"];
// The style_code values your app uses
const ALLOWED_STYLE_CODES = ["2x4in", "3x4in", "38x25mm","38x24mm"];

// Columns we accept for CSV bulk upload (order not required, header names must match)
const CSV_COLUMNS = [
  "name",
  "brand",
  "batch_no",
  "mrp",
  "net_weight_g",
  "shelf_life_months", // months; pkd_on auto (today on DB or computed)
  "style_code",        // one of ALLOWED_STYLE_CODES
  "ingredients",
  "calories",
  "carbohydrates",
  "fats",
  "protein",
  "cholesterol",
];

// Utility: coerce number or return null if empty/invalid
function toNumOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Trim strings; allow nulls
function toStrOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// Validate a single row for the DB schema
function validateRow(row, indexForMsg = null) {
  const errors = [];

  const name = toStrOrNull(row.name);
  if (!name) errors.push("name is required");

  const brand = toStrOrNull(row.brand);
  if (!brand || !ALLOWED_BRANDS.includes(brand))
    errors.push(`brand must be one of ${ALLOWED_BRANDS.join(", ")}`);

  const batch_no = toStrOrNull(row.batch_no);
  if (!batch_no) errors.push("batch_no is required");

  const mrp = toNumOrNull(row.mrp);
  if (row.mrp !== undefined && row.mrp !== null && row.mrp !== "" && mrp === null) {
    errors.push("mrp must be a number");
  }

  const net_weight_g = toNumOrNull(row.net_weight_g);
  if (net_weight_g === null) errors.push("net_weight_g must be a number");

  const shelf_life_months = toNumOrNull(row.shelf_life_months ?? 6);
  if (shelf_life_months === null) errors.push("shelf_life_months must be a number");

  const style_code = toStrOrNull(row.style_code);
  if (!style_code || !ALLOWED_STYLE_CODES.includes(style_code)) {
    errors.push(`style_code must be one of ${ALLOWED_STYLE_CODES.join(", ")}`);
  }

  const errMsg =
    errors.length > 0
      ? (indexForMsg !== null ? `Row ${indexForMsg + 1}: ` : "") + errors.join("; ")
      : null;

  return {
    ok: errors.length === 0,
    errors,
    errMsg,
    sanitized: {
      name,
      brand,
      batch_no,
      mrp,
      net_weight_g,
      shelf_life_months,
      style_code,
      // optional text fields; DB accepts text
      ingredients: toStrOrNull(row.ingredients),
      calories: toStrOrNull(row.calories),
      carbohydrates: toStrOrNull(row.carbohydrates),
      fats: toStrOrNull(row.fats),
      protein: toStrOrNull(row.protein),
      cholesterol: toStrOrNull(row.cholesterol),
      // pkd_on: let DB default (today/first-of-month per your server logic)
      // use_by: computed server-side/trigger or function (recommended)
    },
  };
}

export default function UploadLabels() {
  // Single
  const [sName, setSName] = useState("");
  const [sBrand, setSBrand] = useState(null);
  const [sBatch, setSBatch] = useState("");
  const [sMrp, setSMrp] = useState(null);
  const [sWeight, setSWeight] = useState(null);
  const [sLife, setSLife] = useState(6);
  const [sStyle, setSStyle] = useState(null);
  const [sIngr, setSIngr] = useState("");
  const [sCal, setSCal] = useState("");
  const [sCarb, setSCarb] = useState("");
  const [sFat, setSFat] = useState("");
  const [sProt, setSProt] = useState("");
  const [sChol, setSChol] = useState("");

  const [singleBusy, setSingleBusy] = useState(false);
  const [singleMsg, setSingleMsg] = useState(null);

  // Bulk
  const [file, setFile] = useState(null);
  const [bulkRows, setBulkRows] = useState([]); // parsed raw objects
  const [bulkPreview, setBulkPreview] = useState([]); // sanitized rows ready for insert
  const [bulkErrors, setBulkErrors] = useState([]); // array of strings
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState(null);

  // CSV template as a downloadable text (for convenience)
  const csvTemplate = useMemo(() => {
    const ex = [{
      name: "Pearl Millet Porridge",
      brand: "Goshudh",
      batch_no: "GS-0001",
      mrp: 199,
      net_weight_g: 250,
      shelf_life_months: 6,
      style_code: "3x4in",
      ingredients: "PEARL MILLET PORRIDGE",
      calories: "—",
      carbohydrates: "—",
      fats: "—",
      protein: "—",
      cholesterol: "—",
    }];
    return Papa.unparse(ex, { columns: CSV_COLUMNS });
  }, []);

  // ---------- Single submit ----------
  async function submitSingle() {
    setSingleMsg(null);

    const { ok, errMsg, sanitized } = validateRow(
      {
        name: sName,
        brand: sBrand,
        batch_no: sBatch,
        mrp: sMrp,
        net_weight_g: sWeight,
        shelf_life_months: sLife,
        style_code: sStyle,
        ingredients: sIngr,
        calories: sCal,
        carbohydrates: sCarb,
        fats: sFat,
        protein: sProt,
        cholesterol: sChol,
      },
      null
    );

    if (!ok) {
      setSingleMsg({ type: "error", text: errMsg });
      return;
    }

    setSingleBusy(true);
    const { data, error } = await supabase.from("simple_labels").insert(sanitized).select("id").single();
    setSingleBusy(false);

    if (error) {
      setSingleMsg({ type: "error", text: error.message });
    } else {
      setSingleMsg({ type: "success", text: `Inserted ✔ (id: ${data.id})` });
      // Optional: clear form
      // setSName(""); setSBrand(null); setSBatch(""); setSMrp(null);
      // setSWeight(null); setSLife(6); setSStyle(null);
      // setSIngr(""); setSCal(""); setSCarb(""); setSFat(""); setSProt(""); setSChol("");
    }
  }

  // ---------- Bulk parse ----------
  function parseCsv(f) {
    setBulkRows([]);
    setBulkPreview([]);
    setBulkErrors([]);
    setBulkMsg(null);

    if (!f) return;

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data || [];
        setBulkRows(rows);

        const preview = [];
        const errs = [];
        rows.forEach((row, idx) => {
          const { ok, errMsg, sanitized } = validateRow(row, idx);
          if (ok) preview.push(sanitized);
          else errs.push(errMsg);
        });

        setBulkPreview(preview);
        setBulkErrors(errs);
      },
      error: (err) => {
        setBulkErrors([`CSV parse error: ${err.message}`]);
      },
    });
  }

  // ---------- Bulk upload ----------
  async function uploadBulk() {
    if (!bulkPreview.length) {
      setBulkMsg({ type: "error", text: "No valid rows to upload." });
      return;
    }
    setBulkBusy(true);
    const { data, error } = await supabase.from("simple_labels").insert(bulkPreview).select("id");
    setBulkBusy(false);

    if (error) {
      setBulkMsg({ type: "error", text: error.message });
    } else {
      setBulkMsg({ type: "success", text: `Inserted ${data.length} row(s) ✔` });
      setFile(null);
      setBulkRows([]);
      setBulkPreview([]);
      setBulkErrors([]);
    }
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Upload Labels</Title>
        <Text c="dimmed">
          Insert records into <Badge color="blue" variant="light">simple_labels</Badge>.  
          Use <strong>Single</strong> for quick entries, or <strong>Bulk</strong> to import a CSV with preview + validation.
        </Text>

        <Tabs defaultValue="single" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="single" leftSection={<IconUpload size={16} />}>
              Single
            </Tabs.Tab>
            <Tabs.Tab value="bulk" leftSection={<IconUpload size={16} />}>
              Bulk (CSV)
            </Tabs.Tab>
          </Tabs.List>

          {/* ---------------- Single tab ---------------- */}
          <Tabs.Panel value="single" pt="md">
            <Paper withBorder p="md" radius="md">
              <Stack gap="sm">
                <Group grow>
                  <TextInput
                    label="Name"
                    placeholder="Product name"
                    value={sName}
                    onChange={(e) => setSName(e.currentTarget.value)}
                    required
                  />
                  <Select
                    label="Brand"
                    placeholder="Select brand"
                    data={ALLOWED_BRANDS}
                    value={sBrand}
                    onChange={setSBrand}
                    searchable
                    required
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label="Batch No."
                    placeholder="e.g., GS-0001"
                    value={sBatch}
                    onChange={(e) => setSBatch(e.currentTarget.value)}
                    required
                  />
                  <NumberInput
                    label="MRP (₹)"
                    placeholder="e.g., 199"
                    value={sMrp}
                    onChange={setSMrp}
                    min={0}
                    step={1}
                  />
                </Group>

                <Group grow>
                  <NumberInput
                    label="Net Weight (g)"
                    placeholder="e.g., 250"
                    value={sWeight}
                    onChange={setSWeight}
                    min={1}
                    step={1}
                    required
                  />
                  <NumberInput
                    label="Shelf Life (months)"
                    placeholder="6"
                    value={sLife}
                    onChange={setSLife}
                    min={0}
                    step={1}
                    required
                  />
                  <Select
                    label="Style Code"
                    placeholder="Select size"
                    data={ALLOWED_STYLE_CODES}
                    value={sStyle}
                    onChange={setSStyle}
                    required
                  />
                </Group>

                <Textarea
                  label="Ingredients"
                  placeholder="Comma/space separated or uppercase words"
                  value={sIngr}
                  onChange={(e) => setSIngr(e.currentTarget.value)}
                  autosize
                  minRows={2}
                />

                <Group grow>
                  <TextInput label="Calories" value={sCal} onChange={(e) => setSCal(e.currentTarget.value)} />
                  <TextInput label="Carbohydrates" value={sCarb} onChange={(e) => setSCarb(e.currentTarget.value)} />
                  <TextInput label="Fats" value={sFat} onChange={(e) => setSFat(e.currentTarget.value)} />
                  <TextInput label="Protein" value={sProt} onChange={(e) => setSProt(e.currentTarget.value)} />
                  <TextInput label="Cholesterol" value={sChol} onChange={(e) => setSChol(e.currentTarget.value)} />
                </Group>

                {singleMsg && (
                  <Alert
                    color={singleMsg.type === "success" ? "green" : "red"}
                    icon={singleMsg.type === "success" ? <IconCheck /> : <IconAlertTriangle />}
                  >
                    {singleMsg.text}
                  </Alert>
                )}

                <Group justify="flex-end">
                  <Button
                    onClick={submitSingle}
                    loading={singleBusy}
                  >
                    Insert
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Tabs.Panel>

          {/* ---------------- Bulk tab ---------------- */}
          <Tabs.Panel value="bulk" pt="md">
            <Paper withBorder p="md" radius="md">
              <Stack gap="sm">
                <Group justify="space-between" align="flex-end">
                  <FileInput
                    label="CSV file"
                    placeholder="Select .csv"
                    value={file}
                    onChange={(f) => {
                      setFile(f);
                      if (f) parseCsv(f);
                    }}
                    accept=".csv,text/csv"
                    w={400}
                  />
                  <Text size="sm">
                    Need a template?{" "}
                    <Anchor
                      href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`}
                      download="simple_labels_template.csv"
                    >
                      Download CSV sample
                    </Anchor>
                  </Text>
                </Group>

                {!!bulkErrors.length && (
                  <Alert color="red" icon={<IconAlertTriangle />}>
                    <Text fw={700} mb={4}>Found {bulkErrors.length} issue(s):</Text>
                    <ul style={{ margin: 0, paddingInlineStart: "18px" }}>
                      {bulkErrors.map((e, i) => (
                        <li key={i}><code>{e}</code></li>
                      ))}
                    </ul>
                  </Alert>
                )}

                {!!bulkPreview.length && (
                  <Card withBorder p="sm" radius="md">
                    <Text fw={700} mb="xs">
                      Preview ({bulkPreview.length} valid row{bulkPreview.length > 1 ? "s" : ""})
                    </Text>
                    <Box style={{ overflowX: "auto" }}>
                      <Table striped highlightOnHover withTableBorder stickyHeader>
                        <Table.Thead>
                          <Table.Tr>
                            {CSV_COLUMNS.map((c) => (
                              <Table.Th key={c}>{c}</Table.Th>
                            ))}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {bulkPreview.slice(0, 200).map((r, idx) => (
                            <Table.Tr key={idx}>
                              {CSV_COLUMNS.map((c) => (
                                <Table.Td key={c}>{r[c] ?? ""}</Table.Td>
                              ))}
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>
                    {bulkPreview.length > 200 && (
                      <Text size="sm" c="dimmed" mt="xs">
                        Showing first 200 rows…
                      </Text>
                    )}

                    {bulkMsg && (
                      <Alert
                        mt="sm"
                        color={bulkMsg.type === "success" ? "green" : "red"}
                        icon={bulkMsg.type === "success" ? <IconCheck /> : <IconAlertTriangle />}
                      >
                        {bulkMsg.text}
                      </Alert>
                    )}

                    <Group justify="flex-end" mt="sm">
                      <Button
                        leftSection={<IconUpload size={16} />}
                        onClick={uploadBulk}
                        loading={bulkBusy}
                      >
                        Upload {bulkPreview.length} row{bulkPreview.length > 1 ? "s" : ""}
                      </Button>
                    </Group>
                  </Card>
                )}

                {!file && (
                  <Alert variant="light" color="gray">
                    CSV must include headers:{" "}
                    <code>{CSV_COLUMNS.join(", ")}</code>
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
