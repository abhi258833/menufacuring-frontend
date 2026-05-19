import { Box, Button, Container, Grid, TableContainer, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, Pagination, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { fetchGroups, Group } from '../../api/group';
import { useParams, useNavigate } from 'react-router-dom';
import { createSupervisionOrder } from '../../api/workflow';
import { showToast } from '../../contexts/ToastProvider';

const SupervisionSelecter = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [selectedType, setSelectedType] = useState<string>('EDITOR');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedGroupName, setSelectedGroupName] = useState<string>('');
    const pageSize = 10;
    const navigate = useNavigate();

    const loadGroups = async (page: number, query: string) => {
        setIsLoading(true);
        try {
            const data = await fetchGroups(page - 1, pageSize, query);
            setGroups(data.groups);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching groups:", error);
        } finally {
            setIsLoading(false);
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

    const handleSelectClick = (groupId: string, groupName: string) => {
        setSelectedGroup(groupId);
        setSelectedGroupName(groupName);
    };

    const handleTypeChange = (event: any) => {
        setSelectedType(event.target.value as string);
    };

    const handleSave = async () => {
        if (!uuid || !selectedGroup) {
            showToast('Please select a group first','warning');
            return;
        }
        try {
           
            await createSupervisionOrder(uuid, selectedGroup, selectedType);
            navigate('/workflowSearch');
        } catch (error) {
            console.error('Error creating supervision order:', error);
        }
    };

    const handleCancel = () => {
        setSelectedGroup('');
        setSelectedGroupName('');
    };

    return (
        <Container>
            <Typography variant='h4'>Supervision Group Selector</Typography>
            <FormControl fullWidth sx={{ marginBottom: 2, marginTop: 2 }}>
                <InputLabel id="type-select-label">Type of Order</InputLabel>
                <Select
                    labelId="type-select-label"
                    value={selectedType}
                    label="Type of Order"
                    onChange={handleTypeChange}
                >
                    <MenuItem value="EDITOR">EDITOR</MenuItem>
                    <MenuItem value="OBSERVER">OBSERVER</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel id="group-select-label">Selected Group</InputLabel>
                <Select
                    labelId="group-select-label"
                    value={selectedGroup}
                    label="Selected Group"
                    disabled
                >
                    {selectedGroup && (
                        <MenuItem value={selectedGroup}>
                            {selectedGroupName || selectedGroup}
                        </MenuItem>
                    )}
                </Select>
            </FormControl>
            <TableContainer>
                <Grid container alignItems="center" className="search-container">
                    <Grid item xs={8.5} sm={10.5} lg={11} >
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

                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><b>ID</b></TableCell>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Action</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {groups.map((group) => (
                            <TableRow key={group.id}
                                sx={{
                                    "&:hover": { backgroundColor: "#f0f0f0" },
                                    cursor: "pointer",
                                }}>
                                <TableCell>{group.id || "N/A"}</TableCell>
                                <TableCell>{group.name || "N/A"}</TableCell>
                                <TableCell>
                                    <Button 
                                        variant="contained" 
                                        color={selectedGroup === group.id ? "success" : "primary"}
                                        onClick={() => handleSelectClick(group.id, group.name)}
                                        title="Select"
                                    >
                                        {selectedGroup === group.id ? "Selected" : "Select"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box sx={{ display: "flex", justifyContent: "end", mt: 2, gap: 2 }}>
                    <Button 
                        variant="contained" 
                        color="secondary"
                        disabled={!selectedGroup}
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success"
                        disabled={!selectedGroup}
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </Box>
                <Pagination count={totalPages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }} />
            </TableContainer>
        </Container>
    )
}

export default SupervisionSelecter