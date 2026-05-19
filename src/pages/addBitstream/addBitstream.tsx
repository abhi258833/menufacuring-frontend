import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; 
import { useNavigate } from "react-router-dom";
import { showToast } from "../../contexts/ToastProvider";
import { useParams } from "react-router-dom";
import { fetchItemBundles, postBitstream } from "../../api/bitstream";

interface Bundle {
  uuid: string;
  name: string;
}

const AddBitstream: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string>("");
  const navigate = useNavigate();
    const { itemId } = useParams<{ itemId: string }>(); 



  useEffect(() => {
    const fetchBundlesData = async () => {
      if (!itemId) {
        showToast("Item ID is not available.", "error");
        return;
      }
      setIsLoading(true);
      try {
        const result = await fetchItemBundles(itemId);
        setBundles(result || []); 
      } catch (error) {
        console.error("Error fetching bundles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundlesData();
  }, [itemId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleBundleChange = (event: SelectChangeEvent<string>) => {
    setSelectedBundle(event.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedBundle) {
      showToast("Please select a bundle and a file.", "error");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await postBitstream(selectedBundle, selectedFile);
      showToast("Bitstream uploaded successfully!", "success");
      navigate(`/edit-item/${itemId}`); 
    } catch (error) {
      showToast("Upload failed. Please try again.", "error");
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 600, margin: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Upload bitstream
      </Typography>
      <Typography variant="body1" gutterBottom>
        Item: Gut microbiota mediates intermittent-fasting alleviation of diabetes-induced cognitive impairment.
      </Typography>

      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel>Bundle</InputLabel>
        <Select 
          value={selectedBundle} 
          onChange={handleBundleChange}
          label="Bundle"
          disabled={bundles.length === 0}
        >
          {bundles.map((bundle) => (
            <MenuItem 
              key={bundle.uuid} 
              value={bundle.uuid}
            >
              {bundle.name} 
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <input 
        type="file" 
        accept=".pdf,.zip,.jpg,.png,.txt"
        style={{ display: "none" }} 
        id="file-upload" 
        onChange={handleFileChange} 
      />
     <label htmlFor="file-upload" className="b_import_label">
        <Box 
		 className="upload-container" 
          sx={{
            border: "2px dashed gray",
            padding: 3,
            textAlign: "center",
            marginTop: 2,
            cursor: "pointer",
            backgroundColor: "#f9f9f9",
          }}
        >
          <Typography variant="body2" className="upload-text">
           <span className="upload-icon">☁️</span> Upload a ZIP File
          </Typography>
          <Typography variant="caption" color="gray">
            {selectedFile ? selectedFile.name : "Drag and drop files here"}
          </Typography>
		 
        </Box>
</label>

      <Box display="flex" justifyContent="space-between" alignItems="center" marginTop={3}>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => navigate(-1)}
          disabled={isLoading}
        >
          Back
        </Button>

        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Button
            variant="contained"
            color="primary"
            disabled={!selectedFile || !selectedBundle || isLoading}
            onClick={handleSubmit}
          >
            Proceed
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default AddBitstream;
