import { showToast } from "../contexts/ToastProvider";
import { siteConfig } from "../data/data";
import axios from "axios";
interface ProcessItem {
    processId: number,
    scriptName: string,
    endTime: string,
}
export interface Process {
    _embedded: {
        processes: ProcessItem[]
    },
    page: {
        size: number,
        totalElements: number,
        totalPages: number,
        number: number
    }
}
export interface ProcessParameter {
  name: string;
  value: string | null;
}

export interface ProcessFile {
  id: string;
  uuid: string;
  name: string;
  sizeBytes: number;
  metadata: {
    [key: string]: { value: string }[];
  };
  _links: {
    content: { href: string };
  };
}

export interface ProcessDetailData {
  processId: number;
  scriptName: string;
  userId: string;
  startTime: string;
  endTime: string;
  creationTime: string;
  processStatus: string;
  type: string;
  parameters: ProcessParameter[];
  _links: {
    files: { href: string };
    filetypes: { href: string };
    output: { href: string };
    self: { href: string };
    script: { href: string };
  };
  _embedded?: {
    files: {
      _embedded: {
        files: ProcessFile[];
      };
    };
  };
}

const authToken = localStorage.getItem("authToken");

export const failedProcess = async (page: number, size: number) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/system/processes/search/byProperty?page=${page}&size=${size}&sort=endTime,ASC&processStatus=FAILED`;
    const response = await axios.get<Process>(apiUrl, {
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": localStorage.getItem("csrfToken") || "",
            Authorization: authToken
        },
        withCredentials: true,
    })
    return { processes: response.data._embedded?.processes || [], 
        totalPages: response.data.page?.totalPages };
}


export const runningProcess = async (page: number, size: number) => {
  
    const apiUrl = `${siteConfig.apiEndpoint}/api/system/processes/search/byProperty?page=0&size=5&sort=creationTime,DESC&processStatus=RUNNING`;
    const response = await axios.get<Process>(apiUrl, {
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": localStorage.getItem("csrfToken"),
            Authorization: authToken
        },
        withCredentials: true,
    })
    return { processes: response.data._embedded?.processes || [], 
        totalPages: response.data.page.totalPages };
} 


export const scheduledProcess = async (page: number, size: number) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/system/processes/search/byProperty?page=${page}&size=${size}&sort=creationTime,ASC&processStatus=SCHEDULED`;
    const response = await axios.get<Process>(apiUrl, {
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": localStorage.getItem("csrfToken"),
            Authorization: authToken
        },
        withCredentials: true,
    })
    return { processes: response.data._embedded?.processes || [] , 
        totalPages: response.data.page.totalPages };
} 


export const completedProcess = async (page: number, size: number) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/system/processes/search/byProperty?page=${page}&size=${size}&sort=creationTime,DESC&processStatus=COMPLETED`;
    const response = await axios.get<Process>(apiUrl, {
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": localStorage.getItem("csrfToken"),
            Authorization: authToken
        },
        withCredentials: true,
    })
    return { processes: response.data._embedded?.processes || [], 
        totalPages: response.data.page.totalPages };
} 

export const removeProcess = async (processId: number) => {
    const response = await axios.delete(`${siteConfig.apiEndpoint}/api/system/processes/${processId}`, {
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": localStorage.getItem("csrfToken"),
            Authorization: authToken
        },
        withCredentials: true,
    })
    if (response.status === 204) {
        showToast("process deleted successfully","success");
    }
}

export const getProcessDetail = async (id: string): Promise<ProcessDetailData> => {
  const apiUrl = `${siteConfig.apiEndpoint}/api/system/processes/${id}?embed=files`;
  const response = await axios.get<ProcessDetailData>(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": localStorage.getItem("csrfToken") || "",
      Authorization: authToken,
    },
    withCredentials: true,
  });
  return response.data;
};

// 🔹 Delete process by ID
export const deleteProcess = async (id: string) => {
  const response = await axios.delete(
    `${siteConfig.apiEndpoint}/api/system/processes/${id}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": localStorage.getItem("csrfToken") || "",
        Authorization: authToken,
      },
      withCredentials: true,
    }
  );

  if (response.status === 204) {
    showToast("Process deleted successfully", "success");
  }
};


// Get short-lived token
export const getShortLivedToken = async (): Promise<string> => {
  const apiUrl = `${siteConfig.apiEndpoint}/api/authn/shortlivedtokens`;

  const response = await axios.post(
    apiUrl,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": localStorage.getItem("csrfToken") || "",
        Authorization: authToken, // ✅ needed here
      },
      withCredentials: true,
    }
  );

  return (response.data as { token: string }).token;
};

// Fetch process output (log file content)
export const getProcessOutput = async (processId: string): Promise<string> => {
  // Step 1: get process output metadata
  const outputUrl = `${siteConfig.apiEndpoint}/api/system/processes/${processId}/output`;

  const outputResp = await axios.get(outputUrl, {
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken, // ✅ still needed here
    },
    withCredentials: true,
  });

  const { _links } = outputResp.data as {
    _links: { content: { href: string } };
  };
  const contentUrl = _links.content.href;

  // Step 2: request short-lived token
  const token = await getShortLivedToken();

  // Step 3: fetch bitstream content with ONLY the short-lived token
  const contentResp = await axios.get(
    `${contentUrl}?authentication-token=${token}`,
    {
      responseType: "text",
      headers: { Accept: "text/plain" },
      withCredentials: false, // 🚨 disable cookies/csrf
    }
  );

  return String(contentResp.data);
};


// Download a process file securely
export const downloadFile = async (file: ProcessFile) => {
  try {
    // Step 1: Get short-lived token
    const token = await getShortLivedToken();

    // Step 2: Construct download URL with token
    const downloadUrl = `${file._links.content.href}?authentication-token=${token}`;

    // Step 3: Fetch file as blob
    const response = await axios.get(downloadUrl, {
      responseType: "blob", // get binary data
    });

    // Step 4: Create download link
    const blob = new Blob([response.data as BlobPart], { type: response.headers["content-type"] });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", file.name); // ✅ ensure same name as on server
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("File download failed:", error);
    showToast("Failed to download file", "error");
  }
};
