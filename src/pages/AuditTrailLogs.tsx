import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Pagination,
  Card,
  CardContent,
  Box,
  Chip,
  Typography,
  alpha,
} from "@mui/material";
import axios from "axios";
import { useTheme } from "@mui/material/styles";

interface AuditDTO {
  id: string;
  userId: string | null;
  userEmail: string | null;
  operation: string | null;
  entityName: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  ipAddress: string | null;
}

const pageSize = 10;

const AuditTrailLogs: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<AuditDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeColumns, setActiveColumns] = useState<Set<string>>(new Set());

  
  const [userInput, setUserInput] = useState<string>(""); 
  const [entityName, setEntityName] = useState<string>("");
  const [operation, setOperation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const token = localStorage.getItem("authToken");

  // Determine which columns have data
  const updateActiveColumns = (data: AuditDTO[]) => {
    const columns = new Set<string>();
    const fieldKeys: (keyof AuditDTO)[] = [
      "userEmail",
      "userId",
      "operation",
      "entityName",
      "entityId",
      "oldValue",
      "newValue",
      "timestamp",
      "ipAddress",
    ];

    data.forEach((log) => {
      fieldKeys.forEach((key) => {
        if (log[key] !== null && log[key] !== undefined && log[key] !== "") {
          columns.add(key);
        }
      });
    });

    // Always include user info, operation, entity, timestamp
    columns.add("userEmail");
    columns.add("operation");
    columns.add("timestamp");
    setActiveColumns(columns);
  };

  const loadLogs = async (
    page: number,
    userInput?: string,
    entityName?: string,
    operation?: string,
    startDate?: string,
    endDate?: string
  ) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        entityName: entityName || undefined,
        operation: operation || undefined,
        from: startDate ? `${startDate}T00:00:00Z` : undefined,
        to: endDate ? `${endDate}T23:59:59Z` : undefined,
        page: page - 1,
        size: pageSize,
      };

      if (userInput) {
        if (userInput.includes("@")) {
          params.userEmail = userInput;
        } else {
          params.userId = userInput;
        }
      }

      const res = await axios.get<{ content: AuditDTO[]; totalPages: number }>(
        "http://localhost:8080/server/api/audits",
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLogs(res.data.content);
      updateActiveColumns(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page, userInput, entityName, operation, startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadLogs(1, userInput, entityName, operation, startDate, endDate);
  };

  const handleExportExcel = async () => {
    try {
      const params: Record<string, any> = {
        entityName: entityName || undefined,
        operation: operation || undefined,
        from: startDate ? `${startDate}T00:00:00Z` : undefined,
        to: endDate ? `${endDate}T23:59:59Z` : undefined,
      };

      if (userInput) {
        if (userInput.includes("@")) {
          params.userEmail = userInput;
        } else {
          params.userId = userInput;
        }
      }

      const res = await axios.get<Blob>(
        "http://localhost:8080/server/api/audits/exportExcel",
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audit-log.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  return (
    <Container maxWidth="xl" className="top_padding" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            mb: 1,
            letterSpacing: "-0.5px",
          }}
        >
          Audit Trail Logs
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Monitor system activities and track all changes made in the repository
        </Typography>
      </Box>

      {/* Filter Card */}
      <Card
        sx={{
          mb: 4,
          boxShadow: "0 2px 8px " + alpha(theme.palette.primary.main, 0.08),
          border: "1px solid " + alpha(theme.palette.divider, 0.5),
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: "16px",
              color: theme.palette.text.primary,
            }}
          >
            Filter Records
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="User ID / Email"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                size="small"
                variant="outlined"
                placeholder="user@example.com"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Entity Name"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                label="Operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFilter}
                  sx={{
                    fontWeight: 600,
                    textTransform: "none",
                    px: 3,
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleExportExcel}
                  sx={{
                    fontWeight: 600,
                    textTransform: "none",
                    px: 3,
                  }}
                >
                  Export to Excel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card
            sx={{
              boxShadow: "0 2px 8px " + alpha(theme.palette.primary.main, 0.08),
              border: "1px solid " + alpha(theme.palette.divider, 0.5),
              mb: 3,
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      "& th": {
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        py: 2,
                        borderBottom: "2px solid " + theme.palette.divider,
                      },
                    }}
                  >
                    {activeColumns.has("userEmail") && (
                      <TableCell>User / Email</TableCell>
                    )}
                    {activeColumns.has("userId") && (
                      <TableCell>User ID</TableCell>
                    )}
                    {activeColumns.has("operation") && (
                      <TableCell>Operation</TableCell>
                    )}
                    {activeColumns.has("entityName") && (
                      <TableCell>Entity</TableCell>
                    )}
                    {activeColumns.has("entityId") && (
                      <TableCell>Entity ID</TableCell>
                    )}
                    {activeColumns.has("oldValue") && (
                      <TableCell>Old Value</TableCell>
                    )}
                    {activeColumns.has("newValue") && (
                      <TableCell>New Value</TableCell>
                    )}
                    {activeColumns.has("timestamp") && (
                      <TableCell>Timestamp</TableCell>
                    )}
                    {activeColumns.has("ipAddress") && (
                      <TableCell>IP Address</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                        },
                        borderBottom: "1px solid " + alpha(theme.palette.divider, 0.5),
                        transition: "background-color 0.2s ease",
                        "&:last-child td": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      {activeColumns.has("userEmail") && (
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.15
                                ),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 1.5,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                              }}
                            >
                              {(log.userEmail || log.userId || "S")?.[0]
                                ?.toUpperCase()}
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {log.userEmail || log.userId || "System"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      )}
                      {activeColumns.has("userId") && log.userId && (
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            {log.userId}
                          </Typography>
                        </TableCell>
                      )}
                      {activeColumns.has("operation") && (
                        <TableCell>
                          <Chip
                            label={log.operation || "N/A"}
                            size="small"
                            sx={{
                              backgroundColor:
                                log.operation === "CREATE"
                                  ? alpha("#4caf50", 0.15)
                                  : log.operation === "UPDATE"
                                  ? alpha("#2196f3", 0.15)
                                  : log.operation === "DELETE"
                                  ? alpha("#f44336", 0.15)
                                  : alpha(theme.palette.primary.main, 0.15),
                              color:
                                log.operation === "CREATE"
                                  ? "#2e7d32"
                                  : log.operation === "UPDATE"
                                  ? "#1565c0"
                                  : log.operation === "DELETE"
                                  ? "#c62828"
                                  : theme.palette.primary.main,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      )}
                      {activeColumns.has("entityName") && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.entityName || "N/A"}
                          </Typography>
                        </TableCell>
                      )}
                      {activeColumns.has("entityId") && log.entityId && (
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: "monospace",
                              backgroundColor: alpha(
                                theme.palette.text.primary,
                                0.08
                              ),
                              px: 1,
                              py: 0.5,
                              borderRadius: "4px",
                              display: "inline-block",
                            }}
                          >
                            {log.entityId}
                          </Typography>
                        </TableCell>
                      )}
                      {activeColumns.has("oldValue") && log.oldValue && (
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#d32f2f",
                              fontFamily: "monospace",
                              fontSize: "12px",
                            }}
                          >
                            {log.oldValue}
                          </Typography>
                        </TableCell>
                      )}
                      {activeColumns.has("newValue") && log.newValue && (
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#388e3c",
                              fontFamily: "monospace",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            {log.newValue}
                          </Typography>
                        </TableCell>
                      )}
                      {activeColumns.has("timestamp") && (
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </Typography>
                        </TableCell>
                      )}
                      {activeColumns.has("ipAddress") && log.ipAddress && (
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: "monospace",
                              backgroundColor: alpha(
                                theme.palette.text.primary,
                                0.08
                              ),
                              px: 1,
                              py: 0.5,
                              borderRadius: "4px",
                              display: "inline-block",
                            }}
                          >
                            {log.ipAddress}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Pagination */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              shape="rounded"
              size="medium"
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default AuditTrailLogs;
