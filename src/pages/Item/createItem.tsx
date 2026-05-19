import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Box, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import { CreateItemProps, FormField, formFields } from "../../data/itemFormData";
import {
    createItem,
    createWorkflowItem,
    fetchWorkspaceItems,
    InsertImage,
} from "../../api/item";
import Loader from "../loader/loader";
import { showToast } from "../../contexts/ToastProvider";
import { useSearchParams, useNavigate } from "react-router-dom";

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

const CreateItem: React.FC<CreateItemProps> = ({ collectionId }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [dateParts, setDateParts] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
    });

    const [loading, setLoading] = useState(false);
    const [fileUri, setFileUri] = useState<string | undefined>();

    const [searchParams, setSearchParams] = useSearchParams();
    const [workspaceId, setWorkspaceId] = useState<string | undefined>(
        searchParams.get("workspaceId") || undefined
    );

    const navigate = useNavigate();

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    /* ---------------- WORKSPACE HANDLING ---------------- */
    useEffect(() => {
        if (!workspaceId) {
            const fetchAndSetWorkspaceId = async () => {
                try {
                    const id = await fetchWorkspaceItems(collectionId);
                    if (!id) return;

                    setWorkspaceId(id);
                    searchParams.set("workspaceId", id);
                    setSearchParams(searchParams);
                } catch (err) {
                    console.error("Workspace fetch failed:", err);
                }
            };
            fetchAndSetWorkspaceId();
        }
    }, [collectionId, workspaceId, searchParams, setSearchParams]);

    /* ---------------- FORM HANDLERS ---------------- */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (
        type: "year" | "month" | "day",
        value: number
    ) => {
        setDateParts((prev) => {
            const updated = { ...prev, [type]: value };
            const issuedDate = `${updated.year}-${String(updated.month).padStart(
                2,
                "0"
            )}-${String(updated.day).padStart(2, "0")}`;

            setFormData((prevData) => ({
                ...prevData,
                "dc.date.issued": issuedDate,
            }));

            return updated;
        });
    };

    /* ---------------- FILE HANDLING ---------------- */
    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        setSelectedFile(file);

        if (file.type === "application/pdf" && workspaceId) {
            try {
                const thumbBlob = await generateThumbnailFromPDF(file);
                const thumbFile = new File(
                    [thumbBlob],
                    "Thumbnail_TIT_01.jpg",
                    { type: "image/jpeg" }
                );
                await InsertImage(workspaceId, thumbFile);
            } catch (err) {
                console.error("Thumbnail generation failed:", err);
            }
        }
    };

    const generateThumbnailFromPDF = async (
        pdfFile: File
    ): Promise<Blob> => {
        const url = URL.createObjectURL(pdfFile);
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const thumbCanvas = document.createElement("canvas");
        const thumbCtx = thumbCanvas.getContext("2d");
        const thumbWidth = 300;
        const thumbHeight = (thumbWidth / canvas.width) * canvas.height;

        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        thumbCtx?.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);

        URL.revokeObjectURL(url);

        return new Promise((resolve, reject) => {
            thumbCanvas.toBlob(
                (blob) =>
                    blob
                        ? resolve(blob)
                        : reject(new Error("Thumbnail conversion failed")),
                "image/jpeg",
                0.9
            );
        });
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredFields = [
            "dc.empid",
            "dc.hrDocNo",
            "dc.DocType",
            "dc.EmpName",
            "dc.date.issued",
        ];

        const missing = requiredFields.filter(
            (f) => !formData[f]?.toString().trim()
        );

        if (missing.length > 0) {
            alert("Please fill all required fields.");
            return;
        }

        if (!selectedFile || !workspaceId) {
            alert("File or workspace missing.");
            return;
        }

        try {
            setLoading(true);

            const uploadedUri = await InsertImage(workspaceId, selectedFile);
            setFileUri(uploadedUri);

            await createItem(workspaceId, formData);

            if (uploadedUri) {
                await createWorkflowItem(uploadedUri);
                showToast("Item submitted successfully", "success");
                navigate("/adminSearch");
            }
        } catch (err) {
            console.error(err);
            alert("Item creation failed.");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- RENDER ---------------- */
    return (
        <Box className="create-item-container">
            <Typography variant="h5" gutterBottom>
                Create Item
            </Typography>

            {loading && <Loader />}

            <form onSubmit={handleSubmit}>
                {formFields.map((field: FormField) => (
                    <Box key={field.id} mb={2}>
                        {field.type === "date" ? (
                            <Box className="create-item-date-container">
                                {(["year", "month", "day"] as const).map(
                                    (type) => (
                                        <Box
                                            key={type}
                                            className="create-item-date-box"
                                        >
                                            <IconButton
                                                onClick={() =>
                                                    handleDateChange(
                                                        type,
                                                        dateParts[type] + 1
                                                    )
                                                }
                                            >
                                                <ArrowDropUp />
                                            </IconButton>

                                            <Select
                                                value={dateParts[type]}
                                                onChange={(e) =>
                                                    handleDateChange(
                                                        type,
                                                        Number(e.target.value)
                                                    )
                                                }
                                            >
                                                {Array.from(
                                                    {
                                                        length:
                                                            type === "year"
                                                                ? 200
                                                                : type ===
                                                                  "month"
                                                                ? 12
                                                                : 31,
                                                    },
                                                    (_, i) =>
                                                        type === "year"
                                                            ? new Date().getFullYear() +
                                                              i -
                                                              100
                                                            : i + 1
                                                ).map((v) => (
                                                    <MenuItem key={v} value={v}>
                                                        {v}
                                                    </MenuItem>
                                                ))}
                                            </Select>

                                            <IconButton
                                                onClick={() =>
                                                    handleDateChange(
                                                        type,
                                                        dateParts[type] - 1
                                                    )
                                                }
                                            >
                                                <ArrowDropDown />
                                            </IconButton>
                                        </Box>
                                    )
                                )}
                            </Box>
                        ) : (
                            <TextField
                                fullWidth
                                label={field.label}
                                name={field.name}
                                required={field.required}
                                onChange={handleChange}
                            />
                        )}
                    </Box>
                ))}

                <Box
                    className="upload-container"
                    onClick={() =>
                        document.getElementById("fileInput")?.click()
                    }
                >
                    <input
                        type="file"
                        id="fileInput"
                        hidden
                        onChange={handleFileChange}
                    />
                    <Typography>
                        ☁️ Upload a File
                    </Typography>
                </Box>

                {selectedFile && (
                    <Typography variant="body2" color="gray">
                        Selected File: {selectedFile.name}
                    </Typography>
                )}

                <Button type="submit" variant="contained">
                    Submit
                </Button>
            </form>
        </Box>
    );
};

export default CreateItem;
