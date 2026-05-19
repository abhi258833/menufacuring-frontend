import React, { useEffect, useState } from "react";
import {
    Container,
    Grid,
    TextField,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    CircularProgress,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { deleteGroup, fetchGroups, Group } from "../../api/group";
import AddGroup from "./AddGroup";
import { useNavigate } from "react-router-dom";
import { iconsImgs } from "../../utils/images";
import { showToast } from "../../contexts/ToastProvider";

const Groups = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [openAddGroup, setOpenAddGroup] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const pageSize = 10;
    const navigate = useNavigate();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [groupId, setGroupId] = useState<string>('');

    const loadGroups = async (page: number, query: string) => {
        setLoading(true);
        try {
            const data = await fetchGroups(page - 1, pageSize, query);
            setGroups(data.groups);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching groups:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups(page, searchQuery);
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        loadGroups(1, searchQuery);
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
        setPage(newPage);
    };

    const handleEditClick = (group: Group) => {
        navigate("/edit-group", {
            state: {
                id: group.id,
                name: group._embedded?.object?.name || group.name,
                description: group.metadata?.["dc.description"]?.[0]?.value || "",
            },
        });
    };

    const handleDeleteClick = (group: Group) => {
        setDeleteModalOpen(true);
        setGroupId(group.id);
    }

    const handleCancelDelete = () =>{
        setDeleteModalOpen(false);
    }

    const handleConfirmDelete = async () =>{
        await deleteGroup(groupId);
        setGroups(groups.filter(group => group.id !== groupId));
        setDeleteModalOpen(false);
        navigate("/groups");
    }

    return (
        <Container className="top_padding">
            <Grid container justifyContent="space-between" alignItems="center" className="header_groups header_epeople">
                <Typography variant="h4" sx={{ mb: 1 }}>
                    Groups
                </Typography>
                <Button variant="contained" color="success" onClick={() => setOpenAddGroup(true)}>
                    + Add Group
                </Button>
            </Grid>

            <Grid container alignItems="center" className="search-container">
                <Grid item xs={8.5} sm={10.5}  lg={11} >
                    <TextField
                        label="Search Groups..."
                        variant="outlined"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-field"
                        InputLabelProps={{ className: "custom-label" }}

                    />
                </Grid>

                <Grid item>
                    <Button className="button_search" variant="contained" color="primary" onClick={handleSearch}>
                        Search
                    </Button>
                </Grid>
            </Grid>

            {loading ? (
                <CircularProgress sx={{ display: "block", margin: "auto", my: 3 }} />
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell><b>Group Name</b></TableCell>
                                    <TableCell><b>Description</b></TableCell>
                                    <TableCell><b>Actions</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {groups.map((group) => (
                                    <TableRow key={group.id}
                                        sx={{
                                            "&:hover": { backgroundColor: "#f0f0f0" },
                                            cursor: "pointer",
                                        }}>
                                        <TableCell>{group.name || "N/A"}</TableCell>
                                        <TableCell>{group.metadata?.["dc.description"]?.[0]?.value || "N/A"}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" className="btn_table" onClick={() => handleEditClick(group)} title="Edit">
                                                <img className="table_icon" src={iconsImgs.edit} alt="Edit" />
                                            </IconButton>
                                            <IconButton color="primary" className="btn_table" onClick={() => handleDeleteClick(group)} title="Edit">
                                                <img className="table_icon" src={iconsImgs.remove} alt="Edit" />
                                            </IconButton>

                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Pagination count={totalPages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 2, mb:2 }} />
                </>
            )}

            <AddGroup
                open={openAddGroup}
                onClose={() => setOpenAddGroup(false)}
                onGroupAdded={() => loadGroups(page, searchQuery)}
            />
            <Dialog
                open={deleteModalOpen}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the group {" "}
                        <strong>{groups.find(group => group.id === groupId)?.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Groups;