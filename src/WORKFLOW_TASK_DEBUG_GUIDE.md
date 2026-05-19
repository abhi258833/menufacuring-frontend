# Workflow Task Data Fetching - Debug Guide

## Problem
Data is not loading in the workflow task management component. Follow these steps to identify the issue.

---

## Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab. Look for logs starting with `[Workflow]` and `[Component]`.

### Expected Logs:
```
[Component] Fetching pool tasks - Page: 0 Size: 10
[Workflow] Fetching pool tasks from: http://localhost:8080/server/api/workflow/pooltasks?page=0&size=10
[Workflow] Full pool tasks response: {...}
[Workflow] Response structure keys: [...]
[Component] Tasks result: {tasks: Array, totalElements: 0}
```

### Common Issues:

**Issue 1: 401 Unauthorized**
```
Error: Failed to fetch workflow tasks
[Workflow] Error fetching pool tasks - Status: 401
```
**Cause**: Auth token is missing or expired  
**Solution**: Login again, ensure `localStorage.authToken` is set

**Issue 2: 403 Forbidden**
```
Status: 403
```
**Cause**: User doesn't have workflow permission  
**Solution**: Ensure user has workflow reviewer role in DSpace

**Issue 3: 404 Not Found**
```
Status: 404
```
**Cause**: API endpoint doesn't exist in your DSpace version  
**Solution**: Check DSpace documentation for correct endpoint

---

## Step 2: Verify Authentication Token

In browser Console, run:
```javascript
console.log('Auth Token:', localStorage.getItem('authToken'))
console.log('CSRF Token:', localStorage.getItem('csrfToken'))
```

**Expected Output:**
```
Auth Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CSRF Token: a14f5c2b-1234-5678-abcd-ef1234567890
```

**If empty:** Tokens are missing  
**Solution:** User needs to log in first

---

## Step 3: Check API Response Structure

In browser Console, copy this code:

```javascript
// Check what the API returns
const authToken = localStorage.getItem('authToken')
fetch('http://localhost:8080/server/api/workflow/pooltasks?page=0&size=10', {
  headers: {
    'Authorization': authToken,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Raw API Response:', data)
  console.log('Response Type:', typeof data)
  console.log('Is Array?', Array.isArray(data))
  console.log('Response Keys:', Object.keys(data))
  if (data._embedded) console.log('_embedded Keys:', Object.keys(data._embedded))
  if (data.page) console.log('Page Info:', data.page)
})
.catch(e => console.error('API Error:', e))
```

### Expected Response Structures:

**Option 1: Direct Array**
```javascript
[
  { id: 1, type: "pooltask", ... },
  { id: 2, type: "pooltask", ... }
]
```

**Option 2: Embedded with Pagination**
```javascript
{
  _embedded: {
    pooltasks: [
      { id: 1, type: "pooltask", ... }
    ]
  },
  page: {
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10
  }
}
```

**Option 3: Page Wrapper**
```javascript
{
  page: {
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10
  },
  ...tasks
}
```

---

## Step 4: Update API Functions if Needed

If the response structure is different from what the functions expect, update `src/api/workflowTask.ts`:

**If receiving direct array:**
```typescript
export const getPoolTasks = async (page: number = 0, size: number = 10) => {
  const response = await axios.get<any[]>(url, { /* ... */ })
  
  // For direct array response
  return {
    tasks: Array.isArray(response.data) ? response.data : [],
    totalElements: response.data.length
  }
}
```

**If receiving different embedding:**
```typescript
const tasks = response.data._embedded?.pooltasks ||
              response.data.pooltasks ||
              response.data || [];
```

---

## Step 5: Check Component Rendering

Looking at the workflow task page, verify:

1. **Loading state shows?** 
   - Yes: Spinner appears while fetching
   - No: Check if `isLoading` state is being set properly

2. **No results message appears?**
   - Yes: Data returned but empty
   - No: Check console for errors

3. **Cards/Items render?**
   - Yes: Data is loading correctly
   - No: Check `getTaskTitle()` and `getSubmitterName()` functions

---

## Step 6: Debug Specific Functions

### Test getPoolTasks() directly:

```javascript
// In browser console (after component loads):
import { getPoolTasks } from './api/workflowTask'
getPoolTasks(0, 10).then(result => {
  console.log('getPoolTasks result:', result)
  console.log('Tasks count:', result.tasks.length)
  console.log('Total elements:', result.totalElements)
})
```

### Test getClaimedTasks() directly:

```javascript
import { getClaimedTasks } from './api/workflowTask'
getClaimedTasks(0, 10).then(result => {
  console.log('getClaimedTasks result:', result)
  console.log('Tasks count:', result.tasks.length)
  console.log('Total elements:', result.totalElements)
})
```

---

## Step 7: Verify DSpace Endpoints

Check if these endpoints exist in your DSpace instance:

```bash
# Test pool tasks endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/server/api/workflow/pooltasks?page=0&size=10

# Test claimed tasks endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/server/api/workflow/claimedtasks?page=0&size=10
```

If you get 404, check:
- DSpace version (must be 8.x+)
- Workflow module is enabled
- Correct API endpoint path

---

## Step 8: Check Component Props

Verify the component receives correct initial values:

```javascript
// In component's React DevTools:
console.log('Component State:', {
  workflowItems,
  totalData,
  taskType,
  page,
  size,
  isLoading
})
```

---

## Common Solutions Summary

| Issue | Solution |
|-------|----------|
| Empty data array | Check API response structure |
| 401 Error | Login again, verify auth token |
| 403 Error | Verify user has workflow role |
| 404 Error | Check DSpace version & endpoints |
| Infinite loading | Check useEffect dependencies |
| No update on tab switch | Verify taskType state changes |
| Wrong task data | Check task extraction logic |

---

## Contact Information

If issues persist:
1. Check the console logs (copy full error message)
2. Verify DSpace is running and accessible
3. Confirm user has workflow permissions
4. Check DSpace version matches (v8.x)
