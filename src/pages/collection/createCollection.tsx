import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Modal,
  IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer } from "react-toastify";
import { useState } from 'react';
import { showToast } from "../../contexts/ToastProvider";
import { AddCollection } from "../../api/collection";
import Loader from "../loader/loader";

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  communityId: string;
  titleText: string;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  open,
  onClose,
  communityId,
  titleText,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormValid = title.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    try {
      setLoading(true);
      await AddCollection(communityId, title, description);
      setTitle('');
      setDescription('');
      showToast("Collection created successfully!", "success");
      onClose(); 
    } catch (error) {
      showToast("Error creating collection", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          p: 4,
          maxWidth: 600,
          width: '90%',
          borderRadius: 4,
          backgroundColor: "#fdfdfd",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ToastContainer />

        {/* Close Button */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: (theme) => theme.palette.grey[600],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" fontWeight="bold" color="secondary">
            {`Create a Collection for Community ${titleText}`}
          </Typography>
        </Box>

        {loading && <Loader />}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#fff",
              },
            }}
          />
          <TextField
            label="Description"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            multiline
            rows={4}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#fff",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            disabled={!isFormValid}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              transition: "all 0.3s ease",
              boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
              "&:hover": {
                boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
                backgroundColor: "primary.dark",
              },
            }}
          >
            Submit
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default CreateCollectionModal;