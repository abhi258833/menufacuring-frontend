import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { getAuthHeaders } from "../../api/searchApi";

pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.mjs`;

type PDFViewerProps = {
    fileUrl: string;
    fileName?: string;
    className?: string;
};

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName = "document.pdf", className }) => {
    const [fileData, setFileData] = useState<Uint8Array | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [matches, setMatches] = useState<Array<{ page: number; index: number }>>([]);
    const [pageTexts, setPageTexts] = useState<string[]>([]);
    const currentMatchRef = useRef(0);

    useEffect(() => {
        let mounted = true;

        const fetchPDF = async () => {
            try {
                setLoading(true);
                setError(null);
                const headers = getAuthHeaders();
                const res = await axios.get<ArrayBuffer>(fileUrl, {
                    headers,
                    responseType: "arraybuffer",
                });
                if (!mounted) return;
                setFileData(new Uint8Array(res.data));
            } catch (err: any) {
                console.error("PDF fetch error", err?.response || err);
                setError(err?.message || "Failed to load PDF");
            } finally {
                setLoading(false);
            }
        };

        if (fileUrl) {
            fetchPDF();
        }

        return () => {
            mounted = false;
        };
    }, [fileUrl]);

    useEffect(() => {
        if (!searchTerm) {
            setMatches([]);
            currentMatchRef.current = 0;
            return;
        }

        const term = searchTerm.toLowerCase();
        const found: Array<{ page: number; index: number }> = [];

        pageTexts.forEach((text, index) => {
            const lc = text.toLowerCase();
            let pos = lc.indexOf(term);
            while (pos !== -1) {
                found.push({ page: index + 1, index: pos });
                pos = lc.indexOf(term, pos + term.length);
            }
        });

        setMatches(found);
        if (found.length > 0) {
            currentMatchRef.current = 0;
            setPageNumber(found[0].page);
        }
    }, [searchTerm, pageTexts]);

    const onDocumentLoadSuccess = async (pdf: any) => {
        setNumPages(pdf.numPages);
        const texts: string[] = [];

        for (let i = 1; i <= pdf.numPages; i += 1) {
            try {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                texts.push(content.items.map((item: any) => item.str).join(" "));
            } catch {
                texts.push("");
            }
        }

        setPageTexts(texts);
    };

    if (loading) return <div style={{ padding: 16 }}>Loading PDF…</div>;
    if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>;

    return (
        <div className={className} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 8, padding: 8, alignItems: "center" }}>
                <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))}>Prev</button>
                <button onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}>Next</button>
                <span>Page {pageNumber} / {numPages}</span>
                <button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}>Zoom -</button>
                <button onClick={() => setScale((s) => s + 0.25)}>Zoom +</button>
                <button onClick={() => setRotation((r) => (r + 90) % 360)}>Rotate</button>
                <input
                    placeholder="Search text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginLeft: "auto" }}
                />
                <button
                    onClick={() => {
                        if (matches.length === 0) return;
                        currentMatchRef.current = (currentMatchRef.current - 1 + matches.length) % matches.length;
                        setPageNumber(matches[currentMatchRef.current].page);
                    }}
                    disabled={matches.length === 0}
                >
                    ▲
                </button>
                <button
                    onClick={() => {
                        if (matches.length === 0) return;
                        currentMatchRef.current = (currentMatchRef.current + 1) % matches.length;
                        setPageNumber(matches[currentMatchRef.current].page);
                    }}
                    disabled={matches.length === 0}
                >
                    ▼
                </button>
                <button
                    data-testid="get-file__download-button"
                    onClick={() => {
                        if (!fileData) return;
                        const buffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);
                        const blob = new Blob([buffer as BlobPart], { type: "application/pdf" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = fileName;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    Download
                </button>
                <button data-testid="print__button" onClick={() => window.print()}>Print</button>
            </div>

            <div style={{ overflow: "auto", flex: 1, padding: 8 }}>
                {fileData && (
                    <Document file={{ data: fileData }} onLoadSuccess={onDocumentLoadSuccess}>
                        {Array.from(new Array(numPages), (_el, index) => (
                            <div key={`page_${index + 1}`} data-page-number={index + 1} style={{ marginBottom: 12 }}>
                                <Page
                                    pageNumber={index + 1}
                                    scale={scale}
                                    rotate={rotation}
                                    customTextRenderer={(textItem: any) => {
                                        if (!searchTerm) return textItem.str;
                                        const re = new RegExp(`(${searchTerm})`, "ig");
                                        const parts = textItem.str.split(re);
                                        return parts.map((part: string, i: number) =>
                                            re.test(part) ? <mark key={i} className="pdf-highlight">{part}</mark> : part
                                        );
                                    }}
                                />
                            </div>
                        ))}
                    </Document>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;
