# Workflow Actions Implementation Guide

Complete reference for implementing workflow actions (Claim, Approve, Reject) in DSpace React applications.

---

## Overview

This guide documents the working implementation of workflow task actions from `src/api/workflowTask.ts`. These are production-tested patterns for:
- Claiming tasks
- Approving claimed tasks
- Deleting/rejecting tasks
- Rejecting with reason

---

## 1. Setup & Configuration

### Required Imports
```typescript
import { siteConfig } from "../data/data";
import axios from "axios";
```

### Authentication Tokens
```typescript
const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";
```

**Important:**
- `authToken`: User's authentication token (usually JWT or Bearer token)
- `csrfToken`: CSRF protection token (required for POST/DELETE operations)
- Both must be stored in `localStorage` when user logs in

---

## 2. API Base URL

All endpoint URLs use:
```
${siteConfig.apiEndpoint}/api/
```

Example:
```
https://your-dspace-instance.org/server/api/
```

---

## 3. Workflow Action Implementations

### 3.1 Claim Task (Pool Task → Claimed Task)

**Endpoint:** `POST /api/workflow/claimedtasks`

**Purpose:** Assign a pool task to yourself

**Implementation:**
```typescript
export const claimedtask = async (id: string) => {
    try {
        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/workflow/claimedtasks`,
            `${siteConfig.apiEndpoint}/api/workflow/pooltasks/${id}`,
            {
                headers: {
                    "Content-Type": "text/uri-list",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        return response.data;
    } catch (error: any) {
        handleApiError(error);
    }
};
```

**Key Details:**

| Property | Value | Purpose |
|----------|-------|---------|
| **Method** | POST | Create new claimed task |
| **URL** | `/api/workflow/claimedtasks` | Endpoint for claimed tasks |
| **Body** | Pool task URI (`/api/workflow/pooltasks/{id}`) | URL-based reference to the pool task |
| **Content-Type** | `text/uri-list` | Plain text URI reference format |
| **X-XSRF-TOKEN** | CSRF token from localStorage | Security header |
| **Authorization** | Auth token | User authentication |
| **withCredentials** | true | Include cookies in request |

**Response Example:**
```json
{
  "id": 12345,
  "type": "claimedtask",
  "owner": {
    "id": "user-uuid",
    "name": "john.doe"
  },
  "workflowItem": {...},
  "step": "editorial-step-1",
  "action": "editaction"
}
```

**Usage in React:**
```typescript
const handleClaimTask = async (taskId: string) => {
    try {
        const result = await claimedtask(taskId);
        console.log('Task claimed:', result);
        // Refresh task list
        await fetchTasks();
    } catch (error) {
        console.error('Failed to claim task:', error);
    }
};
```

---

### 3.2 Approve Claimed Task

**Endpoint:** `POST /api/workflow/claimedtasks/{id}`

**Purpose:** Approve and advance a workflow item to the next step

**Implementation:**
```typescript
export const approveClaimedTask = async (id: number) => {
    try {
        const params = new URLSearchParams();
        params.append('submit_approve', 'true');

        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        return response.data;
    } catch (error: any) {
        throw error;  // Re-throw for caller handling
    }
};
```

**Key Details:**

| Property | Value | Purpose |
|----------|-------|---------|
| **Method** | POST | Submit action |
| **URL** | `/api/workflow/claimedtasks/{id}` | Specific claimed task endpoint |
| **Body Format** | URLSearchParams | Form URL-encoded |
| **Body Content** | `submit_approve=true` | Action flag |
| **Content-Type** | `application/x-www-form-urlencoded` | Form submission format |
| **X-XSRF-TOKEN** | CSRF token | Security header |
| **Authorization** | Auth token | User authentication |

**Form Parameters:**
```typescript
// Always required
params.append('submit_approve', 'true');

// Optional: Add note/comment
params.append('submit_note', 'Approved - looks good');
```

**Response Example:**
```json
{
  "id": 12345,
  "type": "claimedtask",
  "owner": {...},
  "status": "approved",
  "nextStep": "review-step-2"
}
```

**Usage in React:**
```typescript
const handleApproveTask = async (taskId: number) => {
    try {
        setIsLoading(true);
        const result = await approveClaimedTask(taskId);
        showToast('Task approved successfully!', 'success');
        await fetchTasks();  // Refresh list
    } catch (error) {
        showToast('Failed to approve task', 'error');
    } finally {
        setIsLoading(false);
    }
};
```

---

### 3.3 Reject Task

**Endpoint:** `POST /api/workflow/claimedtasks/{id}`

**Purpose:** Reject and return workflow item to previous step with reason

**Implementation:**
```typescript
export const rejectClaimedTask = async (id: number, reason: string) => {
    try {
        const params = new URLSearchParams();
        params.append('submit_reject', 'true');
        params.append('reason', reason);

        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        return response.data;
    } catch (error: any) {
        throw error;
    }
};
```

**Key Details:**

| Property | Value | Purpose |
|----------|-------|---------|
| **Method** | POST | Submit action |
| **URL** | `/api/workflow/claimedtasks/{id}` | Specific claimed task endpoint |
| **submit_reject** | `true` | Reject action flag |
| **reason** | User-provided text | Reason for rejection |
| **Content-Type** | `application/x-www-form-urlencoded` | Form format |

**Form Parameters:**
```typescript
const params = new URLSearchParams();
params.append('submit_reject', 'true');
params.append('reason', 'Please revise metadata and resubmit');
```

**Response Example:**
```json
{
  "id": 12345,
  "type": "claimedtask",
  "status": "rejected",
  "returnedTo": "submitter",
  "reason": "Please revise metadata and resubmit"
}
```

**Usage in React:**
```typescript
const handleRejectTask = async (taskId: number, rejectionReason: string) => {
    if (!rejectionReason.trim()) {
        showToast('Please provide a rejection reason', 'warning');
        return;
    }
    
    try {
        setIsLoading(true);
        await rejectClaimedTask(taskId, rejectionReason);
        showToast('Task rejected successfully', 'success');
        await fetchTasks();
    } catch (error) {
        showToast('Failed to reject task', 'error');
    } finally {
        setIsLoading(false);
    }
};
```

---

### 3.4 Delete/Remove Task

**Endpoint:** `DELETE /api/workflow/claimedtasks/{id}`

**Purpose:** Delete or remove a claimed task

**Implementation:**
```typescript
export const deleteClaimedTask = async (id: number) => {
    try {
        const response = await axios.delete(
            `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        return response.data;
    } catch (error: any) {
        handleApiError(error);
    }
};
```

**Key Details:**

| Property | Value | Purpose |
|----------|-------|---------|
| **Method** | DELETE | Remove resource |
| **URL** | `/api/workflow/claimedtasks/{id}` | Specific task to delete |
| **Content-Type** | `application/json` | JSON format |
| **X-XSRF-TOKEN** | CSRF token | Security header |
| **Authorization** | Auth token | User authentication |

**Response:** Usually returns 204 No Content or empty object

**Usage in React:**
```typescript
const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        await deleteClaimedTask(taskId);
        showToast('Task deleted', 'success');
        await fetchTasks();
    } catch (error) {
        showToast('Failed to delete task', 'error');
    }
};
```

---

## 4. Error Handling

### Centralized Error Handler
```typescript
const handleApiError = (error: any) => {
  const errorStatus = error.response?.status || 500;
  
  if (typeof window !== 'undefined') {
    if (errorStatus === 400) {
      window.location.href = `/error-400`;
    } else if (errorStatus === 401) {
      window.location.href = `/error-401`;    // Auth expired
    } else if (errorStatus === 403) {
      window.location.href = `/error-403`;    // No permission
    } else if (errorStatus === 422) {
      window.location.href = `/error-422`;    // Invalid data
    } else if (errorStatus === 500) {
      window.location.href = `/error-500`;
    } else {
      window.location.href = `/error-404`;
    }
  }
};
```

### Common Error Codes

| Status | Meaning | Cause |
|--------|---------|-------|
| **400** | Bad Request | Missing required fields or invalid format |
| **401** | Unauthorized | Auth token expired or invalid |
| **403** | Forbidden | User lacks permission for this action |
| **404** | Not Found | Task ID doesn't exist |
| **422** | Unprocessable Entity | Invalid data (e.g., bad reason field) |
| **500** | Server Error | DSpace backend error |

### Better Error Handling Pattern
```typescript
export const approveClaimedTask = async (id: number) => {
    try {
        const params = new URLSearchParams();
        params.append('submit_approve', 'true');

        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        return response.data;
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Action failed';
        const errorStatus = error.response?.status;
        
        if (errorStatus === 401) {
            throw new Error('Your session has expired. Please log in again.');
        } else if (errorStatus === 403) {
            throw new Error('You do not have permission to perform this action.');
        } else if (errorStatus === 422) {
            throw new Error(`Invalid data: ${errorMsg}`);
        } else {
            throw new Error(`Operation failed: ${errorMsg}`);
        }
    }
};
```

---

## 5. Integration Example: Complete Workflow Component

```typescript
import React, { useState } from 'react';
import { 
  approveClaimedTask, 
  rejectClaimedTask, 
  deleteClaimedTask 
} from '../../api/workflowTask';
import { Button, TextField, Dialog, CircularProgress } from '@mui/material';

interface WorkflowActionProps {
  taskId: number;
  onActionComplete: () => void;
}

const WorkflowActions: React.FC<WorkflowActionProps> = ({ 
  taskId, 
  onActionComplete 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveClaimedTask(taskId);
      alert('Task approved successfully!');
      onActionComplete();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      await rejectClaimedTask(taskId, rejectReason);
      alert('Task rejected successfully!');
      setShowRejectDialog(false);
      setRejectReason('');
      onActionComplete();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;

    setIsLoading(true);
    try {
      await deleteClaimedTask(taskId);
      alert('Task deleted!');
      onActionComplete();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="contained" 
        color="success" 
        onClick={handleApprove}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Approve'}
      </Button>

      <Button 
        variant="contained" 
        color="warning" 
        onClick={() => setShowRejectDialog(true)}
        disabled={isLoading}
        sx={{ ml: 1 }}
      >
        Reject
      </Button>

      <Button 
        variant="contained" 
        color="error" 
        onClick={handleDelete}
        disabled={isLoading}
        sx={{ ml: 1 }}
      >
        Delete
      </Button>

      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
        <div style={{ padding: '20px', minWidth: '400px' }}>
          <h3>Reject Task</h3>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this task is being rejected..."
          />
          <div style={{ marginTop: '20px' }}>
            <Button 
              onClick={() => setShowRejectDialog(false)}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Confirm Reject'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default WorkflowActions;
```

---

## 6. Key Points for Other Projects

### Security Headers (Required)
- ✅ `X-XSRF-TOKEN`: CSRF protection - **MUST** be included for POST/DELETE
- ✅ `Authorization`: User authentication token
- ✅ `withCredentials: true`: Include cookies

### Content-Type Matters
- **Claim task**: `text/uri-list` (URI reference format)
- **Approve/Reject**: `application/x-www-form-urlencoded` (form data)
- **Delete**: `application/json`

### Parameter Structure
```typescript
// For claim: Pass URI as body (string, not JSON)
`${siteConfig.apiEndpoint}/api/workflow/pooltasks/${id}`

// For approve/reject: Use URLSearchParams
const params = new URLSearchParams();
params.append('submit_approve', 'true');  // or 'submit_reject'
params.append('reason', 'Your reason');   // Required for reject

// Delete: No body needed
```

### ID Types
- **Task ID for actions**: Usually `number` (e.g., 12345)
- **Pool task ID for claiming**: Usually `string` (UUID or number as string)

### Always Validate
```typescript
// Before rejecting
if (!reason || !reason.trim()) {
  throw new Error('Reason is required');
}

// Before claiming
if (!taskId) {
  throw new Error('Task ID is required');
}
```

---

## 7. Testing Checklist

- [ ] Authentication tokens are properly stored before actions
- [ ] CSRF token is included in all POST/DELETE requests
- [ ] Content-Type headers match the body format
- [ ] Task IDs are valid before attempting actions
- [ ] Rejection reason is non-empty
- [ ] API endpoints match your DSpace version
- [ ] Error handling displays user-friendly messages
- [ ] Loading states prevent double-clicks
- [ ] Page refreshes after successful actions
- [ ] Expired auth tokens trigger re-login

---

## 8. Debugging Tips

### Enable Console Logging
Add to API functions:
```typescript
console.log('[WorkflowTask] Action:', actionType);
console.log('[WorkflowTask] URL:', url);
console.log('[WorkflowTask] Headers:', headers);
console.log('[WorkflowTask] Response:', response.data);
```

### Check Network Tab
- Open DevTools (F12)
- Go to Network tab
- Perform action
- Click the request
- Verify Headers, Request Body, Response

### Check Browser Console
- Look for error messages
- Check auth token validity
- Verify CSRF token presence

---

## Summary

This implementation provides a complete, production-ready pattern for DSpace workflow actions:

✅ **Claim**: Assign pool task to yourself
✅ **Approve**: Move item to next workflow step
✅ **Reject**: Return item with reason
✅ **Delete**: Remove claimed task

All with proper error handling, security headers, and authentication.

Use this document as reference when implementing in other projects!
