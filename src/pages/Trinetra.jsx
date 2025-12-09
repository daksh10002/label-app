// /src/pages/Trinetra.jsx
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { supabase } from "../supabaseClient.js";
import { downloadNodeAsPdf } from "../lib/exportSingle.js";
import { printNodeDirect } from "../lib/printDirect.js"; // ✅ NEW

/* Your template */
import { Label_3x4_Trinetra } from "../templates/Label_3x4_Trinetra.jsx";

const WIDTH_IN = 4;
const HEIGHT_IN = 3;

export default function TrinetraPage() {
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
        .eq("brand", "Trinetra")
        .eq("is_active", true)
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
      widthIn: WIDTH_IN,
      heightIn: HEIGHT_IN,
      filename: "trinetra_3x4.pdf",
      copies,
    });
  };

  // ✅ New direct print handler
  const handleDirectPrint = async () => {
    if (!previewRef.current) return;
    await printNodeDirect(previewRef.current, {
      widthIn: WIDTH_IN,
      heightIn: HEIGHT_IN,
      copies,
      title: "Trinetra Label",
    });
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Trinetra — Stickers (3×4 in)</Title>

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

          {/* ✅ New Direct Print Button */}
          <Button
            onClick={handleDirectPrint}
            disabled={!row || loading}
            color="green"
          >
            Direct Print
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
              <Label_3x4_Trinetra data={row} />
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
