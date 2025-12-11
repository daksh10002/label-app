import { useEffect, useState } from "react";
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
} from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconEdit, IconTrash, IconSearch, IconToggleLeft, IconToggleRight, IconDownload, IconUpload, IconFileSpreadsheet } from "@tabler/icons-react";
import { supabase } from "../supabaseClient.js";
import Papa from "papaparse";

export default function ManageLabels() {
  // rows shown for current page
  const [rows, setRows] = useState([]);
  // page-level filtered list (we'll keep the same name but it's page results)
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState(null);

  // Bulk Import State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 100; // you can change this
  const [totalCount, setTotalCount] = useState(0);

  // derived slice for the table (we already load only current page so it's rows)
  const paginated = filtered;

  // debounce timer id for search
  const [searchTimer, setSearchTimer] = useState(null);

  // ---------- Load labels with server-side pagination and optional server-side search ----------
  // pageNumber optional; q is search query
  async function loadData(pageNumber = 1, q = "") {
    setLoading(true);
    const from = (pageNumber - 1) * perPage;
    const to = pageNumber * perPage - 1;

    try {
      let query = supabase
        .from("simple_labels")
        .select("*", { count: "exact" })
        .order("brand", { ascending: true })
        .order("name", { ascending: true })
        .range(from, to);

      // if there's a search query, use .or with ilike for multiple columns
      if (q && q.trim() !== "") {
        // Sanitize and build pattern
        const pattern = `%${q.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
        // PostgREST-style OR: name.ilike.%...%,brand.ilike.%...%,batch_no.ilike.%...%
        // Note: .or expects a comma-separated expression without surrounding parentheses
        query = supabase
          .from("simple_labels")
          .select("*", { count: "exact" })
          .order("brand", { ascending: true })
          .order("name", { ascending: true })
          .or(`name.ilike.${pattern},brand.ilike.${pattern},batch_no.ilike.${pattern}`)
          .range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        setMsg({ type: "error", text: error.message });
        setRows([]);
        setFiltered([]);
        setTotalCount(0);
      } else {
        setRows(data || []);
        setFiltered(data || []); // current page results
        setTotalCount(count || 0);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Unknown error" });
      setRows([]);
      setFiltered([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    loadData(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload whenever page changes (keep same search)
  useEffect(() => {
    loadData(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // server-side search with debounce
  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => {
      // whenever user types, reset to page 1 and load with query
      setPage(1);
      loadData(1, search);
    }, 300); // 300ms debounce
    setSearchTimer(t);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ---------- Delete a label ----------
  async function handleDelete(row) {
    if (!window.confirm(`Delete label "${row.name}" (${row.style_code}) ?`)) return;
    setLoading(true);
    const { error } = await supabase.from("simple_labels").delete().eq("id", row.id);
    setLoading(false);
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({ type: "success", text: `Deleted ${row.name}` });
      // reload current page (if deletion made this page empty, keep same page number and let loadData handle it)
      loadData(page, search);
    }
  }

  // ---------- Toggle active/inactive status ----------
  async function handleToggleActive(row) {
    setLoading(true);
    const newStatus = !row.is_active;
    const { error } = await supabase
      .from("simple_labels")
      .update({ is_active: newStatus })
      .eq("id", row.id);
    setLoading(false);
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({
        type: "success",
        text: `${row.name} marked as ${newStatus ? "active" : "inactive"}`
      });
      loadData(page, search);
    }
  }

  // ---------- Save edits (exclude use_by) ----------
  async function saveEdit() {
    if (!editing) return;
    setSaving(true);

    // exclude use_by so frontend cannot update it directly
    const { id, use_by, ...updates } = editing;

    // Basic validation example (you can extend)
    if (!updates.name || !updates.brand || !updates.batch_no) {
      setSaving(false);
      setMsg({ type: "error", text: "Name, Brand and Batch No. are required" });
      return;
    }

    const { error } = await supabase.from("simple_labels").update(updates).eq("id", id);

    setSaving(false);
    if (error) {
      setMsg({ type: "error", text: error.message });
    } else {
      setMsg({ type: "success", text: `Updated ${editing.name}` });
      setEditing(null);
      loadData(page, search);
    }
  }

  // ---------- Bulk Export (CSV) ----------
  async function handleExportCsv() {
    setLoading(true);
    // Fetch ALL rows (or filtered if you prefer, but usually bulk export implies all or large set)
    // We'll respect the search filter if present, but fetch all pages
    let query = supabase
      .from("simple_labels")
      .select("*")
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (search && search.trim() !== "") {
      const pattern = `%${search.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      query = query.or(`name.ilike.${pattern},brand.ilike.${pattern},batch_no.ilike.${pattern}`);
    }

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      setMsg({ type: "error", text: "Export failed: " + error.message });
      return;
    }

    if (!data || !data.length) {
      setMsg({ type: "info", text: "No rows to export." });
      return;
    }

    // Convert to CSV
    // We explicitly order columns so ID is first
    const csv = Papa.unparse(data, {
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
        "use_by", // read-only usually, but good for reference
        "pkd_on"
      ],
    });

    // Valid filename
    const filename = `simple_labels_export_${new Date().toISOString().slice(0, 10)}.csv`;

    // Trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ---------- Bulk Import Logic ----------
  function handleFileChange(file) {
    setImportFile(file);
    setImportPreview([]);
    setImportErrors([]);
    setImportMsg(null);

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (!rows || !rows.length) {
          setImportErrors(["CSV file is empty or invalid."]);
          return;
        }

        // Validate & Sanitize
        // We need to handle boolean conversion for is_active
        const saneRows = [];
        const errs = [];

        rows.forEach((r, idx) => {
          // Normalize is_active
          let isActive = true; // default
          if (r.is_active !== undefined && r.is_active !== null && r.is_active !== "") {
            const low = String(r.is_active).toLowerCase();
            if (low === "false" || low === "0" || low === "no") isActive = false;
          }

          // We pass ID if present (update), else undefined (insert)
          const id = r.id && r.id.trim() !== "" ? r.id.trim() : undefined;

          // Simple required check
          if (!r.name) {
            errs.push(`Row ${idx + 2}: Name is missing`); // idx+2 because header is 1
          }

          saneRows.push({
            ...(id ? { id } : {}), // only include ID if it exists
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
            cholesterol: r.cholesterol
          });
        });

        if (errs.length > 0) {
          setImportErrors(errs);
          // We might still allow upload of valid rows, but usually safer to block
        }
        setImportPreview(saneRows);
      },
      error: (err) => {
        setImportErrors([`Parse Error: ${err.message}`]);
      }
    });
  }

  async function handleBulkUpsert() {
    if (!importPreview.length) return;
    setImporting(true);
    setImportMsg(null);

    // Upsert (update if conflict on ID, or insert if no ID)
    // Note: Supabase upsert matches on PRIMARY KEY (id) by default.
    const { data, error } = await supabase.from("simple_labels").upsert(importPreview, { onConflict: "id" });

    setImporting(false);
    if (error) {
      setImportMsg({ type: "error", text: error.message });
    } else {
      setImportMsg({ type: "success", text: `Successfully processed ${importPreview.length} rows.` });
      // Close modal after short delay or let user close
      setTimeout(() => {
        setImportModalOpen(false);
        setImportFile(null);
        setImportPreview([]);
        loadData(page, search); // refresh table
      }, 1500);
    }
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Title order={2}>Manage Labels</Title>

        <Group justify="space-between">
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search by name, brand or batch..."
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
            }}
            w={300}
          />
          <Group>
            <Button
              variant="outline"
              leftSection={<IconDownload size={16} />}
              onClick={handleExportCsv}
              loading={loading}
            >
              Export CSV
            </Button>
            <Button
              leftSection={<IconFileSpreadsheet size={16} />}
              onClick={() => setImportModalOpen(true)}
            >
              Bulk Update
            </Button>
          </Group>
        </Group>

        {msg && (
          <Alert
            color={msg.type === "error" ? "red" : "green"}
            icon={msg.type === "error" ? <IconAlertTriangle /> : <IconCheck />}
          >
            {msg.text}
          </Alert>
        )}

        {loading && <Loader />}

        {!loading && (
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
                {paginated.map((r) => (
                  <Table.Tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.6 }}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td>{r.brand}</Table.Td>
                    <Table.Td>{r.batch_no}</Table.Td>
                    <Table.Td>{r.net_weight_g}</Table.Td>
                    <Table.Td>{r.mrp}</Table.Td>
                    <Table.Td>{r.style_code}</Table.Td>
                    <Table.Td>
                      <Badge color={r.is_active ? "green" : "gray"} variant="light">
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          variant="light"
                          color={r.is_active ? "orange" : "green"}
                          size="xs"
                          leftSection={r.is_active ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                          onClick={() => handleToggleActive(r)}
                        >
                          {r.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="light"
                          color="blue"
                          size="xs"
                          leftSection={<IconEdit size={14} />}
                          onClick={() => setEditing({ ...r })}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => handleDelete(r)}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {paginated.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text align="center">No rows on this page.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            <Group justify="center" mt="md">
              <Pagination
                total={Math.max(1, Math.ceil(totalCount / perPage))}
                value={page}
                onChange={(p) => setPage(p)}
              />
            </Group>
          </Card>
        )}
      </Stack>

      {/* ---------- Edit Modal (no editable use_by) ---------- */}
      <Modal
        opened={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit Label — ${editing?.name}`}
        size="lg"
        centered
      >
        {editing && (
          <Stack>
            <TextInput
              label="Name *"
              placeholder="Product name"
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Brand *"
              placeholder="Select brand"
              value={editing.brand || ""}
              onChange={(e) => setEditing({ ...editing, brand: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Batch No. *"
              placeholder="e.g., GS-0001"
              value={editing.batch_no || ""}
              onChange={(e) => setEditing({ ...editing, batch_no: e.currentTarget.value })}
              required
            />
            <NumberInput
              label="MRP (₹)"
              placeholder="e.g., 199"
              value={editing.mrp || ""}
              onChange={(v) => setEditing({ ...editing, mrp: v })}
            />
            <NumberInput
              label="Net Weight (g) *"
              placeholder="e.g., 250"
              value={editing.net_weight_g || ""}
              onChange={(v) => setEditing({ ...editing, net_weight_g: v })}
              required
            />
            <NumberInput
              label="Shelf Life (months) *"
              placeholder="6"
              value={editing.shelf_life_months || ""}
              onChange={(v) => setEditing({ ...editing, shelf_life_months: v })}
              required
            />
            <Select
              label="Style Code *"
              placeholder="Select size"
              value={editing.style_code}
              onChange={(v) => setEditing({ ...editing, style_code: v })}
              data={["2x4in", "3x4in", "38x25mm", "38x24mm"]}
              required
            />
            <Textarea
              label="Ingredients"
              placeholder="Comma/space separated or uppercase words"
              value={editing.ingredients || ""}
              onChange={(e) => setEditing({ ...editing, ingredients: e.currentTarget.value })}
              autosize
              minRows={2}
            />
            <Group grow>
              <NumberInput
                label="Calories"
                value={editing.calories || ""}
                onChange={(v) => setEditing({ ...editing, calories: v })}
              />
              <NumberInput
                label="Carbohydrates"
                value={editing.carbohydrates || ""}
                onChange={(v) => setEditing({ ...editing, carbohydrates: v })}
              />
            </Group>
            <Group grow>
              <NumberInput
                label="Fats"
                value={editing.fats || ""}
                onChange={(v) => setEditing({ ...editing, fats: v })}
              />
              <NumberInput
                label="Protein"
                value={editing.protein || ""}
                onChange={(v) => setEditing({ ...editing, protein: v })}
              />
            </Group>

            {/* Active/Inactive Switch */}
            <Switch
              label="Active"
              description="Inactive labels won't appear in printing dropdowns"
              checked={editing.is_active ?? true}
              onChange={(e) => setEditing({ ...editing, is_active: e.currentTarget.checked })}
            />

            {/* show use_by read-only since it's auto-managed by your DB */}
            <Text size="sm">
              Use-by:{" "}
              {editing.use_by
                ? new Date(editing.use_by).toLocaleDateString()
                : "— (managed automatically)"}
            </Text>

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button color="green" loading={saving} onClick={saveEdit}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
      {/* ---------- Bulk Import Modal ---------- */}
      <Modal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Bulk Update / Import via CSV"
        size="lg"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Upload a CSV to update existing labels (by ID) or insert new ones.
            <br />
            <strong>Tip:</strong> Use "Export CSV" first to get a template with valid IDs.
          </Text>

          <FileInput
            label="Upload CSV"
            placeholder="Select file..."
            accept=".csv"
            value={importFile}
            onChange={handleFileChange}
            leftSection={<IconUpload size={16} />}
          />

          {importErrors.length > 0 && (
            <Alert color="red" title="Validation Errors" icon={<IconAlertTriangle />}>
              <Stack gap={4}>
                {importErrors.slice(0, 5).map((e, i) => (
                  <Text key={i} size="xs">{e}</Text>
                ))}
                {importErrors.length > 5 && <Text size="xs">...and {importErrors.length - 5} more</Text>}
              </Stack>
            </Alert>
          )}

          {importPreview.length > 0 && !importErrors.length && (
            <Alert color="blue" icon={<IconFileSpreadsheet />}>
              Ready to process <strong>{importPreview.length}</strong> rows.
              {importPreview.some(r => !!r.id) && (
                <Text size="xs" mt={4}>
                  rows with ID will be updated; others inserted.
                </Text>
              )}
            </Alert>
          )}

          {importMsg && (
            <Alert color={importMsg.type === "success" ? "green" : "red"}>
              {importMsg.text}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkUpsert}
              loading={importing}
              disabled={!importPreview.length || importErrors.length > 0}
            >
              Start Import
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Container>
  );
}
