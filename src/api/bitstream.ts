import { showToast } from "../contexts/ToastProvider";
import { Bitstream, BitstreamsResponse, BitstreamUploadResponse, Bundle, BundlesResponse, PatchOperation } from "../data/bookDetail";
import { siteConfig } from "../data/data";
import axios from "axios";
import { PDFDocument, rgb } from 'pdf-lib';
import { getAuthHeaders } from "./searchApi";
import html2canvas from 'html2canvas';
import OptimarkLogo from '../assets/images/Optimark1.png';
import { fetchItemInfo } from "./item";
import { personsImgs } from "../utils/images";


const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";



function parsePages(pageString: string): number[] {
  const pages = new Set<number>();

  pageString.split(',').forEach((part) => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      }
    } else {
      const page = Number(part);
      if (!isNaN(page)) {
        pages.add(page);
      }
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
}
export const downloadPDF = async (
  bitstreamId: string,
  fileName: string,
  itemId?: string | null,
  pagesStr?: string | null,
  includeWatermark: boolean = true
) => {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...getAuthHeaders(),
    };

    // fetch the original PDF
    const pdfResp = await fetch(
      `${siteConfig.apiEndpoint}/api/core/bitstreams/${bitstreamId}/content`,
      { method: 'GET', headers }
    );
    if (!pdfResp.ok) throw new Error('Failed to fetch PDF');

    const pdfBytes = await pdfResp.arrayBuffer();
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const pageCount = sourcePdf.getPageCount();
    const outPdf = await PDFDocument.create();

    // ✅ Thumbnail page (metadata) if itemId present
    if (itemId) {
      const itemResp = await fetch(
        `${siteConfig.apiEndpoint}/api/core/items/${itemId}`,
        { headers }
      );
      if (itemResp.ok) {
        const itemData = await itemResp.json();

        const map: Record<string, string> = {
          "dc.filenumber": "Title / File Number",
          "dc.description.abstract": "Abstract",
          "dc.date.created": "Created Date",
          "dc.contributor.author": "Author",
          "dspace.entity.type": "Entity Type",
          "dc.publisher": "Publisher",
          "dc.encounterid": "Encounter ID",
          "dc.patientname": "Patient Name",
          "dc.dod": "Date of Admission",
          "dc.doctorname": "Doctor Name",
          "dc.mrdno": "MRD No",
          "dc.uhidno": "UHID",

          "dc.assetid": "Asset ID",
          "dc.invoiceNumber": "Invoice Number",
          "dc.DocType": "Document Type",
          "dc.VendorName": "Vendor Name",
          "dc.date.issued": "Issued Date",

          "dc.EmpName": "Employee Name",
          "dc.empid": "Employee ID",
          "dc.hrDocNo": "HR Document No",
          "dc.ContractStatus": "Contract Status",
          "dc.ContractOwner": "Contract Owner",
          "dc.ContractValue": "Contract Value",
          "dc.organization": "Organization",


          "dc.Material": "Material",
          "dc.PaymentTerms": "Payment Terms",
          "dc.Quantity": "Quantity",
          "dc.Status": "Status",
          "dc.TotalValue": "Total Value",
          "dc.UnitPrice": "Unit Price"
        };


        const rows = Object.entries(map).reduce((html, [k, label]) => {
          const v = itemData?.metadata?.[k]?.[0]?.value;
          if (!v) return html;

          const valueCell =
            k === "dc.identifier.uri"
              ? `<a href="${v}" target="_blank" style="color:#3f51b5;text-decoration:none;">${v}</a>`
              : v;

          return (
            html +
            `<tr>
               <th style="width:200px;background:#e6e6e6;padding:12px 16px;text-align:left;font-weight:600;border-bottom:1px solid #dcdcdc;">
                 ${label}
               </th>
               <td style="padding:12px 16px;background:#fff;border-bottom:1px solid #dcdcdc;">
                 ${valueCell}
               </td>
             </tr>`
          );
        }, "");

        const html = document.createElement("div");
        html.style.width = "450px";
        html.style.height = "800px";
        html.style.padding = "40px";
        html.style.fontFamily = "Arial, sans-serif";
        html.style.background = "#fff";
        html.innerHTML = `
          <div style="text-align:center;margin-bottom:32px;">
            <img src="${personsImgs.brand_one}" alt="Logo" style="max-height:100px;margin-bottom:12px;" />
          </div>
          <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;font-size:16px;box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <tbody>${rows}</tbody>
          </table>`;

        document.body.appendChild(html);
        const canvas = await html2canvas(html, { backgroundColor: "#fff" });
        const imgBytes = await fetch(canvas.toDataURL("image/png")).then(r => r.arrayBuffer());
        document.body.removeChild(html);

        const imgEmbed = await outPdf.embedPng(imgBytes);
        const page = outPdf.addPage([imgEmbed.width, imgEmbed.height]);
        page.drawImage(imgEmbed, { x: 0, y: 0, width: imgEmbed.width, height: imgEmbed.height });
      }
    }

    // ✅ Pages to extract
    let indices: number[] = [];
    if (pagesStr) {
      const wanted = parsePages(pagesStr);
      indices = wanted.filter(n => n >= 1 && n <= pageCount).map(n => n - 1);
    } else {
      indices = Array.from(Array(pageCount), (_, i) => i);
    }

    if (indices.length === 0) {
      showToast("No valid pages to extract", "error");
      return;
    }

    // ✅ Copy pages and optionally watermark
    const pages = await outPdf.copyPages(sourcePdf, indices);

    let wmImg: any;
    let wmScaled: any;
    if (includeWatermark) {
      const wmBytes = await fetch(OptimarkLogo).then(r => r.arrayBuffer());
      wmImg = await outPdf.embedPng(wmBytes);
      wmScaled = wmImg.scale(0.9);
    }

    pages.forEach(p => {
      if (includeWatermark && wmImg) {
        const { width, height } = p.getSize();
        p.drawImage(wmImg, {
          x: (width - wmScaled.width) / 2,
          y: (height - wmScaled.height) / 2,
          width: wmScaled.width,
          height: wmScaled.height,
          opacity: 0.5,
        });
      }
      outPdf.addPage(p);
    });

    // ✅ Save and download
    const outBytes = await outPdf.save();
    const blob = new Blob([outBytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast(`Pages ${pagesStr ?? "All"} downloaded`, "success");
  } catch (err) {
    console.error(err);
    showToast("Failed to download PDF", "error");
  }
};


export const getPDFUrl = (uuid: string): string => {
  const authToken = localStorage.getItem("authToken");
  const tokenParam = authToken ? `?authorization=${encodeURIComponent(authToken)}` : "";
  return `${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content${tokenParam}`;
};


export const fetchPDFUrl = async (uuid: string): Promise<string> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch PDF.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw error;
  }
};


export const fetchItemBundles = async (id: string): Promise<Bundle[]> => {
  const authToken = localStorage.getItem("authToken") || "";

  const headers = authToken
    ? {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": localStorage.getItem("csrfToken") || "",
      Authorization: authToken,
    }
    : {
      "Content-Type": "application/json",
    };

  const response = await axios.get<BundlesResponse>(`${siteConfig.apiEndpoint}/api/core/items/${id}/bundles?size=9999`, {
    headers: headers,
  });

  return response.data._embedded.bundles;
};




export const fetchBitstreams = async (bundleId: string): Promise<Bitstream[]> => {
  const headers = authToken
    ? {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": localStorage.getItem("csrfToken") || "",
      Authorization: authToken,
    }
    : {
      "Content-Type": "application/json",
    };
  const response = await axios.get<BitstreamsResponse>(`${siteConfig.apiEndpoint}/api/core/bundles/${bundleId}/bitstreams?page=0&size=5`, {
    headers: headers,
  });
  return response.data._embedded.bitstreams;
};



export const postBitstream = async (bundleId: string,
  file: File
): Promise<BitstreamUploadResponse> => {

  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await axios.post<BitstreamUploadResponse>(
      `${siteConfig.apiEndpoint}/api/core/bundles/${bundleId}/bitstreams`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-XSRF-TOKEN': csrfToken,
          'Authorization': authToken,
        },
        withCredentials: true,
      }
    );
    return data;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw error;
  }
};



export const removeBitstream = async (patchOperations: PatchOperation[]) => {
  try {
    const response = await axios.patch(
      `${siteConfig.apiEndpoint}/api/core/bitstreams`,
      patchOperations,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
          'Authorization': authToken,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    const errorStatus = error.response?.status || 500;
    if (errorStatus === 400) {
      window.location.href = `/error-400`;
    } else if (errorStatus === 401) {
      window.location.href = `/error-401`;
    } else if (errorStatus === 403) {
      window.location.href = `/error-403`;
    } else if (errorStatus === 422) {
      window.location.href = `/error-422`;
    } else if (errorStatus === 500) {
      window.location.href = `/error-500`;
    } else {
      window.location.href = `/error-404`;
    }
    throw error;
  }
};