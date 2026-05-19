import { Box, Container, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Pagination } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { actionType, Policies, policies } from '../../data/workflowdata';
import { EPerson, userList } from '../../api/usermanagement';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AddResourcePolicyForGroup, getResourcePolicies, updateResourcePolicyGroup, updateResourcePolicyMetadata } from '../../api/workflow';
import { fetchGroups, Group } from '../../api/group';

interface ResourcePolicyData {
    policyType: string;
    action: string;
    type: {
        value: string;
    };
}

const CreatePolicy = () => {
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [size] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const policyId = queryParams.get('edit');  
    
    const [formData, setFormData] = useState<ResourcePolicyData>({
        policyType: "",
        action: "",
        type: { value: "resourcepolicy" }
    });

    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [originalPolicyData, setOriginalPolicyData] = useState<ResourcePolicyData | null>(null);
    const [originalGroup, setOriginalGroup] = useState<string>("");
    const [selectedGroupName, setSelectedGroupName] = useState<string>("");


    useEffect(() => {
        setFormData({
            policyType: "",
            action: "",
            type: { value: "resourcepolicy" }
        });
        setSelectedGroup("");
        setOriginalPolicyData(null);
        setOriginalGroup("");
    
        if (policyId && uuid) {
            setIsEditMode(true);
            fetchPolicyData(uuid); 
        } else {
            setIsEditMode(false);
        }
    }, [policyId, uuid]);

    const fetchPolicyData = async (resourceUuid: string) => {
        try {
            const response = await getResourcePolicies(resourceUuid);
            const policies = response?._embedded?.resourcepolicies || [];
            
            // Find the policy that matches the policyId from URL
            const policy = policies.find(p => p.id.toString() === policyId);
            
            if (policy) {
                const policyData = {
                    policyType: policy.policyType || "",
                    action: policy.action,
                    type: { value: "resourcepolicy" }
                };
                
                setFormData(policyData);
                setOriginalPolicyData(policyData);
                
                if (policy._embedded?.group) {
                    setSelectedGroup(policy._embedded.group.uuid);
                    setSelectedGroupName(policy._embedded.group.name);
                    setOriginalGroup(policy._embedded.group.uuid);
                }
            } else {
                console.error("Policy not found with ID:", policyId);
            }
        } catch (error) {
            console.error("Error fetching policy data:", error);
        }
    };

    const fetchUsers = async (page: number, size: number, query: string) => {
        setLoading(true);
        try {
            const data = await fetchGroups(page - 1, size, query);
            setGroups(data.groups);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(page, size, searchQuery);
    }, [page, size]);

    const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
        setPage(newPage);
    };


    const handleSelectChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectGroup = (groupId: string, groupName: string) => {
        setSelectedGroup(groupId);
        setSelectedGroupName(groupName);
    };

    const handleSubmit = async () => {
        if (!uuid || !selectedGroup) {
            alert("Please select a resource and a Group");
            return;
        }
    
        try {
            if (isEditMode && policyId) {
                const needsGroupUpdate = selectedGroup !== originalGroup;
                const needsMetadataUpdate = 
                    formData.action !== originalPolicyData?.action ||
                    formData.policyType !== originalPolicyData?.policyType;

                if (needsGroupUpdate && needsMetadataUpdate) {
                    await updateResourcePolicyGroup(policyId, selectedGroup);
                    await updateResourcePolicyMetadata(policyId, formData);
                } else if (needsGroupUpdate) {
                    await updateResourcePolicyGroup(policyId, selectedGroup);
                } else if (needsMetadataUpdate) {
                    await updateResourcePolicyMetadata(policyId, formData);
                }
            } else {
                await AddResourcePolicyForGroup(uuid, selectedGroup, JSON.stringify(formData));
            }
            navigate(-1);
        } catch (error) {
            console.error("Error saving resource policy:", error);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} resource policy`);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,mt: 2,mb: 2 }}>
            <Typography variant="h4" className='header_epeople' sx={{ mb: 2 }}>
                {isEditMode ? "Edit Resource Policy" : "Create New Resource Policy"}
            </Typography>
            
            {/* <Box>
                <FormControl fullWidth>
                    <Select
                        labelId='policy-type'
                        name="policyType"
                        value={formData.policyType}
                        displayEmpty
                        renderValue={(value) => (value ? value : 'Select the policy type *')}
                        onChange={handleSelectChange}
                    >
                        {policies && policies.map((policy) => (
                            <MenuItem key={policy.id} value={policy.id}>{policy.value}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box> */}
            
            <Box>
                <FormControl fullWidth>
                    <Select
                        labelId='action-type'
                        name="action"
                        value={formData.action}
                        displayEmpty
                        renderValue={(value) => (value ? value : 'Select the action *')}
                        onChange={handleSelectChange}
                    >
                        {actionType && actionType.map((action) => (
                            <MenuItem key={action.id} value={action.id}>{action.value}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            
            <Grid item xs={8.5} sm={10.5} lg={11}>
                <TextField
                    label="The group that will be granted the permission"
                    variant="outlined"
                    fullWidth
                    value={selectedGroupName}
                    InputProps={{
                        readOnly: true,
                    }}
                />
            </Grid>
            
            <TableContainer
                component={Paper}
                sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", mt: 2 }}
            >
                <Grid container alignItems="center" className="search-container" sx={{ p: 2 }}>
                    <Grid item xs={8.5} sm={10} md={11}>
                        <TextField
                            label="Search The groups...."
                            variant="outlined"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-field"
                            InputLabelProps={{ className: "custom-label" }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    fetchUsers(1, size, searchQuery);
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={2} sm={2} md={1} style={{ paddingLeft: 0 }}>
                        <Button
                            className="button_search"
                            variant="contained"
                            onClick={() => fetchUsers(1, size, searchQuery)}
                            disabled={loading}
                            fullWidth
                        >
                            Search
                        </Button>
                    </Grid>
                </Grid>
                
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><b>ID</b></TableCell>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {groups.map((group) => (
                            <TableRow
                                key={group.id}
                                sx={{
                                    "&:hover": { backgroundColor: "#f0f0f0" },
                                    cursor: "pointer",
                                    backgroundColor: selectedGroup === group.id ? "#e0e0e0" : "inherit"
                                }}
                            >
                                <TableCell>{group.id}</TableCell>
                                <TableCell>{group.name}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleSelectGroup(group.id, group.name)}
                                    >
                                        {selectedGroup === group.id ? "Selected" : "Select"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={ !formData.action || !selectedGroup}
                >
                    {isEditMode ? "Update" : "Save"}
                </Button>
            </Box>
            <Pagination
                count={totalPages}
                page={page}
                onChange={handleChangePage}
                sx={{ display: "flex", justifyContent: "center", mt: 1,mb: 1 }}
            />
        </Container>
    );
};

export default CreatePolicy;