import { useEffect, useRef, useState, useMemo } from "react";
import {
    Button,
    Card,
    Container,
    Group,
    Loader,
    NumberInput,
    MultiSelect,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { supabase } from "../supabaseClient.js";
import { downloadNodeAsPdf } from "../lib/exportSingle.js";
import { printNodeDirect } from "../lib/printDirect.js";
import { Label_2x4_Groshaat_Combo } from "../templates/Label_2x4_Groshaat_Combo.jsx";

export default function GroshaatComboPage() {
    const [rows, setRows] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [copies, setCopies] = useState(1);
    const [loading, setLoading] = useState(false);

    const previewRef = useRef(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("simple_labels")
                .select("id, name, net_weight_g, mrp")
                .eq("brand", "Groshaat")
                .eq("is_active", true)
                .order("name", { ascending: true });

            if (!error) {
                setRows(data || []);
            } else {
                console.error(error);
            }
            setLoading(false);
        })();
    }, []);

    const comboData = useMemo(() => {
        if (!selectedIds.length) return null;

        const selectedRows = rows.filter((r) => selectedIds.includes(String(r.id)));
        if (!selectedRows.length) return null;

        // Weight Calculation
        let totalWeightG = 0;
        let totalMrp = 0;

        selectedRows.forEach(r => {
            totalWeightG += (Number(r.net_weight_g) || 0);
            totalMrp += (Number(r.mrp) || 0);
        });

        // Format weight
        let weightText = "";
        if (totalWeightG >= 1000) {
            weightText = `${(totalWeightG / 1000).toFixed(totalWeightG % 1000 === 0 ? 0 : 2)}Kg`;
        } else {
            weightText = `${totalWeightG}g`;
        }

        const today = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const packedOnMonth = months[today.getMonth()];
        const packedOnYear = today.getFullYear();

        return {
            comboUnitContent: selectedRows.length,
            comboNetWeight: weightText,
            comboMrp: totalMrp,
            packedOnMonth,
            packedOnYear
        };
    }, [selectedIds, rows]);


    const handleDownload = async () => {
        if (!previewRef.current || !comboData) return;
        await downloadNodeAsPdf(previewRef.current, {
            widthIn: 4,
            heightIn: 2,
            filename: `groshaat_combo.pdf`,
            copies,
        });
    };

    const handleDirectPrint = async () => {
        if (!previewRef.current || !comboData) return;
        await printNodeDirect(previewRef.current, {
            widthIn: 4,
            heightIn: 2,
            copies,
            title: `Groshaat Combo`,
        });
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="md">
                <Title order={2}>Groshaat Combo Stickers</Title>

                <Group gap="sm" align="flex-end">
                    <MultiSelect
                        label="Select Products for Combo"
                        placeholder="Pick items"
                        data={rows.map((r) => ({
                            value: String(r.id),
                            label: `${r.name} (${r.net_weight_g}g) - ₹${r.mrp}`,
                        }))}
                        value={selectedIds}
                        onChange={setSelectedIds}
                        searchable
                        nothingFoundMessage="No items found..."
                        hidePickedOptions
                        w={500}
                    />
                    <NumberInput
                        label="Copies"
                        min={1}
                        value={copies}
                        onChange={setCopies}
                        w={100}
                    />
                    <Button color="green" onClick={handleDirectPrint} disabled={!comboData || loading}>
                        Print
                    </Button>
                    <Button color="blue" onClick={handleDownload} disabled={!comboData || loading}>
                        Download PDF
                    </Button>
                </Group>

                {loading && <Loader />}

                {!loading && !comboData && (
                    <Card withBorder p="md">
                        <Text c="dimmed">Select items to see the combo preview.</Text>
                    </Card>
                )}

                {!loading && comboData && (
                    <Card withBorder p="sm" style={{ background: "#fff", width: "fit-content" }}>
                        <div
                            ref={previewRef}
                            style={{
                                width: "4in",
                                height: "2in",
                                background: "#fff",
                            }}
                        >
                            <Label_2x4_Groshaat_Combo data={comboData} />
                        </div>
                    </Card>
                )}
            </Stack>
        </Container>
    );
}
