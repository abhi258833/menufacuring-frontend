import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Divider,
  Link,
  TextField,
  Container,
  Stack,
} from "@mui/material";
import {
  deleteProcess,
  downloadFile,
  getProcessDetail,
  getProcessOutput,
  ProcessDetailData,
  ProcessFile,
} from "../../api/processes";
import { showToast } from "../../contexts/ToastProvider";
import { deleteItem } from "../../api/item";

const ProcessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<ProcessDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [output, setOutput] = useState<string>(""); 
  const [loadingOutput, setLoadingOutput] = useState<boolean>(false);

  const fetchProcessDetail = async () => {
    try {
      setLoading(true);
      if (id) {
        const data = await getProcessDetail(id);
        setProcess(data);
      }
    } catch (error) {
      console.error("Error fetching process detail:", error);
      showToast("Failed to load process details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessOutput = async () => {
    try {
      if (!id) return;
      setLoadingOutput(true);
      const logData = await getProcessOutput(id);
      setOutput(logData);
    } catch (error) {
      console.error("Error fetching process output:", error);
      showToast("Failed to load process output", "error");
    } finally {
      setLoadingOutput(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (id) {
        await deleteProcess(id);
        navigate("/processes");
      }
    } catch (error) {
      showToast("Failed to delete process", "error");
    }
  };
  const handleDeleteWithItems = async () => {
  if (!id) return;

  try {
    // 1. Fetch output log if not already loaded
    let logData = output;
    if (!logData) {
      logData = await getProcessOutput(id);
      setOutput(logData);
    }

    // 2. Extract UUIDs from log (they look like "1 uuid")
    const uuidRegex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g;
    const uuids = logData.match(uuidRegex) || [];

    if (uuids.length === 0) {
      showToast("No item UUIDs found in process output", "warning");
      return;
    }

    // 3. Delete each item sequentially
    for (const uuid of uuids) {
      await deleteItem(uuid);
    }

    // 4. Delete process after items
    await deleteProcess(id);
    showToast("Process and all items deleted successfully", "success");
    navigate("/processes");
  } catch (error) {
    console.error("Error deleting process with items:", error);
    showToast("Failed to delete process with items", "error");
  }
};


  useEffect(() => {
    fetchProcessDetail();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!process) {
    return (
      <Typography color="error" align="center" mt={5}>
        Process not found
      </Typography>
    );
  }

  const files: ProcessFile[] = process._embedded?.files?._embedded?.files ?? [];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Process: {process.processId} — {process.scriptName}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Process Info */}
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography><strong>User:</strong> {process.userId}</Typography>
        <Typography><strong>Status:</strong> {process.processStatus}</Typography>
        <Typography><strong>Start time:</strong> {process.startTime || "-"}</Typography>
        <Typography><strong>Finish time:</strong> {process.endTime || "-"}</Typography>
        <Typography><strong>Created at:</strong> {process.creationTime || "-"}</Typography>
      </Stack>

      {/* Parameters */}
      {process.parameters?.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6">Parameters</Typography>
          <ul>
            {process.parameters.map((param, index) => (
              <li key={index}>
                {param.name} {param.value ? `= ${param.value}` : ""}
              </li>
            ))}
          </ul>
        </Box>
      )}

      {/* Files */}
      {/* Files */}
{files.length > 0 && (
  <Box mb={3}>
    <Typography variant="h6">Files</Typography>
    <ul>
      {files.map((file) => (
        <li key={file.uuid}>
          <Button
            variant="text"
            onClick={() => downloadFile(file)}
          >
            {file.name} ({(file.sizeBytes / 1024).toFixed(2)} KB)
          </Button>
        </li>
      ))}
    </ul>
  </Box>
)}


      {/* Process Output */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>Process Output</Typography>
        <Button
          variant="contained"
          onClick={fetchProcessOutput}
          disabled={loadingOutput}
        >
          {loadingOutput ? "Loading..." : "Retrieve Output"}
        </Button>

        {output && (
          <Paper
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "#121212",
              color: "#00ff90",
              fontFamily: "monospace",
              maxHeight: "70vh",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {output}
          </Paper>
        )}
      </Box>

      {/* Actions */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button variant="contained" color="error" onClick={handleDelete}>Delete process</Button>
        <Button variant="outlined" onClick={() => navigate("/processes")}>Back</Button>
      </Stack>
    </Container>
  );
};

export default ProcessDetail;
