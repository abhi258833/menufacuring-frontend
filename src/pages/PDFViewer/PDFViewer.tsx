import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { searchPlugin } from "@react-pdf-viewer/search";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";

import { useNavigate, useSearchParams } from "react-router-dom";
import { siteConfig } from "../../data/data";
import Loader from "../loader/loader";
import "./PDFViewer.css";

import {
    Box,
    Paper,
    TextField,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    IconButton,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";

import { getAuthStatus } from "../../api/authApi";
import { updateUserCart } from "../../api/cart";
import { getAuthHeaders } from "../../api/searchApi";

const PDFViewer: React.FC = () => {
    const navigate = useNavigate();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [pageInput, setPageInput] = useState("");
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const pageInputRef = useRef<HTMLInputElement>(null);
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const autoSearchKeyRef = useRef<string>("");

    const [searchParams] = useSearchParams();
    const uuid = searchParams.get("uuid");
    const itemId = searchParams.get("itemId");
    const keyword = searchParams.get("keyword") || searchParams.get("keywords") || "";
    const fileName = decodeURIComponent(searchParams.get("name") || "document.pdf");
    const initialSearchKeyword = keyword.trim();

    const syncBuiltInSearchInput = (value: string) => {
        if (!value) return false;

        const searchInput = document.querySelector<HTMLInputElement>(
            ".rpv-search__popover-input, input[placeholder='Enter to search']"
        );

        if (!searchInput) return false;

        const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set;

        nativeSetter?.call(searchInput, value);
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    };

    const triggerBuiltInSearchSubmit = () => {
        const searchInput = document.querySelector<HTMLInputElement>(
            ".rpv-search__popover-input, input[placeholder='Enter to search']"
        );

        if (!searchInput) return false;

        const keyDown = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        });

        const keyUp = new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        });

        searchInput.dispatchEvent(keyDown);
        searchInput.dispatchEvent(keyUp);
        return true;
    };

    const ensureBuiltInSearchPopoverOpen = () => {
        const existingInput = document.querySelector<HTMLInputElement>(
            ".rpv-search__popover-input, input[placeholder='Enter to search']"
        );

        if (existingInput) return true;

        const popoverButton = document.querySelector<HTMLButtonElement>(
            "button[data-testid='search__popover-button'], .rpv-search__popover-button"
        );

        if (!popoverButton) return false;

        const expanded = popoverButton.getAttribute("aria-expanded") === "true";
        if (!expanded) {
            popoverButton.click();
        }

        return true;
    };

    /* ---------------- PLUGINS ---------------- */
    const searchPluginInstance = searchPlugin({
        keyword: undefined,
    });
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: () => [],
    });

    /* ---------------- AUTO FOCUS ---------------- */
    useEffect(() => {
        if (showForm && pageInputRef.current) {
            pageInputRef.current.focus();
        }
    }, [showForm]);

    const handleBack = () => {
        if (itemId) {
            navigate(`/items/${itemId}`);
            return;
        }
        navigate(-1);
    };

    const handleOpenFlipBook = () => {
        if (!uuid) return;
        const params = new URLSearchParams();
        params.set("uuid", uuid);
        if (itemId) params.set("itemId", itemId);
        if (keyword) params.set("keyword", keyword);
        if (fileName) params.set("name", fileName);
        window.location.href = `/flip-book-viewer?${params.toString()}`;
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = fileName;
        a.click();
    };

    const handleFullScreen = async () => {
        if (!viewerContainerRef.current) return;

        if (!document.fullscreenElement) {
            await viewerContainerRef.current.requestFullscreen();
            return;
        }

        await document.exitFullscreen();
    };

    const handleAddToCart = async () => {
        if (!pageInput.trim()) {
            alert("Invalid pages");
            return;
        }

        if (!itemId || !uuid) {
            alert("Missing item context");
            return;
        }

        try {
            setIsAddingToCart(true);
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
        } finally {
            setIsAddingToCart(false);
        }
    };

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
        if (!initialSearchKeyword || !pdfUrl) return;

        const searchKey = `${uuid || ""}::${initialSearchKeyword}`;
        if (autoSearchKeyRef.current === searchKey) return;

        const bootstrapSearch = () => {
            if (!ensureBuiltInSearchPopoverOpen()) return false;
            if (!syncBuiltInSearchInput(initialSearchKeyword)) return false;
            if (!triggerBuiltInSearchSubmit()) return false;

            autoSearchKeyRef.current = searchKey;
            return true;
        };

        if (bootstrapSearch()) {
            return;
        }

        const observer = new MutationObserver(() => {
            if (bootstrapSearch()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [initialSearchKeyword, pdfUrl]);

    if (loading) return <Loader />;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <Box className="pdf-viewer-screen">
            <Paper
                elevation={3}
                ref={viewerContainerRef}
                sx={{
                    width: "100%",
                    maxWidth: 1400,
                    height: "94vh",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 3,
                }}
            >
                <Box className="pdf-viewer-shell">
                    <Box className="pdf-viewer-header">
                        <Box className="pdf-header-left">
                            <Button
                                className="pdf-pill-btn"
                                startIcon={<ArrowBackIcon />}
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                            <Typography className="pdf-file-name" title={fileName}>
                                {fileName}
                            </Typography>
                        </Box>

                        <Box className="pdf-header-actions">
                            <Button className="pdf-mode-btn pdf-mode-btn-active" startIcon={<PictureAsPdfIcon />}>
                                PDF View
                            </Button>
                            <Button className="pdf-mode-btn" startIcon={<MenuBookIcon />} onClick={handleOpenFlipBook}>
                                Flip Book
                            </Button>
                            <IconButton className="pdf-icon-btn" onClick={handleFullScreen}>
                                <OpenInFullIcon />
                            </IconButton>
                            <Button className="pdf-mode-btn" startIcon={<DownloadIcon />} onClick={handleDownload}>
                                Download
                            </Button>
                            <Button
                                className="pdf-mode-btn"
                                startIcon={<AddShoppingCartIcon />}
                                onClick={() => setShowForm(true)}
                            >
                                Add to Cart
                            </Button>
                        </Box>
                    </Box>

                    <Box className="pdf-viewer-content">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                            {pdfUrl && (
                                <Viewer
                                    fileUrl={pdfUrl}
                                    plugins={[defaultLayoutPluginInstance, searchPluginInstance]}
                                />
                            )}
                        </Worker>
                    </Box>
                </Box>
            </Paper>

            <Dialog open={showForm} onClose={() => setShowForm(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Pages To Cart</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        size="small"
                        label="Pages (e.g. 1,2,5-8)"
                        value={pageInput}
                        inputRef={pageInputRef}
                        onChange={(e) => setPageInput(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddToCart} disabled={isAddingToCart}>
                        {isAddingToCart ? "Adding..." : "Add to Cart"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PDFViewer;
