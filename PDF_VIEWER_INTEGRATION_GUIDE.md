# PDF Viewer Integration Guide

This document explains how the PDF viewer system works in DSpace React application, enabling you to integrate similar functionality into other projects.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Flow](#architecture--flow)
3. [URL Structure & Query Parameters](#url-structure--query-parameters)
4. [Component Breakdown](#component-breakdown)
5. [API Integration](#api-integration)
6. [Authentication & Security](#authentication--security)
7. [Feature Details](#feature-details)
8. [Integration for Other Projects](#integration-for-other-projects)

---

## System Overview

The PDF viewer system allows users to:
- Open PDF files associated with items (called "Bitstreams" in DSpace)
- Search for keywords within PDFs
- Navigate through pages with keyboard shortcuts
- Add specific page ranges to cart for download
- View PDFs in multiple formats (Standard PDF Viewer or Flip Book)
- Download PDFs with optional watermark

### Key Components
- **BookDetails** (`src/pages/book-detail/bookDetails.tsx`) - Item details page with action buttons
- **PDFViewer** (`src/pages/PDFViewer/PDFViewer.tsx`) - Main PDF viewer component
- **Routing** (`src/routing/AppRoutes.tsx`) - Routes configuration
- **APIs** (`src/api/`) - Backend API calls for fetching PDFs and metadata

---

## Architecture & Flow

### User Flow Diagram

```
1. User navigates to Item Details Page (/items/:id)
                    ↓
2. Item metadata & bitstreams are loaded
                    ↓
3. User clicks "View PDF" button
                    ↓
4. URL opens: /pdf-viewer?uuid={bitstream-uuid}&itemId={item-id}&keyword={search-term}
                    ↓
5. PDFViewer component fetches PDF content from API
                    ↓
6. PDF renders using react-pdf-viewer library
                    ↓
7. User can search, navigate, and interact with PDF
```

### Detailed Component Interaction

```
BookDetails Page
├── Fetches item metadata via fetchItemDetails(itemId)
├── Fetches item bundles (ORIGINAL, THUMBNAIL)
├── Filters PDF files from bitstreams
└── Renders action buttons that link to PDFViewer
    ├── View PDF button (single PDF scenario)
    ├── PDF Files table (multiple PDFs scenario)
    └── Each button opens PDFViewer with specific UUID

PDFViewer Page
├── Reads query parameters from URL
├── Fetches PDF content via bitstream API
├── Initializes react-pdf-viewer plugins
├── Renders PDF with viewer controls
└── Provides search, navigation, and cart functionality
```

---

## URL Structure & Query Parameters

### PDF Viewer Route
```
Path: /pdf-viewer
Method: Query parameters in URL
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `uuid` | string | ✓ Yes | Bitstream UUID (unique identifier for PDF file) | `uuid=550e8400-e29b-41d4-a716-446655440000` |
| `itemId` | string | ✗ No | Item UUID (for tracking which item the PDF belongs to) | `itemId=item-123` |
| `keyword` | string | ✗ No | Search term to highlight in PDF (auto-highlighted on load) | `keyword=invoice` |

### Complete Example URLs

```javascript
// Basic PDF viewing
/pdf-viewer?uuid=550e8400-e29b-41d4-a716-446655440000

// With item tracking
/pdf-viewer?uuid=550e8400-e29b-41d4-a716-446655440000&itemId=item-456

// With keyword search highlighting
/pdf-viewer?uuid=550e8400-e29b-41d4-a716-446655440000&itemId=item-456&keyword=contract

// When opened from search results (keyword URL-encoded)
/pdf-viewer?uuid=550e8400-e29b-41d4-a716-446655440000&keyword=payment%20terms
```

---

## Component Breakdown

### 1. BookDetails Component (`src/pages/book-detail/bookDetails.tsx`)

**Purpose**: Display item metadata and provide access to PDFs

**Key Functions**:
```typescript
// Fetch item details by ID
const itemDetails = await fetchItemDetails(id);

// Fetch item's bundles (ORIGINAL, THUMBNAIL, etc.)
const bundles = await fetchItemBundles(id);

// Fetch bitstreams from a specific bundle
const originalbitstreamsData = await fetchBitstreams(originalBundle.uuid);
```

**Opening PDF Viewer** (for single PDF):
```typescript
window.open(
  `/pdf-viewer?uuid=${encodeURIComponent(bitstream.uuid)}&itemId=${encodeURIComponent(id ?? '')}${keyword ? `&keyword=${keyword}` : ''}`,
  '_blank'  // Opens in new tab
)
```

**Opening PDF Viewer** (for multiple PDFs):
```typescript
window.open(
  `/pdf-viewer?uuid=${bitstream.uuid}${keyword ? `&keyword=${keyword}` : ''}`,
  '_blank'
)
```

**Data Extraction from Item**:
```typescript
const getMetadataValue = (field: string): string | null => {
  if (!item || !item.metadata) return null;
  const metadataField = item.metadata[field as keyof typeof item.metadata];
  return metadataField && metadataField.length > 0 ? metadataField[0].value : null;
};

// Usage examples
const title = getMetadataValue('dc.title');
const assetId = getMetadataValue('dc.assetid');
const vendorName = getMetadataValue('dc.vendorName');
```

### 2. PDFViewer Component (`src/pages/PDFViewer/PDFViewer.tsx`)

**Purpose**: Render PDF with viewer controls and interactivity

**Key State Variables**:
```typescript
const [pdfUrl, setPdfUrl] = useState<string | null>(null);              // Blob URL of PDF
const [loading, setLoading] = useState(false);                          // Loading state
const [error, setError] = useState<string | null>(null);                // Error messages
const [showForm, setShowForm] = useState(false);                        // Show page input form

// URL parameters
const uuid = searchParams.get("uuid");                                  // Bitstream UUID
const itemId = searchParams.get("itemId");                              // Item ID
const keyword = searchParams.get("keyword") || "";                      // Search keyword
```

**PDF Fetching Logic**:
```typescript
const fetchPDF = async () => {
  try {
    setLoading(true);
    const headers = getAuthHeaders();  // Include auth tokens

    const res = await axios.get<Blob>(
      `${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content`,
      {
        headers,
        responseType: "blob",  // Get raw binary data
      }
    );

    blobUrl = URL.createObjectURL(res.data);  // Convert to URL
    setPdfUrl(blobUrl);
  } catch (err) {
    setError("Failed to load PDF");
  } finally {
    setLoading(false);
  }
};
```

**Plugins Used**:
```typescript
// Search plugin - enables text search in PDF
const searchPluginInstance = searchPlugin();

// Default layout plugin - provides toolbar and navigation
const defaultLayoutPluginInstance = defaultLayoutPlugin();

// Destructured functions from search plugin
const { highlight, jumpToNextMatch, jumpToPreviousMatch } = searchPluginInstance;
```

**Auto-Search Feature**:
```typescript
useEffect(() => {
  if (!keyword || !pdfUrl) return;

  const timer = setTimeout(() => {
    highlight({
      keyword,
      matchCase: false,
      wholeWords: false,
    });
    jumpToNextMatch();  // Jump to first match
  }, 600);  // Delay for PDF to fully load

  return () => clearTimeout(timer);
}, [keyword, pdfUrl]);
```

**Page Selection Feature**:
```typescript
// User enters pages like: "1,2,5-8" (pages 1, 2, 5, 6, 7, 8)
const userId = await getAuthStatus();
const today = new Date().toISOString().split("T")[0];
const payload = `${itemId}_${uuid}_${today}_${pageInput}`;
await updateUserCart(userId, payload);
```

### 3. Routing Configuration (`src/routing/AppRoutes.tsx`)

```typescript
// Lazy load PDFViewer component for code splitting
const PDFViewer = lazy(() => import("../pages/PDFViewer/PDFViewer"));

// Route configuration
<Route path="/pdf-viewer" element={<PDFViewer />} />
```

---

## API Integration

### 1. Fetching Item Details

**API Call**:
```typescript
GET /api/core/items/:itemId
```

**Response Structure**:
```typescript
interface BookDetailsData {
  id: string;
  uuid: string;
  metadata: {
    [key: string]: Array<{ value: string; authority?: string; confidence?: number }>;
  };
  // ... other fields
}
```

**Example**:
```typescript
import { fetchItemDetails } from '../../api/item';

const itemDetails = await fetchItemDetails(itemId);
const title = itemDetails.metadata['dc.title'][0].value;
```

### 2. Fetching Item Bundles

**API Call**:
```typescript
GET /api/core/items/:itemId/bundles
```

**Response Structure**:
```typescript
interface Bundle {
  uuid: string;
  name: string;  // "ORIGINAL", "THUMBNAIL", etc.
}

// Returns array of bundles
const bundles: Bundle[] = await fetchItemBundles(itemId);
```

### 3. Fetching Bitstreams from Bundle

**API Call**:
```typescript
GET /api/core/bundles/:bundleUuid/bitstreams
```

**Response Structure**:
```typescript
interface Bitstream {
  uuid: string;
  name: string;          // File name with extension
  sizeBytes: number;     // File size in bytes
  resourceType: string;  // "bitstream"
}

// Returns array of bitstreams
const bitstreams: Bitstream[] = await fetchBitstreams(bundleUuid);
```

### 4. Fetching PDF Content

**API Call**:
```typescript
GET /api/core/bitstreams/:bitstreamUuid/content
Authorization: Bearer {authToken}
X-XSRF-TOKEN: {csrfToken}
```

**Response**: Binary PDF data (Blob)

**Implementation**:
```typescript
const headers = getAuthHeaders();  // Includes auth tokens

const res = await axios.get<Blob>(
  `${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content`,
  {
    headers,
    responseType: "blob",
  }
);

const blobUrl = URL.createObjectURL(res.data);
setPdfUrl(blobUrl);
```

### 5. Owning Collection Fetch

**API Call**:
```typescript
GET /api/core/items/:itemId/owningCollection
```

**Purpose**: Determine which collection an item belongs to for access control

**Implementation**:
```typescript
const collection = await getowningCollection(itemId);
// Returns collection information for permission checking
```

---

## Authentication & Security

### 1. Authentication Headers

**Location**: `src/api/searchApi.ts`

```typescript
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authToken = localStorage.getItem("authToken") || "";
  const csrfToken = localStorage.getItem("csrfToken") || "";

  if (authToken) {
    headers["Authorization"] = authToken;
  }
  if (csrfToken) {
    headers["X-XSRF-TOKEN"] = csrfToken;
  }

  return headers;
};
```

### 2. Token Storage

```typescript
// Tokens stored in localStorage
localStorage.getItem("authToken");    // Bearer token for API authentication
localStorage.getItem("csrfToken");    // CSRF token for security
```

### 3. Authentication Check

```typescript
import { getAuthStatus } from "../../api/authApi";

const userId = await getAuthStatus();
if (!userId) {
  alert("User not authenticated");
  return;
}
```

### 4. Access Control

```typescript
// Check if user is authenticated
const { isAuthenticated } = useAuth();

// Check if user has admin or collection-specific permissions
const displayEditButton = () => {
  const uploadGroups = groupCategories.upload.map(group =>
    group.name.replace('_Upload', '')
  );
  
  const adminGroups = groupCategories.admin.map(group =>
    group.name.replace('_Admin', '')
  );
  
  const allAccessGroups = Array.from(new Set([...uploadGroups, ...adminGroups]));
  return allAccessGroups.includes(collection);
};
```

---

## Feature Details

### 1. Search Within PDF

**How It Works**:
- `react-pdf-viewer` search plugin provides text search functionality
- Keyword from URL query parameter is automatically highlighted
- Users can navigate through search matches

**Implementation**:
```typescript
const { highlight, jumpToNextMatch, jumpToPreviousMatch } = searchPluginInstance;

// Auto-highlight keyword on page load
highlight({
  keyword: "invoice",
  matchCase: false,
  wholeWords: false,
});

// Jump to first match
jumpToNextMatch();
```

**UI Controls**:
- Up arrow button: Jump to previous match
- Down arrow button: Jump to next match

### 2. Page Selection & Cart

**Purpose**: Users can select specific pages to add to their cart for batch download

**How It Works**:
1. User clicks "+" button to show page input form
2. User enters pages in format: `1,2,5-8` (means pages 1, 2, 5, 6, 7, 8)
3. System validates pages and adds to user's cart
4. Each cart entry is tracked with: `{itemId}_{uuid}_{date}_{pageInput}`

**Implementation**:
```typescript
const handleAddToCart = async () => {
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
};
```

### 3. PDF Download with Watermark

**Implementation** (`src/api/bitstream.ts`):

```typescript
export const downloadPDF = async (
  bitstreamId: string,
  fileName: string,
  itemId?: string | null,
  pagesStr?: string | null,
  includeWatermark: boolean = true
) => {
  // Fetch PDF content
  // Optionally add watermark using pdf-lib
  // Trigger browser download
};
```

**Features**:
- Download specific pages or entire PDF
- Optional watermark (with logo and date)
- Preserves original filename or generates new one

### 4. Multiple Viewing Options

Users can view PDFs in multiple formats:

```typescript
// Standard PDF Viewer
<button onClick={() => 
  window.open(`/pdf-viewer?uuid=${bitstream.uuid}`, '_blank')
}>
  View PDF
</button>

// Flip Book Viewer (animated page turning effect)
<button onClick={() => 
  window.open(`/flip-book-viewer?uuid=${bitstream.uuid}`, '_blank')
}>
  View In Flip PDF
</button>

// Download PDF
<button onClick={() => 
  downloadPDF(bitstream.uuid, bitstream.name, id || '')
}>
  Download PDF
</button>
```

---

## Integration for Other Projects

### Step 1: Install Required Dependencies

```bash
npm install react-pdf-viewer
npm install @react-pdf-viewer/core
npm install @react-pdf-viewer/default-layout
npm install @react-pdf-viewer/search
npm install axios
npm install react-router-dom
npm install @mui/material @emotion/react @emotion/styled
```

### Step 2: Create PDFViewer Component

```typescript
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { searchPlugin } from "@react-pdf-viewer/search";
import { useSearchParams } from "react-router-dom";

const MyPDFViewer: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get("uuid");
  const keyword = searchParams.get("keyword") || "";

  const searchPluginInstance = searchPlugin();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Fetch PDF
  useEffect(() => {
    let blobUrl: string | null = null;

    const fetchPDF = async () => {
      try {
        setLoading(true);
        
        // Replace with your API endpoint
        const res = await axios.get<Blob>(
          `https://your-api.com/api/bitstreams/${uuid}/content`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
            },
            responseType: "blob",
          }
        );

        blobUrl = URL.createObjectURL(res.data);
        setPdfUrl(blobUrl);
      } catch (err) {
        setError("Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchPDF();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [uuid]);

  // Auto-search keyword
  useEffect(() => {
    if (!keyword || !pdfUrl) return;

    const timer = setTimeout(() => {
      const { highlight, jumpToNextMatch } = searchPluginInstance;
      highlight({
        keyword,
        matchCase: false,
        wholeWords: false,
      });
      jumpToNextMatch();
    }, 600);

    return () => clearTimeout(timer);
  }, [keyword, pdfUrl]);

  if (loading) return <div>Loading PDF...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ height: "100vh" }}>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js">
        {pdfUrl && (
          <Viewer
            fileUrl={pdfUrl}
            plugins={[
              defaultLayoutPluginInstance,
              searchPluginInstance,
            ]}
          />
        )}
      </Worker>
    </div>
  );
};

export default MyPDFViewer;
```

### Step 3: Configure Routes

```typescript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MyPDFViewer from "./components/MyPDFViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pdf-viewer" element={<MyPDFViewer />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}
```

### Step 4: Create Trigger Button

```typescript
// In your item/document details page
const handleViewPDF = (bitstreamUuid: string, itemId: string, searchKeyword?: string) => {
  const url = `/pdf-viewer?uuid=${encodeURIComponent(bitstreamUuid)}&itemId=${encodeURIComponent(itemId)}${searchKeyword ? `&keyword=${encodeURIComponent(searchKeyword)}` : ''}`;
  window.open(url, '_blank');
};

// Usage
<button onClick={() => handleViewPDF(pdf.uuid, item.id, "search term")}>
  View PDF
</button>
```

### Step 5: API Integration

Ensure your backend provides:

```bash
# Fetch PDF content (returns binary data)
GET /api/core/bitstreams/:uuid/content
Headers: Authorization: Bearer {token}
Response: Binary PDF data

# Fetch item details (optional, for metadata display)
GET /api/core/items/:itemId
Response: JSON with item metadata

# Fetch bitstreams (optional, for file listing)
GET /api/core/bundles/:bundleUuid/bitstreams
Response: JSON array of bitstreams
```

### Step 6: Advanced: Add Authentication Context

```typescript
import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```

### Step 7: Configuration File

Create `config.ts`:

```typescript
export const config = {
  apiEndpoint: process.env.REACT_APP_API_URL || "https://your-api.com",
  pdfWorkerUrl: "https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js",
  authTokenKey: "authToken",
  csrfTokenKey: "csrfToken",
};
```

---

## Best Practices

### 1. Performance Optimization
```typescript
// Use lazy loading for PDFViewer component
const PDFViewer = lazy(() => import("../components/PDFViewer"));

// Clean up blob URLs to prevent memory leaks
useEffect(() => {
  return () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  };
}, []);
```

### 2. Error Handling
```typescript
try {
  // Fetch and process PDF
} catch (error) {
  console.error("PDF loading error:", error);
  setError("Failed to load PDF. Please try again.");
}
```

### 3. User Experience
```typescript
// Show loading state while PDF loads
if (loading) return <Loader />;

// Provide clear error messages
if (error) return <p style={{ color: "red" }}>{error}</p>;

// Delay search to allow PDF to fully render
const timer = setTimeout(() => {
  highlight({ keyword, matchCase: false });
}, 600);
```

### 4. Security
```typescript
// Always include auth headers for protected API calls
const headers = getAuthHeaders();

// Validate UUID before fetching
if (!uuid) {
  setError("Invalid document identifier");
  return;
}

// Check user authentication status before sensitive operations
const userId = await getAuthStatus();
if (!userId) {
  alert("Please log in first");
  return;
}
```

---

## Troubleshooting

### Issue: PDF doesn't load
**Solution**: 
- Check that UUID is valid
- Verify authentication tokens are present in localStorage
- Check browser network tab for API errors
- Ensure CORS is properly configured on backend

### Issue: Search doesn't work
**Solution**:
- Wait for PDF to fully load before searching
- Ensure keyword parameter is URL-encoded
- Check browser console for plugin initialization errors

### Issue: Memory leak with blob URLs
**Solution**:
```typescript
// Always clean up blob URLs in useEffect cleanup
useEffect(() => {
  return () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  };
}, []);
```

### Issue: CORS errors when fetching PDF
**Solution**:
- Configure backend CORS headers to allow your domain
- Add credentials if needed: `withCredentials: true`

---

## Additional Resources

- [react-pdf-viewer Documentation](https://react-pdf-viewer.dev/)
- [DSpace REST API Documentation](https://wiki.lyrasis.org/display/DSDOC8x/REST+API)
- [axios Documentation](https://axios-http.com/)
- [React Router Documentation](https://reactrouter.com/)

---

## Version Information

| Component | Version |
|-----------|---------|
| React | 18+ |
| TypeScript | 4.5+ |
| react-pdf-viewer | Latest |
| axios | ^1.0.0 |
| react-router-dom | ^6.0.0 |

---

## Support

For issues or questions about integrating the PDF viewer:
1. Check the troubleshooting section above
2. Review the API responses in browser network tab
3. Check console logs for detailed error messages
4. Verify all authentication tokens are properly set

---

**Last Updated**: 2024
**Document Version**: 1.0
