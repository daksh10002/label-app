import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Stack,
  Switch,
  FileInput,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Progress,
  Radio,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconEdit,
  IconTrash,
  IconSearch,
  IconToggleLeft,
  IconToggleRight,
  IconDownload,
  IconUpload,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { supabase } from "../supabaseClient.js";
import Papa from "papaparse";

/**
 * ManageLabels — optimized
 *
 * Features:
 * - server-side pagination (perPage)
 * - debounced server-side search
 * - batch export (BATCH_EXPORT_SIZE)
 * - chunked import (CHUNK_IMPORT_SIZE)
 * - Import modes: "upsert" (fast) | "partial" (safe: preserves empty cells)
 * - progress UI for both export and import
 */

export default function ManageLabels() {
  const TABLE = "simple_labels"; // change if needed

  // Tunables
  const PER_PAGE = 100;
  const BATCH_EXPORT_SIZE = 1000; // fetch size for export
  const CHUNK_IMPORT_SIZE = 500; // safe chunk size for imports
  const PARTIAL_UPDATE_CONCURRENCY = 6; // concurrency for partial update requests

  // --- State ---
  const [rows, setRows] = useState([]); // current page rows
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // import/export state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0, batch: 0, batches: 0 });
  const [importMode, setImportMode] = useState("upsert"); // "upsert" | "partial"

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ fetched: 0, batch: 0, batches: 0 });

  // refs
  const mountedRef = useRef(true);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // helper: sanitize search -> ilike pattern
  const buildPattern = useCallback((q) => {
    if (!q || !q.trim()) return null;
    const safe = q.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");
    return `%${safe}%`;
  }, []);

  // --- Load page (server-side pagination + optional search) ---
  const loadPage = useCallback(
    async (pageNumber = 1, q = "") => {
      setLoading(true);
      const from = (pageNumber - 1) * PER_PAGE;
      const to = pageNumber * PER_PAGE - 1;
      try {
        const pattern = buildPattern(q);

        let query = supabase
          .from(TABLE)
          .select("*", { count: "exact" })
          .order("brand", { ascending: true })
          .order("name", { ascending: true })
          .range(from, to);

        if (pattern) {
          query = supabase
            .from(TABLE)
            .select("*", { count: "exact" })
            .order("brand", { ascending: true })
            .order("name", { ascending: true })
            .or(`name.ilike.${pattern},brand.ilike.${pattern},batch_no.ilike.${pattern}`)
            .range(from, to);
        }

        const { data, error, count } = await query;

        if (!mountedRef.current) return;
        if (error) {
          setMsg({ type: "error", text: error.message });
          setRows([]);
          setTotalCount(0);
        } else {
          setRows(data || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setMsg({ type: "error", text: err.message || "Unknown error" });
        setRows([]);
        setTotalCount(0);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [buildPattern]
  );

  // initial load
  useEffect(() => {
    loadPage(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload when page changes
  useEffect(() => {
    loadPage(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // debounced search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      loadPage(1, search);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ---------- Row actions ----------
  const handleDelete = useCallback(
    async (row) => {
      if (!window.confirm(`Delete label "${row.name}" (${row.style_code}) ?`)) return;
      setLoading(true);
      const { error } = await supabase.from(TABLE).delete().eq("id", row.id);
      setLoading(false);
      if (error) setMsg({ type: "error", text: error.message });
      else {
        setMsg({ type: "success", text: `Deleted ${row.name}` });
        loadPage(page, search);
      }
    },
    [page, search, loadPage]
  );

  const handleToggleActive = useCallback(
    async (row) => {
      setLoading(true);
      const newStatus = !row.is_active;
      const { error } = await supabase.from(TABLE).update({ is_active: newStatus }).eq("id", row.id);
      setLoading(false);
      if (error) setMsg({ type: "error", text: error.message });
      else {
        setMsg({ type: "success", text: `${row.name} marked as ${newStatus ? "active" : "inactive"}` });
        loadPage(page, search);
      }
    },
    [page, search, loadPage]
  );

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    setSaving(true);

    // exclude use_by
    const { id, use_by, ...updates } = editing;

    if (!updates.name || !updates.brand || !updates.batch_no) {
      setSaving(false);
      setMsg({ type: "error", text: "Name, Brand and Batch No. are required" });
      return;
    }

    const { error } = await supabase.from(TABLE).update(updates).eq("id", id);
    setSaving(false);
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({ type: "success", text: `Updated ${editing.name}` });
      setEditing(null);
      loadPage(page, search);
    }
  }, [editing, page, search, loadPage]);

  // ---------- Batch Export (fetch all rows in batches) ----------
  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    setExportProgress({ fetched: 0, batch: 0, batches: Math.ceil((totalCount || 4000) / BATCH_EXPORT_SIZE) });
    setLoading(true);

    try {
      let allRows = [];
      let pageIndex = 0;
      let more = true;
      const pattern = buildPattern(search);

      while (more) {
        const from = pageIndex * BATCH_EXPORT_SIZE;
        const to = from + BATCH_EXPORT_SIZE - 1;
        setExportProgress((p) => ({ ...p, batch: pageIndex + 1 }));

        let q = supabase
          .from(TABLE)
          .select("*")
          .order("brand", { ascending: true })
          .order("name", { ascending: true })
          .range(from, to);

        if (pattern) {
          q = supabase
            .from(TABLE)
            .select("*")
            .order("brand", { ascending: true })
            .order("name", { ascending: true })
            .or(`name.ilike.${pattern},brand.ilike.${pattern},batch_no.ilike.${pattern}`)
            .range(from, to);
        }

        const { data, error } = await q;
        if (error) throw error;

        allRows = allRows.concat(data || []);
        setExportProgress((p) => ({ ...p, fetched: allRows.length }));

        if (!data || data.length < BATCH_EXPORT_SIZE) more = false;
        else pageIndex += 1;
      }

      setLoading(false);
      setExporting(false);

      if (!allRows.length) {
        setMsg({ type: "info", text: "No rows to export." });
        return;
      }

      const csv = Papa.unparse(allRows, {
        columns: [
          "id",
          "name",
          "brand",
          "batch_no",
          "mrp",
          "net_weight_g",
          "shelf_life_months",
          "style_code",
          "is_active",
          "ingredients",
          "calories",
          "carbohydrates",
          "fats",
          "protein",
          "cholesterol",
          "use_by",
          "pkd_on",
        ],
      });

      const filename = `simple_labels_export_${new Date().toISOString().slice(0, 10)}.csv`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMsg({ type: "success", text: `Exported ${allRows.length} rows.` });
    } catch (err) {
      if (mountedRef.current) {
        setLoading(false);
        setExporting(false);
        setMsg({ type: "error", text: err.message || "Unknown error during export" });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setExporting(false);
      }
    }
  }, [search, totalCount, buildPattern]);

  // ---------- Import parsing (CSV -> preview rows) ----------
  const handleFileChange = useCallback((file) => {
    setImportFile(file);
    setImportPreview([]);
    setImportErrors([]);
    setImportMsg(null);

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data || [];
        if (!parsed.length) {
          setImportErrors(["CSV file is empty or invalid."]);
          return;
        }

        const saneRows = [];
        const errs = [];

        parsed.forEach((r, idx) => {
          let isActive = true;
          if (r.is_active !== undefined && r.is_active !== null && r.is_active !== "") {
            const low = String(r.is_active).toLowerCase();
            if (low === "false" || low === "0" || low === "no") isActive = false;
          }

          const id = r.id && String(r.id).trim() !== "" ? String(r.id).trim() : undefined;

          if (!r.name) {
            errs.push(`Row ${idx + 2}: Name is missing`);
          }

          saneRows.push({
            ...(id ? { id } : {}),
            name: r.name,
            brand: r.brand,
            batch_no: r.batch_no,
            net_weight_g: r.net_weight_g || null,
            mrp: r.mrp || null,
            shelf_life_months: r.shelf_life_months || 6,
            style_code: r.style_code,
            is_active: isActive,
            ingredients: r.ingredients,
            calories: r.calories,
            carbohydrates: r.carbohydrates,
            fats: r.fats,
            protein: r.protein,
            cholesterol: r.cholesterol,
          });
        });

        if (errs.length > 0) setImportErrors(errs);
        setImportPreview(saneRows);
      },
      error: (err) => {
        setImportErrors([`Parse Error: ${err.message}`]);
      },
    });
  }, []);

  // ---------- Import: Fast Upsert (chunked) ----------
  const handleBulkUpsertFast = useCallback(async () => {
    if (!importPreview.length) return;

    const CHUNK = CHUNK_IMPORT_SIZE;
    setImporting(true);
    setImportMsg(null);
    setImportProgress({ done: 0, total: importPreview.length, batch: 0, batches: Math.ceil(importPreview.length / CHUNK) });

    const chunks = [];
    for (let i = 0; i < importPreview.length; i += CHUNK) chunks.push(importPreview.slice(i, i + CHUNK));

    let processed = 0;
    const failedBatches = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const batch = chunks[i];
        setImportProgress((p) => ({ ...p, batch: i + 1 }));

        const { error } = await supabase.from(TABLE).upsert(batch, { onConflict: "id" });
        if (error) failedBatches.push({ batchIndex: i, length: batch.length, message: error.message });

        processed += batch.length;
        setImportProgress((p) => ({ ...p, done: processed }));

        // small throttle (uncomment if your DB shows rate limits)
        // await new Promise((r) => setTimeout(r, 50));
      }

      setImporting(false);

      if (failedBatches.length) {
        setImportMsg({ type: "error", text: `Imported ${processed - failedBatches.reduce((s, f) => s + f.length, 0)} / ${importPreview.length} rows. ${failedBatches.length} failed.` });
        setImportErrors((prev) => [...prev, ...failedBatches.map((f) => `Batch ${f.batchIndex + 1} (${f.length} rows): ${f.message}`)]);
      } else {
        setImportMsg({ type: "success", text: `Successfully processed ${importPreview.length} rows.` });
        setTimeout(() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportPreview([]);
          loadPage(page, search);
        }, 900);
      }
    } catch (err) {
      if (mountedRef.current) setImportMsg({ type: "error", text: err.message || "Unknown error while importing" });
    } finally {
      if (mountedRef.current) {
        setImportProgress((p) => ({ ...p, done: importPreview.length }));
        setImporting(false);
      }
    }
  }, [importPreview, page, search, loadPage]);

  // ---------- Import: Partial Update (preserve empty cells) ----------
  const handleBulkUpsertPartial = useCallback(async () => {
    if (!importPreview.length) return;

    const CHUNK = CHUNK_IMPORT_SIZE;
    setImporting(true);
    setImportMsg(null);
    setImportProgress({ done: 0, total: importPreview.length, batch: 0, batches: Math.ceil(importPreview.length / CHUNK) });

    // split into inserts (no id) and updates (has id)
    const inserts = [];
    const updates = [];
    for (const r of importPreview) {
      if (r.id) updates.push(r);
      else inserts.push(r);
    }

    const chunkArray = (arr, size) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    const insertChunks = chunkArray(inserts, CHUNK);
    const updateChunks = chunkArray(updates, CHUNK);

    let processed = 0;
    const failed = [];

    try {
      // 1) Insert new rows in chunks
      for (let ci = 0; ci < insertChunks.length; ci++) {
        const batch = insertChunks[ci];
        setImportProgress((p) => ({ ...p, batch: ci + 1 }));
        try {
          const { error } = await supabase.from(TABLE).insert(batch);
          if (error) failed.push({ phase: "insert", index: ci, msg: error.message, len: batch.length });
        } catch (err) {
          failed.push({ phase: "insert", index: ci, msg: err.message, len: batch.length });
        }
        processed += batch.length;
        setImportProgress((p) => ({ ...p, done: processed }));
      }

      // 2) Update existing rows — process in chunks, inside chunk update with limited concurrency
      for (let ci = 0; ci < updateChunks.length; ci++) {
        const batch = updateChunks[ci];
        setImportProgress((p) => ({ ...p, batch: insertChunks.length + ci + 1 }));

        for (let i = 0; i < batch.length; i += PARTIAL_UPDATE_CONCURRENCY) {
          const window = batch.slice(i, i + PARTIAL_UPDATE_CONCURRENCY);

          const promises = window.map(async (row) => {
            // build payload with only non-empty values to preserve DB values for empty fields
            const payload = {};
            for (const [k, v] of Object.entries(row)) {
              if (k === "id") continue;
              if (v === undefined || v === null) continue;
              if (typeof v === "string" && v.trim() === "") continue;
              payload[k] = v;
            }
            if (Object.keys(payload).length === 0) {
              return { ok: true, rows: 0 };
            }
            try {
              const { error } = await supabase.from(TABLE).update(payload).eq("id", row.id);
              if (error) return { ok: false, msg: error.message, id: row.id };
              return { ok: true, rows: 1 };
            } catch (err) {
              return { ok: false, msg: err.message, id: row.id };
            }
          });

          const results = await Promise.all(promises);
          for (const res of results) {
            if (!res.ok) failed.push({ phase: "update", msg: res.msg, id: res.id });
            else processed += res.rows || 0;
            setImportProgress((p) => ({ ...p, done: processed }));
          }
        }
      }

      setImporting(false);

      if (failed.length) {
        setImportMsg({ type: "error", text: `Completed with ${failed.length} failed operation(s). ${processed}/${importPreview.length} processed.` });
        setImportErrors((prev) => [...prev, ...failed.map((f) => `${f.phase} failed: ${f.msg}${f.id ? ` (id=${f.id})` : ""}`)]);
      } else {
        setImportMsg({ type: "success", text: `Successfully processed ${importPreview.length} rows.` });
        setTimeout(() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportPreview([]);
          loadPage(page, search);
        }, 900);
      }
    } catch (err) {
      if (mountedRef.current) setImportMsg({ type: "error", text: err.message || "Unknown error during import" });
    } finally {
      if (mountedRef.current) {
        setImportProgress((p) => ({ ...p, done: importPreview.length }));
        setImporting(false);
      }
    }
  }, [importPreview, loadPage, page, search]);

  // wrapper that chooses mode
  const handleBulkUpsert = useCallback(() => {
    if (importMode === "partial") return handleBulkUpsertPartial();
    return handleBulkUpsertFast();
  }, [importMode, handleBulkUpsertFast, handleBulkUpsertPartial]);

  // derived total pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil((totalCount || 0) / PER_PAGE)), [totalCount]);

  // --- Render ---
  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Title order={2}>Manage Labels</Title>

        <Group justify="space-between">
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search by name, brand or batch..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={300}
          />
          <Group>
            <Button variant="outline" leftSection={<IconDownload size={16} />} onClick={handleExportCsv} loading={exporting || loading}>
              Export CSV
            </Button>
            <Button leftSection={<IconFileSpreadsheet size={16} />} onClick={() => setImportModalOpen(true)}>
              Bulk Update
            </Button>
          </Group>
        </Group>

        {msg && (
          <Alert color={msg.type === "error" ? "red" : "green"} icon={msg.type === "error" ? <IconAlertTriangle /> : <IconCheck />}>
            {msg.text}
          </Alert>
        )}

        {exporting && (
          <Card withBorder radius="md">
            <Text size="sm">Exporting... fetched {exportProgress.fetched} rows (batch {exportProgress.batch}/{Math.max(1, exportProgress.batches)})</Text>
            <Progress value={exportProgress.batches ? Math.min((exportProgress.batch / exportProgress.batches) * 100, 100) : undefined} mt="xs" />
            <Text size="xs" color="dimmed" mt="xs">This fetches rows in batches to avoid the PostgREST 1000-row limit.</Text>
          </Card>
        )}

        {loading && !exporting && <Loader />}

        {!loading && !exporting && (
          <Card withBorder radius="md">
            <Table striped highlightOnHover withTableBorder stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Brand</Table.Th>
                  <Table.Th>Batch</Table.Th>
                  <Table.Th>Weight</Table.Th>
                  <Table.Th>MRP</Table.Th>
                  <Table.Th>Style</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((r) => (
                  <Table.Tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.6 }}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td>{r.brand}</Table.Td>
                    <Table.Td>{r.batch_no}</Table.Td>
                    <Table.Td>{r.net_weight_g}</Table.Td>
                    <Table.Td>{r.mrp}</Table.Td>
                    <Table.Td>{r.style_code}</Table.Td>
                    <Table.Td>
                      <Badge color={r.is_active ? "green" : "gray"} variant="light">{r.is_active ? "Active" : "Inactive"}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button variant="light" color={r.is_active ? "orange" : "green"} size="xs" leftSection={r.is_active ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />} onClick={() => handleToggleActive(r)}>
                          {r.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="light" color="blue" size="xs" leftSection={<IconEdit size={14} />} onClick={() => setEditing({ ...r })}>Edit</Button>
                        <Button variant="light" color="red" size="xs" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(r)}>Delete</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {rows.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text align="center">No rows on this page.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={page} onChange={(p) => setPage(p)} />
            </Group>
          </Card>
        )}
      </Stack>

      {/* Edit Modal */}
      <Modal opened={!!editing} onClose={() => setEditing(null)} title={`Edit Label — ${editing?.name}`} size="lg" centered>
        {editing && (
          <Stack>
            <TextInput label="Name *" placeholder="Product name" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.currentTarget.value })} required />
            <TextInput label="Brand *" placeholder="Select brand" value={editing.brand || ""} onChange={(e) => setEditing({ ...editing, brand: e.currentTarget.value })} required />
            <TextInput label="Batch No. *" placeholder="e.g., GS-0001" value={editing.batch_no || ""} onChange={(e) => setEditing({ ...editing, batch_no: e.currentTarget.value })} required />
            <NumberInput label="MRP (₹)" placeholder="e.g., 199" value={editing.mrp || ""} onChange={(v) => setEditing({ ...editing, mrp: v })} />
            <NumberInput label="Net Weight (g) *" placeholder="e.g., 250" value={editing.net_weight_g || ""} onChange={(v) => setEditing({ ...editing, net_weight_g: v })} required />
            <NumberInput label="Shelf Life (months) *" placeholder="6" value={editing.shelf_life_months || ""} onChange={(v) => setEditing({ ...editing, shelf_life_months: v })} required />
            <Select label="Style Code *" placeholder="Select size" value={editing.style_code} onChange={(v) => setEditing({ ...editing, style_code: v })} data={["2x4in", "3x4in", "38x25mm", "38x24mm"]} required />
            <Textarea label="Ingredients" placeholder="Comma/space separated or uppercase words" value={editing.ingredients || ""} onChange={(e) => setEditing({ ...editing, ingredients: e.currentTarget.value })} autosize minRows={2} />
            <Group grow>
              <NumberInput label="Calories" value={editing.calories || ""} onChange={(v) => setEditing({ ...editing, calories: v })} />
              <NumberInput label="Carbohydrates" value={editing.carbohydrates || ""} onChange={(v) => setEditing({ ...editing, carbohydrates: v })} />
            </Group>
            <Group grow>
              <NumberInput label="Fats" value={editing.fats || ""} onChange={(v) => setEditing({ ...editing, fats: v })} />
              <NumberInput label="Protein" value={editing.protein || ""} onChange={(v) => setEditing({ ...editing, protein: v })} />
            </Group>

            <Switch label="Active" description="Inactive labels won't appear in printing dropdowns" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.currentTarget.checked })} />

            <Text size="sm">Use-by: {editing.use_by ? new Date(editing.use_by).toLocaleDateString() : "— (managed automatically)"}</Text>

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setEditing(null)}>Cancel</Button>
              <Button color="green" loading={saving} onClick={saveEdit}>Save Changes</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal opened={importModalOpen} onClose={() => setImportModalOpen(false)} title="Bulk Update / Import via CSV" size="lg" centered>
        <Stack>
          <Text size="sm" c="dimmed">
            Upload a CSV to update existing labels (by ID) or insert new ones.
            <br />
            <strong>Tip:</strong> Use "Export CSV" first to get a template with valid IDs.
          </Text>

          <Radio.Group value={importMode} onChange={setImportMode} label="Import mode" spacing="sm">
            <Group direction="column" mt="xs">
              <Radio value="upsert" label="Full Upsert — replace row with CSV values (fast). Use this if you exported the full CSV and edited cells." />
              <Radio value="partial" label="Partial Update — only change fields provided in CSV; missing fields are preserved (safer)." />
            </Group>
          </Radio.Group>

          <FileInput label="Upload CSV" placeholder="Select file..." accept=".csv" value={importFile} onChange={handleFileChange} leftSection={<IconUpload size={16} />} />

          {importErrors.length > 0 && (
            <Alert color="red" title="Validation Errors" icon={<IconAlertTriangle />}>
              <Stack gap={4}>
                {importErrors.slice(0, 8).map((e, i) => (<Text key={i} size="xs">{e}</Text>))}
                {importErrors.length > 8 && <Text size="xs">...and {importErrors.length - 8} more</Text>}
              </Stack>
            </Alert>
          )}

          {importing && (
            <Card withBorder radius="md">
              <Text size="sm">Importing… {importProgress.done}/{importProgress.total} rows — batch {importProgress.batch}/{importProgress.batches}</Text>
              <Progress value={importProgress.batches ? Math.min((importProgress.batch / importProgress.batches) * 100, 100) : undefined} mt="xs" />
            </Card>
          )}

          {importPreview.length > 0 && !importErrors.length && !importing && (
            <Alert color="blue" icon={<IconFileSpreadsheet />}>
              Ready to process <strong>{importPreview.length}</strong> rows.
              {importPreview.some((r) => !!r.id) && <Text size="xs" mt={4}>rows with ID will be updated; others inserted.</Text>}
            </Alert>
          )}

          {importMsg && <Alert color={importMsg.type === "success" ? "green" : "red"}>{importMsg.text}</Alert>}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpsert} loading={importing} disabled={!importPreview.length || importErrors.length > 0}>Start Import</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
