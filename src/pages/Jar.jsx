// /src/pages/Jar.jsx
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
import { supabase } from "../supabaseClient";
import { downloadNodeAsPdf } from "../lib/exportSingle.js";

// Pair (two-up) 38x25mm label
// Make sure your template file exports: export function Label_38x25_JarPair({ data }) { ... }
import { Label_38x25_JarPair } from "../templates/Label_38x25_Jar.jsx";

// mm → inch
const MM_TO_IN = 0.0393701;
const WIDTH_IN = 78 * MM_TO_IN;   // two labels (38 + 2 gap + 38) = 78mm total
const HEIGHT_IN = 25 * MM_TO_IN;  // 25mm tall

export default function JarPage() {
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
        .eq("style_code", "38x25mm") // <-- ONLY 38x25 rows
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

  const handlePrint = async () => {
    if (!previewRef.current) return;
    await downloadNodeAsPdf(previewRef.current, {
      widthIn: WIDTH_IN,
      heightIn: HEIGHT_IN,
      filename: "jar_38x25_pair.pdf",
      copies, // will duplicate the page N times
    });
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Jar Stickers — 38×25 mm (Pair)</Title>

        <Group gap="sm" wrap="wrap">
          <Select
            label="Product"
            placeholder="Select product"
            value={id}
            onChange={(v) => setId(v || null)}
            data={(rows || []).map((r) => ({
              value: String(r.id),
              label: `${r.brand ?? ""} ${r.brand ? "— " : ""}${r.name ?? ""} (${r.net_weight_g ?? "—"}g)`,
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
            <div
              ref={previewRef}
              style={{
                width: `${WIDTH_IN}in`,
                height: `${HEIGHT_IN}in`,
                background: "#fff",
              }}
            >
              {/* The pair component duplicates the same data on both stickers */}
              <Label_38x25_JarPair data={row} />
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
