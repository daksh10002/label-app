// /src/pages/Goshudh.jsx
import { useEffect, useRef, useState } from "react";
import { Button, Card, Container, Group, Loader, NumberInput, Select, Stack, Text, Title } from "@mantine/core";
import { supabase } from "../supabaseClient";
import { downloadNodeAsPdf } from "../lib/exportSingle.js";

/* Templates you already have */
import { Label_3x4_Goshudh } from "../templates/Label_3x4_Goshudh.jsx";
import { Label_2x4_Goshudh } from "../templates/Label_2x4_Goshudh.jsx";

export default function GoshudhPage() {
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
        .eq("brand", "Goshudh")
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
  const styleCode = (row?.style_code || "").toLowerCase();

  const handlePrint = async () => {
    if (!previewRef.current) return;
    // Decide size by style_code (defaults to 3×4)
    const is2x4 = styleCode.includes("2x4");
    await downloadNodeAsPdf(previewRef.current, {
      widthIn: is2x4 ? 4 : 4,
      heightIn: is2x4 ? 2 : 3,
      filename: is2x4 ? "goshudh_2x4.pdf" : "goshudh_3x4.pdf",
      copies,
    });
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Goshudh — Stickers</Title>

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
            <div ref={previewRef} style={{ width: styleCode.includes("2x4") ? "4in" : "4in", height: styleCode.includes("2x4") ? "2in" : "3in" }}>
              {styleCode.includes("2x4") ? (
                <Label_2x4_Goshudh data={row} />
              ) : (
                <Label_3x4_Goshudh data={row} />
              )}
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
