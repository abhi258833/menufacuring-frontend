# Assign Role to Collections - Implementation Guide

## Overview

This document provides a complete guide to implementing the "Assign Role to Collections" feature in your project. This feature enables administrators to assign workflow-related roles (Submitter, Reviewer, Editor, Final Editor) to DSpace collections, enabling fine-grained access control and workflow management.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [API Layer](#api-layer)
4. [UI Components](#ui-components)
5. [Integration Steps](#integration-steps)
6. [Routing Configuration](#routing-configuration)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

---

## Feature Overview

### What is Role Assignment?

Role assignment allows collection administrators to:

- **Create role-based groups** for collections (Submitter, Reviewer, Editor, Final Editor)
- **Manage access control** by assigning users/groups to specific roles
- **Control workflow processes** through role-based permissions
- **Edit and delete role groups** as needed

### Supported Roles

1. **Submitter**: Users who can submit items to the collection
2. **Reviewer**: Users who can review submissions
3. **Editor**: Users who can edit items in the collection
4. **Final Editor**: Users who can provide final approval for items

---

## Architecture

### Component Hierarchy

```
Collection Management Page
├── Policies Component (policy.tsx)
│   └── Assign Role Button
│       └── AssignRole Component (AssignRole.tsx)
│           ├── Submitter Section
│           ├── Reviewer Section
│           ├── Editor Section
│           └── Final Editor Section
```

### Data Flow

```
User clicks "Assign Role" 
  ↓
Navigate to /assignRole/:collectionId
  ↓
AssignRole Component Loads
  ↓
fetchAllGroups() API calls
  ↓
Display role sections with Create/Delete buttons
  ↓
User actions (Create/Edit/Delete)
  ↓
API calls update backend
  ↓
UI state updates and reflects changes
```

---

## API Layer

### API File: `src/api/assignRole.ts`

#### Endpoints Overview

All endpoints follow the DSpace REST API structure for managing collection role groups.

#### 1. Submitter Role Endpoints

```typescript
// Fetch existing submitter group for a collection
fetchSubmitterGroup(uuid: string)
- URL: /api/core/collections/{uuid}/submittersGroup
- Method: GET
- Returns: Group object

// Create a new submitter group
createSubmitterGroup(uuid: string, description: string)
- URL: /api/core/collections/{uuid}/submittersGroup
- Method: POST
- Payload: { metadata: { "dc.description": [{ value: string }] } }
- Returns: Created Group object

// Delete submitter group
deleteSubmitterGroup(uuid: string)
- URL: /api/core/collections/{uuid}/submittersGroup
- Method: DELETE
- Returns: 204 No Content
```

#### 2. Reviewer Role Endpoints

```typescript
// Fetch existing reviewer group
fetchReviewerGroup(uuid: string)
- URL: /api/core/collections/{uuid}/workflowGroups/reviewer
- Method: GET
- Returns: Group object

// Create a new reviewer group
createReviewerGroup(uuid: string, description: string)
- URL: /api/core/collections/{uuid}/workflowGroups/reviewer
- Method: POST
- Payload: { metadata: { "dc.description": [{ value: string }] } }
- Returns: Created Group object

// Delete reviewer group
deleteReviewerGroup(uuid: string)
- URL: /api/core/collections/{uuid}/workflowGroups/reviewer
- Method: DELETE
- Returns: 204 No Content
```

#### 3. Editor Role Endpoints

```typescript
// Fetch existing editor group
fetchEditorGroup(uuid: string)
- URL: /api/core/collections/{uuid}/workflowGroups/editor
- Method: GET
- Returns: Group object

// Create a new editor group
createEditorGroup(uuid: string, description: string)
- URL: /api/core/collections/{uuid}/workflowGroups/editor
- Method: POST
- Payload: { metadata: { "dc.description": [{ value: string }] } }
- Returns: Created Group object

// Delete editor group
deleteEditorGroup(uuid: string)
- URL: /api/core/collections/{uuid}/workflowGroups/editor
- Method: DELETE
- Returns: 204 No Content
```

#### 4. Final Editor Role Endpoints

```typescript
// Fetch existing final editor group
fetchFinalEditorGroup(uuid: string)
- URL: /api/core/collections/{uuid}/workflowGroups/finaleditor
- Method: GET
- Returns: Group object

// Create a new final editor group
createFinalEditorGroup(uuid: string, description: string)
- URL: /api/core/collections/{uuid}/workflowGroups/finaleditor
- Method: POST
- Payload: { metadata: { "dc.description": [{ value: string }] } }
- Returns: Created Group object

// Delete final editor group
deleteFinalEditorGroup(uuid: string)
- URL: /api/core/collections/{uuid}/workflowGroups/finaleditor
- Method: DELETE
- Returns: 204 No Content
```

#### Group Object Structure

```typescript
interface Group {
    id: string;
    uuid: string;
    name: string;
    metadata: {
        'dc.description': Array<{
            value: string;
            language: null;
            authority: null;
            confidence: number;
            place: number;
        }>;
    };
    _links: {
        self: {
            href: string;
        };
    };
}
```

#### Authentication & Headers

All API requests include:

```typescript
headers: {
    "Content-Type": "application/json",
    "X-XSRF-TOKEN": csrfToken,
    "Authorization": authToken
}
```

---

## UI Components

### 1. Main Component: AssignRole.tsx

#### Purpose
Displays role management interface for a specific collection with options to create, edit, and delete role groups.

#### Props
```typescript
interface AssignRoleProps {
    description?: string;  // Default group description (optional)
}
```

#### State Management

```typescript
// Group states for each role
const [submitterGroup, setSubmitterGroup] = useState<Group | null>(null);
const [reviewerGroup, setReviewerGroup] = useState<Group | null>(null);
const [editorGroup, setEditorGroup] = useState<Group | null>(null);
const [finalEditorGroup, setFinalEditorGroup] = useState<Group | null>(null);

// Loading states
const [loading, setLoading] = useState({
    submitter: false,
    reviewer: false,
    editor: false,
    finalEditor: false
});

// Error states
const [error, setError] = useState({
    submitter: null as string | null,
    reviewer: null as string | null,
    editor: null as string | null,
    finalEditor: null as string | null
});
```

#### Key Functions

```typescript
// Fetches all role groups for the collection
const fetchAllGroups = async () => {
    // Uses Promise.all for parallel API calls
    // Updates state with fetched groups or error messages
}

// Creates a new role group
const handleCreateGroup = async (type: RoleType) => {
    // Type: 'submitter' | 'reviewer' | 'editor' | 'finalEditor'
    // Creates group with description
    // Updates state with newly created group
}

// Deletes an existing role group
const handleDeleteGroup = async (type: RoleType) => {
    // Deletes the group
    // Clears state for the role
}

// Renders individual role section
const renderGroupSection = (
    type: RoleType,
    group: Group | null,
    title: string
) => {
    // Returns UI with loading/error/empty/created states
}
```

#### Component Lifecycle

1. **On Mount**: `useEffect` triggers `fetchAllGroups()`
2. **During Load**: Loading spinners displayed for each role
3. **On Success**: Groups displayed with Edit/Delete options
4. **On Error**: Error messages shown for failed operations

#### UI Sections

Each role has a card that displays:

- **Loading State**: Loader component while fetching
- **Error State**: Error message in red text
- **Empty State**: "Create" button when no group exists
- **Populated State**: 
  - Group name as clickable link (navigates to edit group)
  - Delete button to remove the group

### 2. Integration with Collection Policy Page

The "Assign Role" button should be added to the policy management page (`policy.tsx`):

```typescript
const handleAssignRole = () => {
    navigate(`/assignRole/${id}`)
}
```

Button placement:
```tsx
<Box sx={{ display: "flex", justifyContent: "end", mb: 2, gap: 2, mt: 2 }}>
    <Button variant="contained" color="secondary" /* Delete button */>
        Delete selected
    </Button>
    <Button 
        variant="contained"
        onClick={() => handleAssignRole()}
        color="info"
    >
        Assign Role
    </Button>
    <Button variant="contained" color="success" /* Add button */>
        Add
    </Button>
</Box>
```

---

## Integration Steps

### Step 1: Copy API Files

Copy the API integration file to your project:

```bash
# Source
/src/api/assignRole.ts

# Target
/your-project/src/api/assignRole.ts
```

Update the `siteConfig.apiEndpoint` to match your backend configuration.

### Step 2: Copy Component Files

Copy the UI component:

```bash
# Source
/src/pages/assignRole/AssignRole.tsx

# Target
/your-project/src/pages/assignRole/AssignRole.tsx
```

### Step 3: Update Policy Component

Modify your collection policy/management page to include the "Assign Role" button:

1. Import `useNavigate` from `react-router-dom`
2. Add `handleAssignRole` function
3. Add the "Assign Role" button to the button bar
4. Use appropriate color (e.g., `color="info"`) to distinguish from other buttons

### Step 4: Add Routing

Update your routing configuration to include the AssignRole route:

```typescript
// In your AppRoutes.tsx or routing configuration
<Route path="/assignRole/:id" element={<AssignRole />} />
```

### Step 5: Install Dependencies

Ensure you have Material-UI installed:

```bash
npm install @mui/material @emotion/react @emotion/styled
```

### Step 6: Import Required Components

In AssignRole.tsx, ensure these imports are available:

```typescript
import { Box, Button, Container, Typography } from '@mui/material'
import Loader from '../loader/loader'  // Ensure loader component exists
```

---

## Routing Configuration

### Route Definition

```typescript
// AppRoutes.tsx or equivalent
<Route 
    path="/assignRole/:id" 
    element={<AssignRole />} 
/>
```

### Route Parameters

- `:id` - Collection UUID/ID (required)

### Navigation Examples

```typescript
// From policy page
navigate(`/assignRole/${collectionId}`)

// From collection management page
navigate(`/assignRole/${selectedCollection.id}`)
```

---

## State Management Integration

### React Context Integration (if using Context API)

```typescript
// Create a context for role management (optional)
import { createContext, useState } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [roles, setRoles] = useState({});
    
    return (
        <RoleContext.Provider value={{ roles, setRoles }}>
            {children}
        </RoleContext.Provider>
    );
};
```

### Redux Integration (if using Redux)

```typescript
// Action
export const fetchRolesForCollection = (collectionId) => ({
    type: 'FETCH_ROLES',
    payload: collectionId
});

// Reducer
const roleReducer = (state = {}, action) => {
    switch (action.type) {
        case 'FETCH_ROLES':
            return { ...state, currentCollection: action.payload };
        default:
            return state;
    }
};
```

---

## Testing Guide

### Unit Tests

#### Test API Functions

```typescript
// assignRole.api.test.ts
describe('assignRole API', () => {
    it('should fetch submitter group', async () => {
        const result = await fetchSubmitterGroup('test-uuid');
        expect(result).toBeDefined();
        expect(result.name).toBeTruthy();
    });

    it('should create submitter group', async () => {
        const result = await createSubmitterGroup('test-uuid', 'Test Group');
        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
        try {
            await fetchSubmitterGroup('invalid-uuid');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});
```

#### Test Components

```typescript
// AssignRole.test.tsx
describe('AssignRole Component', () => {
    it('should render role sections', () => {
        const { getByText } = render(<AssignRole />);
        expect(getByText('Submitter')).toBeInTheDocument();
        expect(getByText('Reviewer')).toBeInTheDocument();
    });

    it('should show loader while fetching', () => {
        const { getByTestId } = render(<AssignRole />);
        expect(getByTestId('loader')).toBeInTheDocument();
    });

    it('should display error messages', () => {
        const { getByText } = render(<AssignRole />);
        // Trigger error state
        expect(getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
});
```

### Integration Tests

```typescript
// Test the full flow
describe('Assign Role Integration', () => {
    it('should create and display a role group', async () => {
        const { getByText, getByRole } = render(<AssignRole />);
        
        const createButton = getByRole('button', { name: /Create/i });
        fireEvent.click(createButton);
        
        await waitFor(() => {
            expect(getByText('Group Name')).toBeInTheDocument();
        });
    });

    it('should delete a role group', async () => {
        const { getByText, getByRole } = render(<AssignRole />);
        
        const deleteButton = getByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButton);
        
        await waitFor(() => {
            expect(getByText(/Create/i)).toBeInTheDocument();
        });
    });
});
```

### Manual Testing Checklist

- [ ] Can navigate to AssignRole page from collection policies
- [ ] Loads all four role sections on initial load
- [ ] Can create a new submitter group
- [ ] Can create a new reviewer group
- [ ] Can create a new editor group
- [ ] Can create a new final editor group
- [ ] Can delete created groups
- [ ] Can edit group names by clicking on them
- [ ] Error messages display correctly for failed operations
- [ ] Loading states display during API calls
- [ ] Cannot create duplicate roles
- [ ] Collection ID is properly passed and used

---

## Troubleshooting

### Issue: "Collection ID is missing"

**Cause**: Route parameter `:id` is not passed correctly

**Solution**: 
```typescript
// Verify routing includes collection ID
navigate(`/assignRole/${collectionId}`)  // Correct
navigate(`/assignRole/`)  // Wrong - missing ID
```

### Issue: API returns 401 Unauthorized

**Cause**: Authentication token is invalid or expired

**Solution**:
```typescript
// Check localStorage tokens
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('csrfToken'));

// Verify token is included in headers
headers: {
    "Authorization": `Bearer ${authToken}`,  // Some APIs require this format
    "X-XSRF-TOKEN": csrfToken
}
```

### Issue: Groups not loading

**Cause**: Backend endpoint not implemented or API URL incorrect

**Solution**:
```typescript
// Verify API endpoint URL
console.log(`${siteConfig.apiEndpoint}/api/core/collections/${uuid}/submittersGroup`);

// Check network tab in browser DevTools for actual request
// Verify 404 vs other error codes
```

### Issue: Edit group navigation not working

**Cause**: EditGroup component not found or route not defined

**Solution**:
```typescript
// Ensure route is defined
<Route path="/edit-group" element={<EditGroup />} />

// Verify component exists
import EditGroup from '../pages/Group/EditGroup';
```

### Issue: Loader component not found

**Cause**: Loader component doesn't exist in project

**Solution**:
```typescript
// Create a simple loader or use Material-UI CircularProgress
import { CircularProgress, Box } from '@mui/material';

// In component
<Box display="flex" justifyContent="center">
    <CircularProgress />
</Box>
```

### Issue: Styling inconsistent with project

**Cause**: Material-UI theme not configured

**Solution**:
```typescript
// Wrap your app with ThemeProvider
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        info: { main: '#0288d1' }
    }
});

<ThemeProvider theme={theme}>
    <YourApp />
</ThemeProvider>
```

---

## Advanced Configuration

### Custom Role Descriptions

Modify the `AssignRole` component to accept custom descriptions:

```typescript
function AssignRole({ 
    description = "Default group",
    collectionName = ""
}: AssignRoleProps) {
    // Use collectionName in descriptions
    const submitterDesc = `${collectionName} Submitter Group`;
    // ...
}
```

### Multiple Collections

To manage roles for multiple collections:

```typescript
// Create a wrapper component
function CollectionRoleManager() {
    const [collections, setCollections] = useState([]);
    
    return (
        <div>
            {collections.map(collection => (
                <AssignRole key={collection.id} />
            ))}
        </div>
    );
}
```

### Batch Operations

Add ability to manage multiple roles at once:

```typescript
const handleBatchCreateRoles = async () => {
    const roleTypes: RoleType[] = ['submitter', 'reviewer', 'editor', 'finalEditor'];
    
    await Promise.all(
        roleTypes.map(type => handleCreateGroup(type))
    );
};
```

---

## Best Practices

1. **Error Handling**: Always provide user-friendly error messages
2. **Loading States**: Show feedback during API calls
3. **Validation**: Validate collection ID before making API calls
4. **Permissions**: Check user permissions before allowing role management
5. **Logging**: Log API calls and errors for debugging
6. **Caching**: Consider caching role data to reduce API calls
7. **Accessibility**: Ensure buttons and links are keyboard accessible

---

## Support & References

- DSpace REST API Documentation: [https://wiki.dspace.org/display/DSPACE/REST+API](https://wiki.dspace.org/display/DSPACE/REST+API)
- Material-UI Documentation: [https://mui.com](https://mui.com)
- React Router Documentation: [https://reactrouter.com](https://reactrouter.com)

---

**Document Version**: 1.0  
**Last Updated**: March 29, 2026  
**Compatible With**: DSpace 8.x, React 18.x, Material-UI 5.x+

