**PDF Viewer — Implementation Guide**

Purpose: provide copy-and-paste instructions to implement the same PDF viewer layout and behaviour used in this project.

Source component: [src/components/pdf/PDFViewer.tsx](src/components/pdf/PDFViewer.tsx#L1-L800)

**Prerequisites**
- Dependencies (install in your project):

```bash
npm install react-pdf pdfjs-dist lucide-react
```

- Styling: this project uses Tailwind CSS and shared `Button`/`Input` primitives. If you don't have those, either adapt the imports or replace with your UI library.

**Files and imports to copy**
- Copy `src/components/pdf/PDFViewer.tsx` into the same relative path in the target repo and keep these imports present near the top of the file:

```ts
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
```

- The component configures the PDF.js worker with:

```ts
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

Keep or adapt this line if your app bundles static assets differently.

Recommended (robust) approach for CRA / single-origin apps:

1. Copy `pdf.worker.min.js` from `node_modules/pdfjs-dist/build/` into your app's `public/` folder.
2. Set the worker to load from the public path:

```ts
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;
```

This avoids dynamic module import / CORS issues when loading the worker from a CDN.
**Component API (props)**
- `fileUrl: string` — URL to fetch the PDF from (may be protected).
- `fileName?: string` — filename used for download (default: `document.pdf`).
- `className?: string` — additional container classes to match layout/height.

**Authentication & fetching**
- The component includes a `fetchPDFWithAuth` helper that retrieves `authToken` from `localStorage` and sends an `Authorization: Bearer <token>` header. If your app uses cookies or server-side sessions, replace `fetchPDFWithAuth` with a fetch that matches your auth method.

Example replacement (cookie-based):

```ts
const fetchPDFWithAuth = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch PDF');
  return new Uint8Array(await response.arrayBuffer());
};
```

**How the layout works**
- The component renders a toolbar (navigation, zoom, rotate, print, download) and a scrollable document area. Each `Page` is wrapped in a container with `data-page-number` attributes so the toolbar can scroll to a specific page.
- Search is implemented by pulling text content from each PDF page (`page.getTextContent()`), performing a simple index search, and remembering match positions to navigate between them. Highlighting uses a `customTextRenderer` which injects small `<mark>` highlights into the text layer.

**Usage example**

Add the component and use it like:

```tsx
import { PDFViewer } from '@/components/pdf/PDFViewer';

export default function MyPage() {
  return (
    <div className="h-screen">
      <PDFViewer
        fileUrl="/api/files/12345/pdf"
        fileName="Report.pdf"
        className="h-full"
      />
    </div>
  );
}
```

Notes:
- Provide a `className` that gives the component a fixed height (e.g., `h-full`) so the internal overflow scrolling works as intended.
- If your PDF endpoint is remote (different origin), ensure CORS permits fetching bytes and includes required headers.

**Styling and UI primitives**
- The component imports `Button` and `Input` from the project's UI primitives. If those don't exist in target project, either copy the primitives or replace them with equivalents from your UI library (Material, Chakra, plain buttons, etc.).
- The component also uses `lucide-react` icons; you can substitute other icons if desired.

**Common gotchas & troubleshooting**
- Worker path: If PDF pages render blank, verify `pdfjs.GlobalWorkerOptions.workerSrc` is set correctly and reachable from the client.
- CORS: fetching PDF bytes requires `Access-Control-Allow-Origin` and the server to permit `GET` from your origin.
- Large PDFs: rendering many pages at once can be memory-heavy. Consider rendering a windowed subset of pages if you need better performance.
- Search: the highlighting is text-layer based and depends on how text runs are split by the PDF. Complex PDFs (with unusual encodings) may have imperfect search/highlight behavior.

**Checklist to copy into target repo**
- [ ] Install `react-pdf`, `pdfjs-dist`, and `lucide-react`.
- [ ] Copy `src/components/pdf/PDFViewer.tsx` and keep the CSS imports.
- [ ] Ensure your UI primitives (`Button`, `Input`) or replacements are available.
- [ ] Adjust `fetchPDFWithAuth` to match your authentication method.
- [ ] Test with a sample PDF and verify download, print, zoom, rotate, and search.

**If you want, I can:**
- Copy a minimal wrapper that removes project-specific UI primitives and exports a plain-HTML version of `PDFViewer` for easier porting.

---
Generated by the project maintainer assistant to help port the `PDFViewer` component with the same layout and behaviour.
