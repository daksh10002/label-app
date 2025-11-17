import { useEffect, useState } from "react";
import {
  Alert,
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
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { supabase } from "../supabaseClient.js";

export default function ManageLabels() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // pagination (client-side)
  const [page, setPage] = useState(1);
  const perPage = 100;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ---------- Load all labels (batching to overcome 1000-row PostgREST default) ----------
  async function loadData() {
    setLoading(true);
    setMsg(null);

    try {
      const batchSize = 1000; // Supabase/PostgREST default cap — fetch in chunks of 1000
      let from = 0;
      let all = [];
      while (true) {
        // request a batch
        const { data, error } = await supabase
          .from("simple_labels")
          .select("*")
          // stable ordering across batches is important — include a unique indexed column like id
          .order("brand", { ascending: true })
          .order("name", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          break;
        }

        all = all.concat(data);
        // if we received fewer than batchSize rows, that was the last batch
        if (data.length < batchSize) {
          break;
        }
        // otherwise prepare for next batch
        from += batchSize;
      }

      setRows(all);
      setMsg({ type: "success", text: `Loaded ${all.length} labels` });
    } catch (error) {
      setMsg({ type: "error", text: error.message || "Failed to load data" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Filter by search ----------
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(rows);
    } else {
      setFiltered(
        rows.filter(
          (r) =>
            r.name?.toLowerCase().includes(q) ||
            r.brand?.toLowerCase().includes(q) ||
            r.batch_no?.toLowerCase().includes(q)
        )
      );
    }
    setPage(1);
  }, [search, rows]);

  // ---------- Delete a label ----------
  async function handleDelete(row) {
    if (!window.confirm(`Delete label "${row.name}" (${row.style_code}) ?`)) return;
    const { error } = await supabase.from("simple_labels").delete().eq("id", row.id);
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({ type: "success", text: `Deleted ${row.name}` });
      // remove optimistically from state so UI updates fast
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  }

  // ---------- Save edits ----------
  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { id, ...updates } = editing;
    try {
      const { error } = await supabase.from("simple_labels").update(updates).eq("id", id);
      if (error) {
        setMsg({ type: "error", text: error.message });
      } else {
        setMsg({ type: "success", text: `Updated ${editing.name}` });
        // update local state optimistically
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
        setEditing(null);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Title order={2}>Manage Labels</Title>

        <Group position="apart">
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search by name, brand or batch..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={300}
          />
          <Group>
            <Button variant="light" onClick={loadData} disabled={loading}>
              Refresh
            </Button>
            <Text size="sm">{rows.length ? `${rows.length} total` : ""}</Text>
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

        {loading && (
          <Group>
            <Loader />
            <Text>Loading all labels — this may take a moment for large tables...</Text>
          </Group>
        )}

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
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginated.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.name}</Table.Td>
                    <Table.Td>{r.brand}</Table.Td>
                    <Table.Td>{r.batch_no}</Table.Td>
                    <Table.Td>{r.net_weight_g}</Table.Td>
                    <Table.Td>{r.mrp}</Table.Td>
                    <Table.Td>{r.style_code}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
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
              </Table.Tbody>
            </Table>

            <Group justify="center" mt="md">
              <Pagination
                total={Math.max(1, Math.ceil(filtered.length / perPage))}
                value={page}
                onChange={setPage}
              />
            </Group>
          </Card>
        )}
      </Stack>

      {/* ---------- Edit Modal ---------- */}
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
    </Container>
  );
}
