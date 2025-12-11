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
import { Label_2x4_Goshudh_Combo } from "../templates/Label_2x4_Goshudh_Combo.jsx";

export default function GoshudhComboPage() {
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
                .eq("brand", "Goshudh")
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

        // 1. Unit Content: "2" or count of items? 
        // The requirement image says "Unit Content : 2". 
        // It implies the COUNT of items in the combo.
        // "choice all the items which the combo consits according to it yu will give value to headers unit content: should give the items in the combo"
        // Wait, the prompt said: "unit content: should give the items in the combo"
        // BUT the image shows "Unit Content : 2".
        // AND prompt says: "according to it yu will give value to headers unit content: should give the items in the combo"
        // This is slightly contradictory or I might differ from image.
        // "Unit Content" usually means quantity.
        // Let's look closely at the prompt: "unit content: should give the items in the combo"
        // This suggests listing the items. But the image showed "2".
        // I will list the count for now based on image, BUT prompt text "give the items in the combo" implies names?
        // Let's re-read: "according to it yu will give value to headers unit content: should give the items in the combo"
        // This phrasing "give the items" usually means listing them. 
        // But then "Unit Content : 2" in image.
        // I will follow the TEXT instruction "give the items in the combo" -> list of names.
        // Wait, "Unit Content" in FSSAI usually means quantity/number.
        // Let's assume user wants the count if they said "unit content: should give the items". 
        // Actually, "should give the items in the combo" sounds like listing.
        // HOWEVER, listing multiple long names in that small space (2x4) might be hard.
        // The image has "Unit Content : 2". 
        // Let's do Count for now because it fits 2x4 "Unit Content".
        // If I list names, it will overflow.
        // WAIT. Re-reading again. "unit content: should give the items in the combo". 
        // Maybe they mean "Number of items"? 
        // Let's stick to the image as "exactly like image" is emphasized. Image has "2".
        // So I will put the COUNT.

        // UPDATE: "according to it yu will give value to headers unit content: should give the items in the combo"
        // Maybe they mean the input is selecting items, and unit content should reflect that?
        // I will stick to COUNT to be safe with the layout 2x4. Listing names will definitely break layout.
        // Actually, maybe "Unit Content" is just the number of packs?
        // Let's try to infer from "Net Weight".
        // If I select 2 items, Net Weight is sum.
        // I will use `selectedRows.length` as Unit Content.

        // RE-EVALUATION: "unit content: should give the items in the combo" -> This might actually mean listing keys? 
        // No, "items" usually means the products.
        // Let's allow valid text.
        // I will use the count for now to match Image.

        // Weight Calculation
        let totalWeightG = 0;
        let totalMrp = 0;

        selectedRows.forEach(r => {
            // Simple addition of grams
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
            comboUnitContent: selectedRows.length, // Matching "2" from image
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
            filename: `goshudh_combo.pdf`,
            copies,
        });
    };

    const handleDirectPrint = async () => {
        if (!previewRef.current || !comboData) return;
        await printNodeDirect(previewRef.current, {
            widthIn: 4,
            heightIn: 2,
            copies,
            title: `Goshudh Combo`,
        });
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="md">
                <Title order={2}>Goshudh Combo Stickers</Title>

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
                            <Label_2x4_Goshudh_Combo data={comboData} />
                        </div>
                    </Card>
                )}
            </Stack>
        </Container>
    );
}
