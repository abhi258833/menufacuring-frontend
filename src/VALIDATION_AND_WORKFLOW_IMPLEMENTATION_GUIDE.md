# Validation and Workflow Implementation Guide

## Overview

This document provides a comprehensive guide on how **Validation** and **Workflow** flags are implemented in the Batch Import feature of the DSpace React application. This implementation allows users to validate imported items and automatically process them through a workflow during batch import operations.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BatchImport.tsx Component                               │  │
│  │  - User Interface with Validation/Workflow Checkboxes    │  │
│  │  - State Management for Flags                            │  │
│  │  - Properties Building Logic                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Axios)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  batchImport.ts                                          │  │
│  │  - Builds FormData with properties array                 │  │
│  │  - Handles authentication (authToken, csrfToken)         │  │
│  │  - Sends POST request to backend                         │  │
│  │  - Manages error responses                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DSpace Backend API                            │
│  POST /api/system/scripts/import/processes                      │
│  - Receives FormData with file and properties                   │
│  - Parses properties array                                      │
│  - Executes import script with flags                            │
│  - Returns 202 Accepted status                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Implementation

### Component: `BatchImport.tsx`

#### 1. State Management

```typescript
const [validationChecked, setValidationChecked] = useState(false);
const [workflowChecked, setWorkflowChecked] = useState(false);
```

**Purpose:**
- `validationChecked`: Tracks if user wants to enable item validation during import
- `workflowChecked`: Tracks if user wants items to go through workflow after import

#### 2. UI Components

```tsx
<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  <FormControlLabel
    control={
      <Checkbox
        checked={validationChecked}
        onChange={e => setValidationChecked(e.target.checked)}
      />
    }
    label="Validation"
  />
  <FormControlLabel
    control={
      <Checkbox
        checked={workflowChecked}
        onChange={e => setWorkflowChecked(e.target.checked)}
      />
    }
    label="Workflow"
  />
</Box>
```

**Features:**
- Two independent checkboxes for Validation and Workflow
- Users can select: Neither, Validation only, Workflow only, or Both
- Side-by-side layout for clear visibility

#### 3. Property Building Logic

The critical logic is in the `handleSubmit()` function. Four distinct configurations are created based on checkbox states:

```typescript
const handleSubmit = async () => {
  if (!selectedCollection || !selectedFile) {
    showToast("Please select a collection and a ZIP file.", "error");
    return;
  }

  setIsLoading(true);

  try {
    let properties;
    
    // CONFIGURATION 1: Both Unchecked (Default Add)
    if (!validationChecked && !workflowChecked) {
      properties = [
        { name: "--add" },
        { name: "--zip", value: selectedFile.name },
        { name: "--collection", value: selectedCollection }
      ];
    }
    
    // CONFIGURATION 2: Only Validation Checked
    else if (validationChecked && !workflowChecked) {
      properties = [
        { name: "--add" },
        { name: "--zip", value: selectedFile.name },
        { name: "--collection", value: selectedCollection },
        { name: "-v", value: true }
      ];
    }
    
    // CONFIGURATION 3: Only Workflow Checked
    else if (!validationChecked && workflowChecked) {
      properties = [
        { name: "--add" },
        { name: "--zip", value: selectedFile.name },
        { name: "--collection", value: selectedCollection },
        { name: "-w", value: true }
      ];
    }
    
    // CONFIGURATION 4: Both Checked
    else {
      properties = [
        { name: "-a", value: true },
        { name: "-c", value: selectedCollection },
        { name: "-z", value: selectedFile.name },
        { name: "-w", value: true }
      ];
    }

    const response = await uploadBatchImport(selectedCollection, selectedFile, properties);

    if (response.status === 202) {
      alert("ZIP file uploaded successfully!");
      navigate("/");
    }
  } catch (error) {
    showToast("Upload failed. Please try again.", "error");
  } finally {
    setIsLoading(false);
  }
};
```

### Property Configuration Table

| Scenario | Validation | Workflow | Properties Sent |
|----------|-----------|----------|-----------------|
| **Default** | ❌ | ❌ | `--add`, `--zip`, `--collection` |
| **Validation Only** | ✅ | ❌ | `--add`, `--zip`, `--collection`, `-v` |
| **Workflow Only** | ❌ | ✅ | `--add`, `--zip`, `--collection`, `-w` |
| **Both** | ✅ | ✅ | `-a`, `-c`, `-z`, `-w` |

**Flag Meanings:**
- `-a` or `--add`: Add items to collection
- `-c` or `--collection`: Target collection UUID
- `-z` or `--zip`: ZIP file name
- `-v`: Enable validation
- `-w`: Enable workflow processing

---

## API Implementation

### File: `batchImport.ts`

#### Function: `uploadBatchImport()`

```typescript
export const uploadBatchImport = async (
  selectedCollection: string,
  selectedFile: File,
  properties: any[]
): Promise<Awaited<ReturnType<typeof axios.post>>> => {
  try {
    const formData = new FormData();

    // Serialize properties array to JSON string
    formData.append("properties", JSON.stringify(properties));
    
    // Append the ZIP file
    formData.append("file", selectedFile);

    // POST request to DSpace import endpoint
    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/system/scripts/import/processes`,
      formData,
      {
        headers: {
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    return response;
  } catch (error: any) {
    // Error handling with HTTP status codes
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
```

#### Key Points:

1. **FormData Structure:**
   - `properties`: JSON-stringified array of flag objects
   - `file`: The uploaded ZIP file

2. **Authentication:**
   - Uses `X-XSRF-TOKEN` for CSRF protection
   - Uses `Authorization` header with auth token
   - Includes credentials for cookies

3. **Endpoint:** 
   - `POST /api/system/scripts/import/processes`
   - Returns `202 Accepted` on success

4. **Error Handling:**
   - Routes different HTTP status codes to error pages
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 422: Unprocessable Entity
   - 500: Internal Server Error
   - Others: 404 Not Found

---

## Integration Guide for Other Instances

### Step 1: Frontend Setup

#### Create or Update Batch Import Component

Create a **`BatchImport.tsx`** component with:

```typescript
import React, { useState } from "react";
import { Checkbox, FormControlLabel, Button } from "@mui/material";

const BatchImport: React.FC = () => {
  const [validationChecked, setValidationChecked] = useState(false);
  const [workflowChecked, setWorkflowChecked] = useState(false);
  
  // Rest of component implementation...
};
```

**Include:**
- Two state variables for checkboxes
- Checkbox UI elements
- Properties building logic with all four configurations
- Form submission handler

#### Required State Variables:

```typescript
const [validationChecked, setValidationChecked] = useState(false);
const [workflowChecked, setWorkflowChecked] = useState(false);
const [selectedCollection, setSelectedCollection] = useState<string>("");
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
```

### Step 2: API Layer Setup

#### Create `batchImport.ts` API Service

```typescript
import axios from "axios";
import { siteConfig } from "../data/data";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

export const uploadBatchImport = async (
  selectedCollection: string,
  selectedFile: File,
  properties: any[]
) => {
  const formData = new FormData();
  formData.append("properties", JSON.stringify(properties));
  formData.append("file", selectedFile);

  const response = await axios.post(
    `${siteConfig.apiEndpoint}/api/system/scripts/import/processes`,
    formData,
    {
      headers: {
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
      withCredentials: true,
    }
  );
  return response;
};
```

**Requirements:**
- Access to `authToken` from localStorage
- Access to `csrfToken` from localStorage
- `siteConfig` with `apiEndpoint`

### Step 3: Implement Properties Building Logic

Copy the exact logic from `handleSubmit()`:

```typescript
let properties = [];

if (!validationChecked && !workflowChecked) {
  // Default: just add items
  properties = [
    { name: "--add" },
    { name: "--zip", value: selectedFile.name },
    { name: "--collection", value: selectedCollection }
  ];
} else if (validationChecked && !workflowChecked) {
  // Validation enabled
  properties = [
    { name: "--add" },
    { name: "--zip", value: selectedFile.name },
    { name: "--collection", value: selectedCollection },
    { name: "-v", value: true }
  ];
} else if (!validationChecked && workflowChecked) {
  // Workflow enabled
  properties = [
    { name: "--add" },
    { name: "--zip", value: selectedFile.name },
    { name: "--collection", value: selectedCollection },
    { name: "-w", value: true }
  ];
} else {
  // Both enabled
  properties = [
    { name: "-a", value: true },
    { name: "-c", value: selectedCollection },
    { name: "-z", value: selectedFile.name },
    { name: "-w", value: true }
  ];
}
```

### Step 4: Backend Requirements

The DSpace backend must support these import script parameters:

- **`--add` or `-a`**: Add items to collection
- **`--collection` or `-c`**: Target collection UUID
- **`--zip` or `-z`**: ZIP file path (Simple Archive Format)
- **`-v`**: Enable validation mode
- **`-w`**: Enable workflow mode

Ensure your DSpace instance version supports these import script flags.

### Step 5: Authentication Setup

Ensure the following are available:

```typescript
// In localStorage or Context
const authToken = localStorage.getItem("authToken");
const csrfToken = localStorage.getItem("csrfToken");

// In configuration
const apiEndpoint = "https://your-dspace-instance.org/server";
```

**Required Headers:**
- `Authorization`: Bearer token or basic auth
- `X-XSRF-TOKEN`: CSRF token for security
- `Content-Type`: Auto-managed by FormData

---

## Error Handling

### Frontend Error Handling

```typescript
try {
  const response = await uploadBatchImport(selectedCollection, selectedFile, properties);
  
  if (response.status === 202) {
    // Success: Import process started
    alert("ZIP file uploaded successfully!");
    navigate("/");
  }
} catch (error) {
  // Handle errors with user-friendly messages
  showToast("Upload failed. Please try again.", "error");
}
```

### HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| **202** | Accepted | Process started successfully |
| **400** | Bad Request | Invalid properties or file format |
| **401** | Unauthorized | Auth token invalid/expired |
| **403** | Forbidden | User lacks permission |
| **422** | Unprocessable Entity | Invalid data in ZIP |
| **500** | Server Error | Backend issue |
| **Others** | Not Found | Unknown error |

### Validation Errors

When `-v` (validation) flag is used:
- Invalid metadata formats trigger `400`/`422` errors
- Check ZIP file structure matches SAF (Simple Archive Format)
- Ensure all metadata files are properly formatted

### Workflow Errors

When `-w` (workflow) flag is used:
- Items must have required fields for workflow
- Check that workflow is configured in target collection
- Ensure user has workflow permission

---

## Configuration Examples

### Example 1: Simple Add (No Validation/Workflow)

```javascript
properties = [
  { name: "--add" },
  { name: "--zip", value: "items.zip" },
  { name: "--collection", value: "collection-uuid" }
]
```

**Use Case:** Quick bulk import without strict validation

---

### Example 2: Import with Validation

```javascript
properties = [
  { name: "--add" },
  { name: "--zip", value: "items.zip" },
  { name: "--collection", value: "collection-uuid" },
  { name: "-v", value: true }
]
```

**Use Case:** Ensure all items meet metadata requirements

---

### Example 3: Import with Workflow

```javascript
properties = [
  { name: "--add" },
  { name: "--zip", value: "items.zip" },
  { name: "--collection", value: "collection-uuid" },
  { name: "-w", value: true }
]
```

**Use Case:** Route items through editorial workflow after import

---

### Example 4: Import with Both Validation & Workflow

```javascript
properties = [
  { name: "-a", value: true },
  { name: "-c", value: "collection-uuid" },
  { name: "-z", value: "items.zip" },
  { name: "-w", value: true }
]
```

**Use Case:** Strict validation + automatic workflow routing

---

## Data Flow Diagram

```
User Interface
    ↓
[Select Collection] → [Select ZIP File] → [Check Validation?] → [Check Workflow?]
    ↓
Build Properties Array (based on checkbox state)
    ↓
Create FormData:
  - properties: JSON.stringify(properties)
  - file: ZIP file binary
    ↓
POST to /api/system/scripts/import/processes
    ↓
DSpace Backend:
  - Parse properties
  - Extract flags (-v, -w)
  - Process ZIP with appropriate mode
    ↓
Response Status 202 (Accepted)
    ↓
Import Process Started (async)
    ↓
User Notified → Navigate to Home
```

---

## Testing Checklist

### Frontend Testing

- [ ] Validation checkbox toggles correctly
- [ ] Workflow checkbox toggles correctly
- [ ] Both checkboxes can be used independently
- [ ] Properties array changes based on checkbox state
- [ ] File validation (only .zip files allowed)
- [ ] Collection selection required
- [ ] Loading spinner shows during upload
- [ ] Error messages display on failure
- [ ] Success message displays on 202 response

### API Testing

- [ ] FormData correctly serializes properties
- [ ] Authentication headers included
- [ ] CSRF token sent
- [ ] File uploaded as binary data
- [ ] Endpoint responds with 202 on success
- [ ] Error codes map to error pages

### Backend Testing

- [ ] `-v` flag triggers validation logic
- [ ] `-w` flag triggers workflow routing
- [ ] Both flags work together
- [ ] Properties parsed correctly from JSON
- [ ] ZIP file extracted and processed
- [ ] Items created in specified collection

---

## Troubleshooting

### Issue: "Unauthorized" Error (401)

**Cause:** Auth token expired or invalid

**Solution:**
```typescript
// Refresh token
const newToken = await refreshAuthToken();
localStorage.setItem("authToken", newToken);
```

---

### Issue: "Forbidden" Error (403)

**Cause:** User lacks permission to import to collection

**Solution:**
- Check user roles in target collection
- Verify user has `Collection_Add` permission
- Check workflow permissions if using `-w` flag

---

### Issue: "Bad Request" Error (400)

**Cause:** Invalid properties format or corrupted ZIP

**Solution:**
- Verify ZIP file structure (SAF format)
- Check properties array has correct format
- Validate metadata.xml in ZIP file

---

### Issue: Items Not Going to Workflow

**Cause:** Workflow flag not sent or collection not configured

**Solution:**
- Verify `-w` flag in properties
- Check collection has workflow configured
- Verify workflow configuration in DSpace admin

---

## File References

| File | Purpose |
|------|---------|
| `src/api/batchImport.ts` | API service for upload |
| `src/pages/BatchImport/BatchImport.tsx` | UI component |
| `src/data/data.ts` | Configuration with `siteConfig` |
| `src/contexts/ToastProvider.tsx` | Toast notifications |
| `src/api/collection.ts` | Collection fetching |

---

## Version Compatibility

**Tested With:**
- DSpace 8.x
- React 18.x
- TypeScript 4.9+
- Material-UI (MUI) 5.x+
- Axios 1.x

**Backend Requirements:**
- DSpace 8.x with import script support
- Scripts API endpoint enabled
- CSRF protection configured

---

## Summary

The validation and workflow implementation in this DSpace React application:

1. **Uses two independent checkboxes** to allow users to enable validation and/or workflow
2. **Builds different property arrays** based on checkbox state (4 possible configurations)
3. **Sends properties as JSON** in FormData to the backend API
4. **Leverages DSpace's import script system** with `-v` and `-w` flags
5. **Manages async processing** with loading states and error handling
6. **Routes different HTTP statuses** to appropriate error pages

For integration into other instances, copy the component structure, implement the properties building logic, and ensure backend support for the import script flags.

---

## Support & Questions

For more information on:
- **Simple Archive Format (SAF):** DSpace documentation
- **Import Scripts:** DSpace Admin Guide
- **Workflow Configuration:** DSpace System Configuration

Contact your DSpace administrator or refer to official DSpace documentation.
