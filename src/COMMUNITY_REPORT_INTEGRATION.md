# Community Report REST API Integration Guide

## Overview
This document provides comprehensive instructions for integrating the DSpace Community Report REST API with your React frontend application.

---

## 1. Backend API Endpoint

### URL
```
GET /api/report/community
```

### Authority
- **Required Role:** ADMIN
- **Authentication:** Bearer Token (JWT)

### Request Parameters

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `fromDate` | String | No | `yyyy-MM-dd` | Filter items modified after this date |
| `toDate` | String | No | `yyyy-MM-dd` | Filter items modified before this date |
| `page` | Integer | No | N/A | Page number (0-indexed, default: 0) |
| `size` | Integer | No | N/A | Items per page (default: 20) |

### Example Requests

```bash
# Basic request
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/report/community

# With date filters
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/report/community?fromDate=2025-01-01&toDate=2025-12-31"

# With pagination
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/report/community?page=1&size=50"

# With all parameters
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/api/report/community?fromDate=2025-01-01&toDate=2025-12-31&page=0&size=20"
```

---

## 2. Response Format

### HTTP 200 - Success

```json
[
  {
    "communityId": "550e8400-e29b-41d4-a716-446655440000",
    "communityName": "Research Community",
    "collections": [
      {
        "collectionId": "660e8400-e29b-41d4-a716-446655440001",
        "collectionName": "Thesis Collection",
        "hasCustomLicense": true,
        "pagination": {
          "page": 0,
          "size": 20,
          "totalElements": 150,
          "totalPages": 8
        },
        "items": [
          {
            "itemId": "770e8400-e29b-41d4-a716-446655440002",
            "itemName": "Research Paper Title",
            "metadata": {
              "dc.title": ["Research Paper Title"],
              "dc.creator": ["John Doe", "Jane Smith"],
              "dc.date.issued": ["2025-03-15"],
              "dc.description.abstract": ["Study about..."],
              "dc.subject": ["keyword1", "keyword2"],
              "dc.type": ["article"]
            }
          }
        ]
      }
    ]
  }
]
```

### HTTP 400 - Bad Request

```json
{
  "error": "Invalid date format, use yyyy-MM-dd"
}
```

### HTTP 401 - Unauthorized

```json
{
  "error": "Unauthorized access"
}
```

### HTTP 403 - Forbidden

```json
{
  "error": "Admin access required"
}
```

---

## 3. React Implementation

### 3.1 Service Layer

Create `src/services/communityReportService.ts`:

```typescript
import { API_BASE_URL } from '../config';

export interface CommunityReportParams {
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MetadataMap {
  [key: string]: string[];
}

export interface ItemData {
  itemId: string;
  itemName: string;
  metadata: MetadataMap;
}

export interface CollectionData {
  collectionId: string;
  collectionName: string;
  hasCustomLicense: boolean;
  pagination: PaginationInfo;
  items: ItemData[];
}

export interface CommunityData {
  communityId: string;
  communityName: string;
  collections: CollectionData[];
}

export class CommunityReportService {
  private static buildQueryString(params?: CommunityReportParams): string {
    if (!params) return '';
    
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    
    return queryParams.toString() ? `?${queryParams.toString()}` : '';
  }

  static async fetchCommunityReport(
    params?: CommunityReportParams
  ): Promise<CommunityData[]> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const queryString = this.buildQueryString(params);
    const url = `${API_BASE_URL}/api/report/community${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }

      if (response.status === 403) {
        throw new Error('Forbidden - Admin access required');
      }

      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid request parameters');
      }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch community report:', error);
      throw error;
    }
  }
}
```

### 3.2 Custom Hook

Create `src/hooks/useCommunityReport.ts`:

```typescript
import { useState, useCallback } from 'react';
import { 
  CommunityReportService, 
  CommunityReportParams, 
  CommunityData 
} from '../services/communityReportService';

interface UseCommunityReportState {
  data: CommunityData[];
  loading: boolean;
  error: string | null;
}

export const useCommunityReport = () => {
  const [state, setState] = useState<UseCommunityReportState>({
    data: [],
    loading: false,
    error: null,
  });

  const fetchReport = useCallback(async (params?: CommunityReportParams) => {
    setState({ data: [], loading: true, error: null });
    try {
      const data = await CommunityReportService.fetchCommunityReport(params);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, []);

  return { ...state, fetchReport };
};
```

### 3.3 React Component

Create `src/components/CommunityReport.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useCommunityReport } from '../hooks/useCommunityReport';
import './CommunityReport.css';

export const CommunityReport: React.FC = () => {
  const { data, loading, error, fetchReport } = useCommunityReport();
  
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    page: 0,
    size: 20,
  });

  useEffect(() => {
    fetchReport(filters);
  }, [filters]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, size: parseInt(e.target.value), page: 0 });
  };

  if (loading) return <div className="loading">Loading report...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="community-report">
      <h1>Community Report</h1>

      {/* Filter Section */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="fromDate">From Date:</label>
          <input
            id="fromDate"
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="toDate">To Date:</label>
          <input
            id="toDate"
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="size">Items per page:</label>
          <select id="size" value={filters.size} onChange={handleSizeChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {data.map((community) => (
          <div key={community.communityId} className="community-section">
            <h2>{community.communityName}</h2>

            {community.collections.map((collection) => (
              <div key={collection.collectionId} className="collection-section">
                <h3>{collection.collectionName}</h3>
                <p className="meta">
                  License: {collection.hasCustomLicense ? 'Custom' : 'Standard'}
                </p>

                {collection.items.length > 0 ? (
                  <>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Title</th>
                          <th>Creator(s)</th>
                          <th>Date Issued</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collection.items.map((item) => (
                          <tr key={item.itemId}>
                            <td>{item.itemName}</td>
                            <td>
                              {item.metadata['dc.title']?.join(', ') || 'N/A'}
                            </td>
                            <td>
                              {item.metadata['dc.creator']?.join(', ') || 'N/A'}
                            </td>
                            <td>
                              {item.metadata['dc.date.issued']?.[0] || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page === 0}
                      >
                        Previous
                      </button>
                      <span>
                        Page {filters.page + 1} of{' '}
                        {collection.pagination.totalPages || 1}
                      </span>
                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={
                          filters.page >= collection.pagination.totalPages - 1
                        }
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="no-items">No items found</p>
                )}
              </div>
            ))}
          </div>
        ))}

        {data.length === 0 && !loading && (
          <p className="no-data">No communities found</p>
        )}
      </div>
    </div>
  );
};
```

### 3.4 Styling

Create `src/components/CommunityReport.css`:

```css
.community-report {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.community-report h1 {
  color: #333;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: bold;
  font-size: 14px;
}

.filter-group input,
.filter-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.report-content {
  background-color: #fff;
  border-radius: 5px;
}

.community-section {
  margin-bottom: 30px;
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 5px;
}

.community-section h2 {
  color: #0066cc;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #0066cc;
}

.collection-section {
  margin-left: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-left: 4px solid #666;
}

.collection-section h3 {
  color: #333;
  margin: 0 0 10px 0;
}

.meta {
  color: #666;
  font-size: 14px;
  margin: 5px 0 15px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.items-table th {
  background-color: #f0f0f0;
  padding: 10px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  font-weight: bold;
}

.items-table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.items-table tr:hover {
  background-color: #f5f5f5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 15px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.pagination button:hover:not(:disabled) {
  background-color: #0052a3;
}

.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.no-items,
.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 20px;
  border-radius: 5px;
  margin: 20px;
}
```

---

## 4. Configuration

### Environment Setup

Create or update `src/config.ts`:

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
export const AUTH_TOKEN_KEY = 'authToken';
```

Update `.env`:

```
REACT_APP_API_URL=http://localhost:8080
```

---

## 5. Route Integration

Add to your routing configuration (e.g., `App.tsx`):

```typescript
import { CommunityReport } from './components/CommunityReport';
import { PrivateRoute } from './components/PrivateRoute';

export const App = () => {
  return (
    <Routes>
      {/* Other routes */}
      <Route
        path="/admin/report/community"
        element={
          <PrivateRoute requiredRole="ADMIN">
            <CommunityReport />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};
```

---

## 6. Authentication Guard Component

Create `src/components/PrivateRoute.tsx`:

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

---

## 7. Error Handling Best Practices

```typescript
try {
  const report = await CommunityReportService.fetchCommunityReport(filters);
  // Process report
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('Forbidden')) {
      // Show permission denied message
      showNotification('You do not have permission to access this report');
    } else if (error.message.includes('Invalid')) {
      // Show validation error
      showNotification('Please check your date format (yyyy-MM-dd)');
    } else {
      // Show generic error
      showNotification(`Error: ${error.message}`);
    }
  }
}
```

---

## 8. Performance Tips

1. **Pagination**: Always use pagination to avoid loading too many items
2. **Memoization**: Use `useMemo` for expensive computations in tables
3. **Lazy Loading**: Consider implementing virtualization for large tables
4. **Caching**: Implement request caching for repeated API calls
5. **Date Validation**: Validate date inputs on client-side before API call

Example with memoization:

```typescript
import { useMemo } from 'react';

const MemoizedCommunityReport = useMemo(() => {
  return data.map(community => (
    <CommunityRow key={community.communityId} community={community} />
  ));
}, [data]);
```

---

## 9. Testing

### Jest Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CommunityReport } from './CommunityReport';

jest.mock('../services/communityReportService');

describe('CommunityReport', () => {
  it('should render loading state', () => {
    render(<CommunityReport />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle date filter changes', () => {
    render(<CommunityReport />);
    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: '2025-01-01' } });
    expect(dateInput).toHaveValue('2025-01-01');
  });
});
```

---

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check if token is valid and stored in localStorage |
| 403 Forbidden | Ensure user has ADMIN role |
| Empty results | Check date filter range and collection contents |
| Date format error | Ensure dates are in `yyyy-MM-dd` format |
| CORS errors | Configure CORS in Spring Boot backend |

---

## 11. Summary

- **API Endpoint:** `GET /api/report/community`
- **Authentication:** Bearer Token (Admin required)
- **Query Parameters:** `fromDate`, `toDate`, `page`, `size`
- **Response:** Hierarchical JSON with communities → collections → items
- **Frontend Implementation:** Service layer + Custom hook + React component

For additional support or customization, refer to the DSpace API documentation or contact your development team.
