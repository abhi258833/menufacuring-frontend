import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { getResourcePolicies, removeResourcePolicy } from '../../api/workflow'
import { useEffect, useState } from 'react'
import { iconsImgs } from '../../utils/images'
import { Policy } from '../../data/workflowdata'



const Policies = () => {
    const { id } = useParams<{ id: string }>()
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allSelected, setAllSelected] = useState(false);
    const navigate = useNavigate()


    const fetchResourcePolicy = async () => {
        if (!id) return;
        const response = await getResourcePolicies(id);
        if (response?._embedded?.resourcepolicies) {
            setPolicies(response._embedded.resourcepolicies);
        }
        else if (Array.isArray(response)) {
            setPolicies(response);
        }
    }

    useEffect(() => {
        fetchResourcePolicy();
    }, [id]);

    const handleSelectPolicy = (policyId: string) => {
        setSelectedPolicies(prev =>
            prev.includes(policyId)
                ? prev.filter(id => id !== policyId)
                : [...prev, policyId]
        );
    };

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedPolicies([]);
        } else {
            setSelectedPolicies(policies.map(policy => policy.id));
        }
        setAllSelected(!allSelected);
    };

    const handleDeleteClick = () => {
        if (selectedPolicies.length > 0) {
            setDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await Promise.all(selectedPolicies.map(id => removeResourcePolicy(id)));
            await fetchResourcePolicy();
            setSelectedPolicies([]);
            setAllSelected(false);
            setDeleteModalOpen(false);
        } catch (error) {
            console.error("Error deleting policies:", error);
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
    };

    const handleAddresourcePage = () => {
        navigate(`/createPolicies/${id}`)
    }

    const handleEditPolicy = (policyId: string) => {
        navigate(`/createPolicies/${id}?edit=${policyId}`);
    };

    const handleAssignRole = () => {
        if (id) {
            navigate(`/assignRole/${id}`)
        }
    }

    return (
        <Container className='policy_main_div'>
            <TableContainer>
                <Box sx={{ display: "flex", justifyContent: "end", mb: 2, gap: 2,mt: 2 }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        disabled={selectedPolicies.length === 0}
                        onClick={handleDeleteClick}
                    >
                        <img className="itemh_icon" src={iconsImgs.remove} alt="Delete" /> Delete selected
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAssignRole}
                        color="info"
                    >
                        Assign Role
                    </Button>
                    <Button variant="contained"
                        onClick={() => handleAddresourcePage()}
                        color="success">
                        <img className="itemh_icon" src={iconsImgs.plus} alt="Add" /> Add
                    </Button>
                </Box>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell><b>ID</b></TableCell>
                            {/* <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Type</b></TableCell> */}
                            <TableCell><b>Action</b></TableCell>
                            {/* <TableCell><b>EPerson</b></TableCell> */}
                            <TableCell><b>Group</b></TableCell>
                            <TableCell><b>Edit</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {policies.map((policy) => {
                            const eperson = policy._embedded.eperson?.metadata['eperson.firstname']?.[0]?.value + " " +
                                policy._embedded.eperson?.metadata['eperson.lastname']?.[0]?.value;
                            const group = policy._embedded.group?.name;

                            return (
                                <TableRow key={policy.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedPolicies.includes(policy.id)}
                                            onChange={() => handleSelectPolicy(policy.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{policy.id || "N/A"}</TableCell>
                                    <TableCell>{policy.action || "N/A"}</TableCell>
                                    <TableCell>{group}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => handleEditPolicy(policy.id)}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog
                open={deleteModalOpen}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {selectedPolicies.length} selected policy?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}

export default Policies