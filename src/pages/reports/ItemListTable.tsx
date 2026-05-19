import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { itemReportApi } from '../../api/itemReport';
import Loader from '../loader/loader';

export interface Metadata {
  [key: string]: string[];
}

export interface Item {
  itemId: string;
  itemName?: string;
  metadata: Metadata;
}

export interface Collection {
  collectionId: string;
  collectionName: string;
  availableMetadata?: string[];
  items: Item[];
}

export interface Community {
  communityId: string;
  communityName: string;
  collections: Collection[];
}

export interface ApiResponse {
  data: Community[];
  totalCommunities?: number;
  totalItems?: number;
  page?: number;
  size?: number;
}

const HIDDEN_COLUMNS = [
  'dc.date.accessioned',
  'dc.identifier.uri',
  'dc.description.provenance',
];

const ItemReportTable: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [availableMetadata, setAvailableMetadata] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedMetadata, setSelectedMetadata] = useState('');
  const [metadataValue, setMetadataValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  // ✅ Detect date-like metadata keys
  const isDateField = (key: string) => {
    const lower = key.toLowerCase();
    return (
      lower.includes('date') ||
      lower.includes('joiningdate') ||
      lower.includes('dod') ||
      lower.includes('created') ||
      lower.includes('year')
    );
  };

  // ✅ Fetch Data from API
  const fetchReport = async (
    pageNum = 0,
    collectionId = '',
    metadataKey = '',
    metadataVal = '',
    start = '',
    end = ''
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Only pass pagination params to API - filters are applied client-side
      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('size', String(itemsPerPage));

      console.log("🚀 Fetching report with params:", params.toString());
      const data: ApiResponse = await itemReportApi(params.toString());
      
      console.log("✅ Raw API Response:", data);
      console.log("✅ Response data type:", typeof data);
      console.log("✅ Is data.data an array?", Array.isArray(data.data));
      
      const communities = Array.isArray(data.data) ? data.data : [];
      console.log("Communities:", communities);

      // 🔹 Flatten all collections
      const allCollections = communities.flatMap((c) => c.collections || []);
      setCollections(allCollections);
      console.log("All Collections:", allCollections);
      console.log("Collection names:", allCollections.map(c => c.collectionName));

      // 🔹 Flatten all items
      const allItems = allCollections.flatMap((c) => c.items || []);
      setItems(allItems);
      console.log("All Items:", allItems);

      // 🔹 Collect metadata keys for table headers (excluding hidden)
      const metaKeys = new Set<string>();
      allItems.forEach((item) =>
        Object.keys(item.metadata || {}).forEach((key) => {
          if (!HIDDEN_COLUMNS.includes(key)) metaKeys.add(key);
        })
      );
      setColumns(Array.from(metaKeys));
      console.log("Columns:", Array.from(metaKeys));

      // 🔹 Collect all available metadata for dropdowns
      const allMeta = allCollections.flatMap((c) => c.availableMetadata || []);
      setAvailableMetadata(Array.from(new Set(allMeta)));

      // 🔹 Pagination setup - use totalItems for correct pagination
      const totalItems = data.totalItems || allItems.length;
      console.log("📊 Total items for pagination:", totalItems, "Items per page:", itemsPerPage);
      setTotalPages(Math.ceil(totalItems / itemsPerPage));
    } catch (error: any) {
      console.error('Error fetching report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch report data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(0);
  }, []);

  // ✅ Pagination
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    fetchReport(
      newPage - 1,
      selectedCollection,
      selectedMetadata,
      metadataValue,
      startDate,
      endDate
    );
  };

  // ✅ Collection change
  const handleCollectionChange = (e: any) => {
    const value = e.target.value;
    setSelectedCollection(value);
    setSelectedMetadata('');
    setMetadataValue('');
    setStartDate('');
    setEndDate('');
    fetchReport(0, value);
  };

  // ✅ Metadata key change
  const handleMetadataChange = (e: any) => {
    const value = e.target.value;
    setSelectedMetadata(value);
    setMetadataValue('');
    setStartDate('');
    setEndDate('');
  };

 
  const handleMetadataValueChange = (e: any) => {
    const value = e.target.value;
    setMetadataValue(value);
    fetchReport(0, selectedCollection, selectedMetadata, value);
  };


  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchReport(0, selectedCollection, selectedMetadata, '', start, end);
  };


  const getMetadataValue = (metadata: Metadata, field: string): string =>
    metadata?.[field]?.[0] || 'N/A';

 
  const downloadCSV = () => {
    setCsvLoading(true);
    try {
      const headers = columns.filter((col) => !HIDDEN_COLUMNS.includes(col));
      const rows = items.map((item) => {
        const metadata = item.metadata || {};
        return headers.map((col) => getMetadataValue(metadata, col));
      });

      const escapeCsvField = (field: string) =>
        field.includes('"') || field.includes(',') || field.includes('\n')
          ? `"${field.replace(/"/g, '""')}"` : field;

      const csvContent = [
        headers.map(escapeCsvField).join(','),
        ...rows.map((row) => row.map(escapeCsvField).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'item_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setCsvLoading(false);
    }
  };
const COLUMN_LABELS: Record<string, string> = {
  'dc.date.created': 'Date of Admission',
  // You can add more custom labels here later if needed
  // e.g. 'dc.title': 'Document Title',
};

  return (
<Container className="top_padding">
  {/* 🔹 Header */}
  <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
    <Typography variant="h4">Item Report</Typography>
    <Button
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={downloadCSV}
      disabled={csvLoading}
    >
      {csvLoading ? <Loader /> : "Download CSV"}
    </Button>
  </Grid>

  {/* 🔹 Error Display */}
  {error && (
    <Grid container sx={{ mb: 2 }}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#ffebee', borderLeft: '4px solid #d32f2f' }}>
          <Typography color="error">
            <strong>Error:</strong> {error}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )}

  {/* 🔹 Filters */}
  <Grid container spacing={2} sx={{ mb: 3 }}>
    {/* Collection Dropdown */}
    <Grid item xs={12} sm={6} md={4}>
      <FormControl
        fullWidth
        variant="outlined"
        sx={{
          height: "34px",
          "& .MuiInputBase-root": {
            height: "34px",
          },
          "& .MuiInputLabel-root": {
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "white",
            px: 0.5,
            ml: 0.5,
            fontSize: "0.85rem",
            transition: "all 0.2s ease-in-out",
          },
          "& .MuiInputLabel-shrink": {
            top: 0,
            transform: "translate(14px, -6px) scale(0.85)",
            backgroundColor: "white",
          },
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#ccc",
              transition: "border-color 0.3s, border-width 0.3s",
            },
            "&:hover fieldset": {
              borderColor: "#888",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#3f51b5",
              borderWidth: "2px",
            },
          },
          "& legend": { width: 0 },
        }}
      >
        <InputLabel>Select Collection</InputLabel>
        <Select
          value={selectedCollection}
          onChange={handleCollectionChange}
          label="Select Collection"
        >
          <MenuItem value="">All Collections</MenuItem>
          {collections.map((col) => (
            <MenuItem key={col.collectionId} value={col.collectionId}>
              {col.collectionName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    {/* Metadata Dropdown */}
    <Grid item xs={12} sm={6} md={4}>
      <FormControl
        fullWidth
        disabled={!availableMetadata.length}
        variant="outlined"
        sx={{
          height: "34px",
          "& .MuiInputBase-root": {
            height: "34px",
          },
          "& .MuiInputLabel-root": {
            top: "50%",
            transform: "translate(14px, -50%)",
            backgroundColor: "white",
            px: 0.5,
            ml: 0.5,
            fontSize: "0.85rem",
            transition: "all 0.2s ease-in-out",
          },
          "& .MuiInputLabel-shrink": {
            top: 0,
            transform: "translate(14px, -6px) scale(0.85)",
          },
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#ccc",
              transition: "border-color 0.3s, border-width 0.3s",
            },
            "&:hover fieldset": {
              borderColor: "#888",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#3f51b5",
              borderWidth: "2px",
            },
          },
          "& legend": { width: 0 },
        }}
      >
        <InputLabel id="metadata-label">Select Metadata</InputLabel>
        <Select
          labelId="metadata-label"
          value={selectedMetadata}
          onChange={handleMetadataChange}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 250 },
            },
          }}
        >
          <MenuItem value="">All Metadata</MenuItem>
          {availableMetadata
            .filter((meta) => !HIDDEN_COLUMNS.includes(meta))
            .map((meta) => (
              <MenuItem key={meta} value={meta}>
                {meta}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Grid>

    {/* Metadata Value / Date Range Input */}
    {selectedMetadata && (
      <Grid item xs={12} sm={12} md={4}>
        {isDateField(selectedMetadata) ? (
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  height: "34px",
                  "& .MuiInputBase-root": { height: "34px" },
                  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  height: "34px",
                  "& .MuiInputBase-root": { height: "34px" },
                  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <TextField
            label="Enter Metadata Value"
            value={metadataValue}
            onChange={handleMetadataValueChange}
            fullWidth
            sx={{
              height: "34px",
              "& .MuiInputBase-root": { height: "34px" },
              "& .MuiInputLabel-root": { fontSize: "0.85rem" },
            }}
          />
        )}
      </Grid>
    )}
  </Grid>

  {/* 🔹 Table */}
  {loading ? (
    <CircularProgress sx={{ display: "block", margin: "auto", my: 3 }} />
  ) : (
    <>
      <TableContainer
        component={Paper}
        sx={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflowX: "auto",
          maxWidth: "100%",
        }}
      >
        <Table
          sx={{
            minWidth: 650,
            "@media (max-width: 768px)": { minWidth: 600 },
            "@media (max-width: 480px)": { minWidth: 500 },
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {columns
                .filter((col) => !HIDDEN_COLUMNS.includes(col))
                .map((col) => (
                  <TableCell key={col}>
                    <strong>
                      {COLUMN_LABELS[col] || col.replace(/^dc\./, "")}
                    </strong>
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <TableRow
                  key={item.itemId}
                  sx={{
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  {columns
                    .filter((col) => !HIDDEN_COLUMNS.includes(col))
                    .map((col) => (
                      <TableCell
                        key={`${item.itemId}-${col}`}
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 200,
                        }}
                      >
                        {getMetadataValue(item.metadata, col)}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        count={totalPages}
        page={page}
        onChange={handleChangePage}
        sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 3 }}
      />
    </>
  )}
</Container>
  );
};

export default ItemReportTable;
