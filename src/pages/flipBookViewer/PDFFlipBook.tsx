import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import { Box, CircularProgress, Container, IconButton, Paper, InputBase, Divider, Typography } from "@mui/material";
import { getPDFUrl } from "../../api/bitstream";
import { showToast } from "../../contexts/ToastProvider";
import Loader from "../loader/loader";
import { ChevronLeft, ChevronRight, Search, KeyboardArrowLeft, KeyboardArrowRight, Close, ArrowBack } from "@mui/icons-material";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

const getAuthHeaders = (): Record<string, string> => {
  const authToken = localStorage.getItem("authToken") || "";
  const csrfToken = localStorage.getItem("csrfToken") || "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) headers["Authorization"] = authToken;
  if (csrfToken) headers["X-XSRF-TOKEN"] = csrfToken;

  return headers;
};

const PDFFlipBook: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get("uuid");
  const itemId = searchParams.get("itemId");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const bookRef = useRef<React.ElementRef<typeof HTMLFlipBook>>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [matches, setMatches] = useState<
    { pageIndex: number; left: number; top: number; width: number; height: number }[]
  >([]);
  const [matchIdx, setMatchIdx] = useState(0);

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const pageBatchSize = 10;
  let blurTimeout: NodeJS.Timeout;

  const updateCurrentPage = useCallback(() => {
    if (bookRef.current) {
      const flipbook = bookRef.current.pageFlip();
      setCurrentPage(flipbook.getCurrentPageIndex());
    }
  }, []);

  const goNext = useCallback(() => {
    if (bookRef.current) {
      const flipbook = bookRef.current.pageFlip();
      flipbook.flipNext();
    }
  }, [updateCurrentPage]);

  const goPrev = useCallback(() => {
    if (bookRef.current) {
      const flipbook = bookRef.current.pageFlip();
      flipbook.flipPrev();
    }
  }, [updateCurrentPage]);

  useEffect(() => {
    const flipbook = bookRef.current?.pageFlip();
    if (flipbook) {
      const handleFlip = (e: { data: number }) => {
        setCurrentPage(e.data);
      };

      flipbook.on("flip", handleFlip);
      setIsInitialized(true);

      return () => {
        flipbook.off("flip", handleFlip);
      };
    }
  }, [bookRef.current]);

  useEffect(() => {
    if (uuid) {
      setFileUrl(getPDFUrl(uuid));
    }
  }, [uuid]);

  useEffect(() => {
    if (!fileUrl) return;

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          httpHeaders: getAuthHeaders(),
        });

        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);

        const loadPages = async (start: number, count: number) => {
          const pageImages: string[] = [];
          for (let i = start; i < Math.min(start + count, pdf.numPages); i++) {
            const page = await pdf.getPage(i + 1);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;
            pageImages.push(canvas.toDataURL("image/png"));
          }
          setPages((prevPages) => [...prevPages, ...pageImages]);
        };

        await loadPages(0, pageBatchSize);

        let currentPage = pageBatchSize;
        const loadRemainingPages = async () => {
          while (currentPage < pdf.numPages) {
            await loadPages(currentPage, pageBatchSize);
            currentPage += pageBatchSize;
          }
        };

        setTimeout(loadRemainingPages, 100);
      } catch (error) {
        setError("Failed to load PDF");
        console.error("PDF load error:", error);
      }
    };

    loadPDF();
  }, [fileUrl]);
  // jump FlipBook to a specific page
  const jumpToPage = (page: number) => {
    bookRef.current?.pageFlip().flip(page);
  };

  // run a brand‑new search
  const runSearch = async () => {
    const term = searchText.trim().toLowerCase();
    if (!term || !pdfDocRef.current) {
      setMatches([]);
      setMatchIdx(0);
      return;
    }

    const pdf = pdfDocRef.current;
    const newHits: typeof matches = [];

    // walk every page, collect bounding boxes of matches
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: 2 });
      const text = await page.getTextContent();

      (text.items as TextItem[]).forEach((item) => {
        const str = item.str;
        const norm = str.toLowerCase();
        let from = norm.indexOf(term);

        // the same text item can contain several matches
        while (from !== -1) {
          /* ----- position math -----
           * transform matrix: [ a b c d e f ]
           * canvas x = e, y = f  (PDF origin bottom‑left)
          */
          const [, , , , x, y] = item.transform;
          const w = (item.width * term.length) / str.length;
          const h = item.height;

          newHits.push({
            pageIndex: n - 1,
            left: (x / viewport.width) * 100,                 // %
            top: ((viewport.height - y) / viewport.height) * 100,
            width: (w / viewport.width) * 100,
            height: (h / viewport.height) * 100,
          });

          from = norm.indexOf(term, from + term.length);      // find next in same item
        }
      });
    }

    setMatches(newHits);
    setMatchIdx(0);
    if (newHits.length) jumpToPage(newHits[0].pageIndex);
  };

  const gotoNext = () => {
    if (!matches.length) return;
    const next = (matchIdx + 1) % matches.length;
    setMatchIdx(next);
    jumpToPage(matches[next].pageIndex);
  };

  const gotoPrev = () => {
    if (!matches.length) return;
    const prev = (matchIdx - 1 + matches.length) % matches.length;
    setMatchIdx(prev);
    jumpToPage(matches[prev].pageIndex);
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      const blockedCombos = [
        ctrl && key === "p",
        ctrl && key === "s",
        ctrl && shift && key === "i",
        ctrl && shift && key === "j",
        ctrl && shift && key === "c",
        key === "printscreen",
        ctrl && key === "u",
      ];

      if (blockedCombos.some(Boolean)) {
        event.preventDefault();
        setIsBlocked(true);
        showToast("🔒 Action Blocked", "warning");
        setTimeout(() => setIsBlocked(false), 3000);
      }

      if (key === "arrowright") {
        event.preventDefault();
        goNext();
      } else if (key === "arrowleft") {
        event.preventDefault();
        goPrev();
      }

      if (event.key === "Meta" || event.key === "OS") {
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 5000);
      }
    };

    const handleBlur = () => {
      blurTimeout = setTimeout(() => {
        if (!isBlocked) setIsBlocked(true);
      }, 300);
    };

    const handleFocus = () => {
      clearTimeout(blurTimeout);
      setTimeout(() => setIsBlocked(false), 300);
    };

    const disableRightClick = (event: MouseEvent) => {
      event.preventDefault();
      showToast("🔒 Right-click disabled!", "warning");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", disableRightClick);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", disableRightClick);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentPage, numPages]);

  return (
    <Container
      sx={{
        position: "fixed",
        top: 0,
        left: 40,
        width: "100vw",
        height: "100vh",
        padding: 0,
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          @media print {
            body * {
              display: none !important;
            }
          }

          body {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            overflow: hidden;
            margin: 0;
            padding: 0;
          }

          html {
            overflow: hidden;
          }
        `}
      </style>

      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : pages.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            backgroundColor: "#f4f7f6",
            position: "relative",
          }}
        >
          <IconButton
            onClick={goPrev}
            sx={{
              display: { xs: "none", sm: "flex" },
              zIndex: 10,
              backgroundColor: "background.paper",
              boxShadow: 2,
              "&:hover": { backgroundColor: "action.hover" },
              "&.Mui-disabled": { opacity: 0.5 },
              position: "absolute",
              left: 10,
            }}
            size="large"
            disabled={currentPage <= 0 || !isInitialized}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 50,
              display: "flex",
              gap: 1.5,
            }}
          >
            <IconButton
              onClick={() => {
                window.close();
                if (itemId) {
                  navigate(`/items/${itemId}`);
                }
              }}
              sx={{
                backgroundColor: "background.paper",
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                "&:hover": { backgroundColor: "action.hover" },
              }}
              title="Close Viewer"
            >
              <Close />
            </IconButton>

            {itemId && (
              <IconButton
                onClick={() => navigate(`/items/${itemId}`)}
                sx={{
                  backgroundColor: "background.paper",
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  "&:hover": { backgroundColor: "action.hover" },
                }}
                title="Back to Book Details"
              >
                <ArrowBack />
              </IconButton>
            )}

            <IconButton
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              sx={{
                backgroundColor: "background.paper",
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                "&:hover": { backgroundColor: "action.hover" },
                color: isSearchVisible ? "primary.main" : "inherit",
              }}
              title={isSearchVisible ? "Hide Search Bar" : "Show Search Bar"}
            >
              <Search />
            </IconButton>
          </Box>

          {isSearchVisible && (
            <Paper
              component="form"
              onSubmit={(e) => { e.preventDefault(); runSearch(); }}
              sx={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 50,
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: { xs: 300, sm: 400 },
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                borderRadius: '8px'
              }}
            >
              <InputBase
                sx={{ ml: 2, flex: 1 }}
                placeholder="Search in document..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <IconButton type="submit" sx={{ p: '10px' }} aria-label="search" color="primary">
                <Search />
              </IconButton>
              <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
              <IconButton color="primary" sx={{ p: '10px' }} onClick={gotoPrev} disabled={!matches.length}>
                <KeyboardArrowLeft />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
                {matches.length ? `${matchIdx + 1}/${matches.length}` : '0/0'}
              </Typography>
              <IconButton color="primary" sx={{ p: '10px' }} onClick={gotoNext} disabled={!matches.length}>
                <KeyboardArrowRight />
              </IconButton>
            </Paper>
          )}

          <Box
            sx={{
              flexGrow: 1,
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isBlocked && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "black",
                  zIndex: 10,
                  opacity: 1,
                  transition: "opacity 0.3s ease-in-out",
                }}
              />
            )}

            <HTMLFlipBook
              ref={bookRef}
              width={window.innerWidth > 768 ? 500 : 300}
              height={window.innerWidth > 768 ? 700 : 450}
              className="my-flipbook"
              style={{
                margin: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              onFlip={(e) => setCurrentPage(e.data)}
              startPage={0}
              size="stretch"
              minWidth={250}
              maxWidth={800}
              minHeight={350}
              maxHeight={1200}
              drawShadow={true}
              flippingTime={1000}
              usePortrait={true}
              showPageCorners={true}
              startZIndex={0}
              autoSize={true}
              maxShadowOpacity={0.5}
              mobileScrollSupport={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showCover={true}
              disableFlipByClick={false}
            >
              {Array.from({ length: numPages }).map((_, index) => (
                <div key={index} className="page">
                  {pages[index] ? (
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <img
                        ref={(el) => {
                          if (el) {
                            el.dataset.pageIndex = index.toString();
                          }
                        }}
                        src={pages[index]}
                        alt={`Page ${index + 1}`}
                        style={{ width: "100%", height: "100%", display: "block" }}
                      />

                      {matches
                        .filter((m) => m.pageIndex === index)
                        .map((m, i) => (
                          <span
                            key={i}
                            style={{
                              position: "absolute",
                              left: `${m.left}%`,
                              top: `${m.top}%`,
                              width: `${m.width}%`,
                              height: `${m.height}%`,
                              backgroundColor: "yellow",
                              opacity: 0.6,
                              borderRadius: 2,
                              pointerEvents: "none",
                            }}
                          />
                        ))}
                    </div>


                  ) : (
                    <p>Loading...</p>
                  )}
                </div>
              ))}
            </HTMLFlipBook>
          </Box>

          <IconButton
            onClick={goNext}
            sx={{
              display: { xs: "none", sm: "flex" },
              zIndex: 10,
              backgroundColor: "background.paper",
              boxShadow: 2,
              "&:hover": { backgroundColor: "action.hover" },
              "&.Mui-disabled": { opacity: 0.5 },
              position: "absolute",
              right: 10,
            }}
            size="large"
            disabled={currentPage >= numPages - 2 || !isInitialized}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        </Box>
      ) : (
        <Loader />
      )}
    </Container>
  );
};

export default PDFFlipBook;