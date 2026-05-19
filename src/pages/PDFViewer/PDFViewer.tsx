import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { searchPlugin } from "@react-pdf-viewer/search";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";

import { useSearchParams } from "react-router-dom";
import { siteConfig } from "../../data/data";
import Loader from "../loader/loader";
import "./PDFViewer.css";

import {
    Box,
    Paper,
    IconButton,
    TextField,
    Button,
    Slide,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { getAuthStatus } from "../../api/authApi";
import { updateUserCart } from "../../api/cart";
import { getAuthHeaders } from "../../api/searchApi";

type ItemMetadataResponse = {
    metadata?: Record<string, Array<{ value?: string }>>;
};

type OverlayControlsProps = {
    keyword: string;
    showForm: boolean;
    pageInput: string;
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
    setPageInput: React.Dispatch<React.SetStateAction<string>>;
    pageInputRef: React.RefObject<HTMLInputElement>;
    jumpToNextMatch: () => void;
    jumpToPreviousMatch: () => void;
    itemId: string | null;
    uuid: string | null;
};

const OverlayControls: React.FC<OverlayControlsProps> = ({
    keyword,
    showForm,
    pageInput,
    setShowForm,
    setPageInput,
    pageInputRef,
    jumpToNextMatch,
    jumpToPreviousMatch,
    itemId,
    uuid,
}) => (
    <Box
        sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
        }}
    >
        {keyword && (
            <Paper sx={{ p: 1, display: "flex", gap: 1 }}>
                <IconButton size="small" onClick={jumpToPreviousMatch}>
                    <KeyboardArrowUpIcon />
                </IconButton>
                <IconButton size="small" onClick={jumpToNextMatch}>
                    <KeyboardArrowDownIcon />
                </IconButton>
            </Paper>
        )}

        <IconButton
            color="primary"
            onClick={() => setShowForm((current) => !current)}
            sx={{
                position: "fixed",
                top: 16,
                right: 16,
                zIndex: 10000,
                bgcolor: "white",
                boxShadow: 3,
            }}
        >
            {showForm ? <CloseIcon /> : <AddIcon />}
        </IconButton>

        <Slide direction="down" in={showForm} mountOnEnter unmountOnExit>
            <Paper sx={{ mt: 1, width: 280, p: 2 }}>
                <Typography variant="subtitle1">Enter Pages</Typography>

                <TextField
                    fullWidth
                    size="small"
                    label="e.g. 1,2,5-8"
                    value={pageInput}
                    inputRef={pageInputRef}
                    onChange={(e) => setPageInput(e.target.value)}
                    sx={{ my: 2 }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    onClick={async () => {
                        if (!pageInput.trim()) {
                            alert("Invalid pages");
                            return;
                        }

                        const userId = await getAuthStatus();
                        if (!userId) {
                            alert("User not authenticated");
                            return;
                        }

                        const today = new Date().toISOString().split("T")[0];
                        const payload = `${itemId}_${uuid}_${today}_${pageInput}`;

                        await updateUserCart(userId, payload);
                        alert("Document added successfully");

                        setShowForm(false);
                        setPageInput("");
                    }}
                >
                    Add to My List
                </Button>
            </Paper>
        </Slide>

    </Box>
);

const PDFViewer: React.FC = () => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assetId, setAssetId] = useState<string>("-");

    const [showForm, setShowForm] = useState(false);
    const [pageInput, setPageInput] = useState("");
    const pageInputRef = useRef<HTMLInputElement>(null);

    const [searchParams] = useSearchParams();
    const uuid = searchParams.get("uuid");
    const itemId = searchParams.get("itemId");
    const keyword = searchParams.get("keyword") || "";

    /* ---------------- PLUGINS ---------------- */
    const searchPluginInstance = searchPlugin();
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const {
        highlight,
        jumpToNextMatch,
        jumpToPreviousMatch,
    } = searchPluginInstance;

    /* ---------------- AUTO FOCUS ---------------- */
    useEffect(() => {
        if (showForm && pageInputRef.current) {
            pageInputRef.current.focus();
        }
    }, [showForm]);

    /* ---------------- FETCH PDF (FIXED) ---------------- */
    useEffect(() => {
        let blobUrl: string | null = null;

        const fetchPDF = async () => {
            try {
                setLoading(true);
                const headers = getAuthHeaders();

                const res = await axios.get<Blob>(
                    `${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content`,
                    {
                        headers,
                        responseType: "blob",
                    }
                );

                blobUrl = URL.createObjectURL(res.data);
                setPdfUrl(blobUrl);
            } catch (err) {
                console.error(err);
                setError("Failed to load PDF");
            } finally {
                setLoading(false);
            }
        };

        if (uuid) fetchPDF();

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [uuid]);

    useEffect(() => {
        const fetchAssetId = async () => {
            if (!itemId) {
                setAssetId("-");
                return;
            }

            try {
                const headers = getAuthHeaders();
                const response = await axios.get<ItemMetadataResponse>(
                    `${siteConfig.apiEndpoint}/api/core/items/${itemId}`,
                    { headers }
                );
                const metadata = response.data?.metadata || {};
                const value = metadata?.["dc.assetid"]?.[0]?.value || "-";
                setAssetId(value);
            } catch (fetchErr) {
                console.error("Failed to fetch dc.assetid", fetchErr);
                setAssetId("-");
            }
        };

        fetchAssetId();
    }, [itemId]);

    /* ---------------- AUTO SEARCH + JUMP ---------------- */
    useEffect(() => {
        if (!keyword || !pdfUrl) return;

        const timer = setTimeout(() => {
            highlight({
                keyword,
                matchCase: false,
                wholeWords: false,
            });

            jumpToNextMatch();
        }, 600);

        return () => clearTimeout(timer);
    }, [keyword, pdfUrl]);

    if (loading) return <Loader />;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <Box display="flex" justifyContent="center" minHeight="100vh" bgcolor="#f5f5f5" p={2}>
            <Paper
                elevation={3}
                sx={{
                    width: "100%",
                    maxWidth: 900,
                    height: "90vh",
                    position: "relative",
                }}
            >
                <Paper
                    sx={{
                        position: "fixed",
                        top: 16,
                        left: 16,
                        zIndex: 10000,
                        px: 1.5,
                        py: 0.75,
                        fontSize: "0.85rem",
                    }}
                >
                    {`dc.assetid: ${assetId}`}
                </Paper>
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                    {pdfUrl && (
                        <Viewer
                            fileUrl={pdfUrl}
                            plugins={[defaultLayoutPluginInstance, searchPluginInstance]}
                        />
                    )}
                    <OverlayControls
                        keyword={keyword}
                        showForm={showForm}
                        pageInput={pageInput}
                        setShowForm={setShowForm}
                        setPageInput={setPageInput}
                        pageInputRef={pageInputRef}
                        jumpToNextMatch={jumpToNextMatch}
                        jumpToPreviousMatch={jumpToPreviousMatch}
                        itemId={itemId}
                        uuid={uuid}
                    />
                </Worker>
            </Paper>
        </Box>
    );
};

export default PDFViewer;
