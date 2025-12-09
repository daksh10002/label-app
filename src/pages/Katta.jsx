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
import { printNodeDirect } from "../lib/printDirect.js";

import { Label_38x24_KattaPair } from "../templates/Label_38x24_Katta.jsx";

const MM_TO_IN = 0.0393701;
const WIDTH_IN = 38 * MM_TO_IN;
const HEIGHT_IN = 24 * MM_TO_IN;

export default function KattaPage() {
  const [rows, setRows] = useState([]);
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState(1);

  const previewRef = useRef(null);

  // Fetch data from Supabase
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("simple_labels")
        .select("*")
        .eq("style_code", "38x24mm")
        .eq("is_active", true)
        .order("brand", { ascending: true })
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

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    await downloadNodeAsPdf(previewRef.current, {
      widthIn: WIDTH_IN * 2 + 0.08, // two labels side-by-side
      heightIn: HEIGHT_IN,
      filename: "katta_38x24.pdf",
      copies,
    });
  };

  // Direct print
  const handleDirectPrint = async () => {
    if (!previewRef.current) return;
    await printNodeDirect(previewRef.current, {
      widthIn: WIDTH_IN * 2 + 0.08,
      heightIn: HEIGHT_IN,
      copies,
      title: "Katta Sticker 38x24",
    });
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Katta MRP Stickers — 38×24 mm</Title>

        <Group gap="sm" wrap="wrap">
          <Select
            label="Product"
            placeholder="Select product"
            value={id}
            onChange={(v) => setId(v || null)}
            data={(rows || []).map((r) => ({
              value: String(r.id),
              label: `${r.brand} — ${r.name} (${r.net_weight_g}g)`,
            }))}
            searchable
            nothingFound="No items"
            w={420}
          />
          <NumberInput
            label="Copies"
            min={1}
            step={1}
            value={copies}
            onChange={setCopies}
            w={120}
          />
          <Button onClick={handleDirectPrint} disabled={!row || loading} color="green">
            Direct Print
          </Button>
          <Button onClick={handleDownloadPdf} disabled={!row || loading} color="blue">
            Download PDF
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
            <div
              ref={previewRef}
              style={{
                width: `${WIDTH_IN * 2 + 0.08}in`,
                height: `${HEIGHT_IN}in`,
                background: "#fff",
              }}
            >
              <Label_38x24_KattaPair data={row} />
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
