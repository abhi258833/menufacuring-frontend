import { TextField, Button, Box, Typography, Paper, Modal, IconButton, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from "react-toastify";
import { useState, useEffect } from 'react';
import { createSubCommunity, fetchCommunities } from '../../api/communities';
import Loader from "../loader/loader";

interface SubCommunityProps {
    open: boolean;
    handleClose: () => void;
    parentCommunityId: string | null;
    onSubCommunityCreated?: () => void;
}

interface Community {
    uuid: string;
    metadata: {
        "dc.title": Array<{ value: string }>;
    };
}

interface CommunitiesResponse {
    _embedded?: {
        communities: Community[];
    };
}

const SubCommunity = ({ open, handleClose, parentCommunityId, onSubCommunityCreated }: SubCommunityProps) => {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedParent, setSelectedParent] = useState<string>('');

    useEffect(() => {
        if (open) {
            fetchCommunitiesList();
            if (parentCommunityId) {
                setSelectedParent(parentCommunityId);
            }
        }
    }, [open, parentCommunityId]);

    const fetchCommunitiesList = async () => {
        try {
            const response = await fetchCommunities() as CommunitiesResponse;
            const communityList = response?._embedded?.communities || [];
            setCommunities(Array.isArray(communityList) ? communityList : []);
        } catch (error) {
            console.error('Error fetching communities:', error);
            setCommunities([]);
        }
    };

    const isFormValid = title.trim() !== "" && selectedParent !== "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);
            await createSubCommunity(selectedParent, title, description);
            setTitle('');
            setDescription('');
            setSelectedParent('');
            toast.success("Sub-community created successfully!");
            handleClose();
            onSubCommunityCreated?.();
        } catch (error) {
            console.error('Error creating sub-community:', error);
            toast.error("Failed to create sub-community");
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setTitle('');
        setDescription('');
        setSelectedParent('');
        handleClose();
    };

    return (
        <Modal open={open} onClose={handleModalClose}>
            <Box
                component={Paper}
                elevation={3}
                sx={{
                    p: 4,
                    maxWidth: 550,
                    mx: "auto",
                    mt: 8,
                    borderRadius: 4,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    backgroundColor: "#f9f9f9",
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            >
                <ToastContainer />

                {/* Close Icon Button */}
                <IconButton
                    onClick={handleModalClose}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        color: (theme) => theme.palette.grey[500]
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
                    <Typography variant="h5" fontWeight="bold" color="secondary">
                        Create a Sub-Community
                    </Typography>
                </Box>

                {loading && <Loader />}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Select Parent Community *</InputLabel>
                        <Select
                            value={selectedParent}
                            label="Select Parent Community *"
                            onChange={(e) => setSelectedParent(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>Choose a community...</em>
                            </MenuItem>
                            {communities.map((community) => (
                                <MenuItem key={community.uuid} value={community.uuid}>
                                    {community.metadata["dc.title"]?.[0]?.value || 'Untitled'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Sub-Community Name"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="Enter sub-community name"
                        sx={{
                            mb: 3,
                            "& .MuiOutlinedInput-root": { borderRadius: 2 },
                        }}
                    />
                    <TextField
                        label="Description (Optional)"
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={4}
                        placeholder="Enter sub-community description"
                        sx={{
                            mb: 3,
                            "& .MuiOutlinedInput-root": { borderRadius: 2 },
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={!isFormValid || loading}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: "bold",
                            textTransform: "none",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                            transition: "all 0.3s ease",
                            "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
                        }}
                    >
                        Create Sub-Community
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default SubCommunity;
