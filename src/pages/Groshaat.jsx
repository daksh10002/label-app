// /src/pages/Groshaat.jsx
import { useEffect, useRef, useState } from "react";
import { Button, Card, Container, Group, Loader, NumberInput, Select, Stack, Text, Title } from "@mantine/core";
import { supabase } from "../supabaseClient.js";
import { downloadNodeAsPdf } from "../lib/exportSingle.js";

/* Your template */
import { Label_3x4_Groshaat } from "../templates/Label_3x4_Groshaat.jsx";

export default function GroshaatPage() {
  const [rows, setRows] = useState([]);
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState(1);

  const previewRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("simple_labels")
        .select("*")
        .eq("brand", "Groshaat")
        .order("name", { ascending: true });
      if (!error) {
        setRows(data || []);
        if (data?.length) setId(String(data[0].id));
      } else {
        console.error(error);
      }
      setLoading(false);
    })();
  }, []);

  const row = rows.find((r) => String(r.id) === String(id)) || null;

  const handlePrint = async () => {
    if (!previewRef.current) return;
    await downloadNodeAsPdf(previewRef.current, {
      widthIn: 4,
      heightIn: 3,
      filename: "groshaat_3x4.pdf",
      copies,
    });
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Groshaat — Stickers (3×4 in)</Title>

        <Group gap="sm" wrap="wrap">
          <Select
            label="Product"
            placeholder="Select product"
            value={id}
            onChange={(v) => setId(v || null)}
            data={(rows || []).map((r) => ({
              value: String(r.id),
              label: `${r.name} (${r.net_weight_g}g) — ${r.style_code}`,
            }))}
            searchable
            nothingFound="No items"
            w={360}
          />
          <NumberInput
            label="Copies"
            min={1}
            step={1}
            value={copies}
            onChange={setCopies}
            w={120}
          />
          <Button onClick={handlePrint} disabled={!row || loading}>
            Print PDF
          </Button>
        </Group>

        {loading && <Loader />}

        {!loading && !row && (
          <Card withBorder p="md">
            <Text c="dimmed">No selection. Pick a product to preview.</Text>
          </Card>
        )}

        {!loading && row && (
          <Card withBorder p="sm" style={{ background: "#fff" }}>
            <div ref={previewRef} style={{ width: "4in", height: "3in" }}>
              <Label_3x4_Groshaat data={row} />
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
