import { useEffect, useRef, useState, useMemo } from "react";
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

import { Label_2x4_Goshudh } from "../templates/Label_2x4_Goshudh.jsx";
import { Label_3x4_Goshudh } from "../templates/Label_3x4_Goshudh.jsx";

export default function GoshudhPage() {
  const [rows, setRows] = useState([]);
  const [id, setId] = useState(null);
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(false);

  const previewRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("simple_labels")
        .select("*")
        .eq("brand", "Goshudh")
        .in("style_code", ["2x4in", "3x4in"])
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

  const row = useMemo(
    () => rows.find((r) => String(r.id) === String(id)) || null,
    [rows, id]
  );

  const dims = useMemo(() => {
    if (!row) return { w: 4, h: 3 };
    if (row.style_code === "2x4in") return { w: 4, h: 2 };
    return { w: 4, h: 3 }; // default 3x4
  }, [row]);

  const handleDownload = async () => {
    if (!previewRef.current || !row) return;
    await downloadNodeAsPdf(previewRef.current, {
      widthIn: dims.w,
      heightIn: dims.h,
      filename: `goshudh_${row.name || "label"}.pdf`,
      copies,
    });
  };

  const handleDirectPrint = async () => {
    if (!previewRef.current || !row) return;
    await printNodeDirect(previewRef.current, {
      widthIn: dims.w,
      heightIn: dims.h,
      copies,
      title: `Goshudh – ${row.style_code}`,
    });
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="md">
        <Title order={2}>Goshudh Stickers</Title>

        <Group gap="sm" wrap="wrap">
          <Select
            label="Product"
            placeholder="Select"
            value={id}
            onChange={(v) => setId(v || null)}
            searchable
            w={420}
            data={(rows || []).map((r) => ({
              value: String(r.id),
              label: `${r.name} (${r.net_weight_g}g) • ${r.style_code}`,
            }))}
          />
          <NumberInput
            label="Copies"
            min={1}
            value={copies}
            onChange={setCopies}
            w={120}
          />
          <Button color="green" onClick={handleDirectPrint} disabled={!row || loading}>
            Direct Print
          </Button>
          <Button color="blue" onClick={handleDownload} disabled={!row || loading}>
            Download PDF
          </Button>
        </Group>

        {loading && <Loader />}

        {!loading && !row && (
          <Card withBorder p="md">
            <Text c="dimmed">Pick a product to preview.</Text>
          </Card>
        )}

        {!loading && row && (
          <Card withBorder p="sm" style={{ background: "#fff" }}>
            <div
              ref={previewRef}
              style={{
                width: `${dims.w}in`,
                height: `${dims.h}in`,
                background: "#fff",
              }}
            >
              {row.style_code === "2x4in" ? (
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
