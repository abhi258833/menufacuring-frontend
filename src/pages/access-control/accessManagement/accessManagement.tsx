import React, { useEffect, useState } from "react";
import "../addUser/addUser.css";
import {
    fetchCollections,
    fetchCommunities,
    fetchGroupsList,
    fetchUserGroupsList,
} from "../../../api/accessManagement";
import {
    Box,
    IconButton,
    Modal,
    Paper,
    Typography,
    FormControlLabel,
    Checkbox,
    FormControl,
    RadioGroup,
    Radio,
    Collapse,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Button,
    Divider,
    Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Collection, Community } from "../../../data/accessAPI";
import { addMemberToGroup, Group, removeMemberToGroup } from "../../../api/group";
import { iconsImgs } from "../../../utils/images";

interface AccessManagementProps {
    open: boolean;
    onClose: (groups?: { uuid: string; groupName: string }[]) => void;
    userId: string | null; 
}

interface CommunityWithCollections extends Community {
    collections: Collection[];
    expanded: boolean;
}

const AccessManagement: React.FC<AccessManagementProps> = ({ open, onClose, userId }) => {
    const [communities, setCommunities] = useState<CommunityWithCollections[]>([]);
    const [collectionPermissions, setCollectionPermissions] = useState<{
        [key: string]: { permission: string; groupName: string; uuid: string }[]
    }>({});

    const [selectedPermissions, setSelectedPermissions] = useState<{ [key: string]: Set<string> }>({});
    const [selectedGroups, setSelectedGroups] = useState<{ uuid: string; groupName: string }[]>([]);
    const [initialUserGroups, setInitialUserGroups] = useState<{ uuid: string; groupName: string }[]>([]);
    const [groupsList, setGroupsList] = useState<Group[]>([]);
    const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<string>("");
    const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithCollections | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const communityData = await fetchCommunities();
                const communitiesWithCollections: CommunityWithCollections[] = await Promise.all(
                    communityData.map(async (community) => {
                        const collections = await fetchCollections(community.id);
                        return {
                            ...community,
                            collections,
                            expanded: false
                        };
                    })
                );
                setCommunities(communitiesWithCollections);
            } catch (error) {
                console.error("Error fetching communities and collections:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const { groups } = await fetchGroupsList();
                setGroupsList(groups);

                const permissionsMap: {
                    [key: string]: { permission: string; groupName: string; uuid: string }[]
                } = {};

                groups.forEach(group => {
                    const match = group.name.match(/^(.+?)_(.+)$/);
                    if (match) {
                        const collectionName = match[1];
                        const permission = match[2].toLowerCase();

                        if (!permissionsMap[collectionName]) {
                            permissionsMap[collectionName] = [];
                        }

                        permissionsMap[collectionName].push({
                            permission,
                            groupName: group.name,
                            uuid: group.uuid,
                        });
                    }
                });
                setCollectionPermissions(permissionsMap);
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };
        fetchGroups();
    }, []);

    useEffect(() => {
        const fetchUserAssignedGroups = async () => {
            if (!userId) {
                setInitialUserGroups([]);
                setSelectedGroups([]);
                return;
            }
            
            try {
                const response = await fetchUserGroupsList(userId);
                const userGroups: Group[] = response.groups || [];
                const updatedPermissions: { [key: string]: Set<string> } = {};
                const userGroupsArray = userGroups.map(group => ({ uuid: group.uuid, groupName: group.name }));

                setInitialUserGroups(userGroupsArray);
                setSelectedGroups(userGroupsArray);

                userGroups.forEach(group => {
                    const match = group.name.match(/^(.+?)_(.+)$/);
                    if (match) {
                        const collectionTitle = match[1];
                        const permission = match[2].toLowerCase();
                        if (!updatedPermissions[collectionTitle]) {
                            updatedPermissions[collectionTitle] = new Set();
                        }
                        updatedPermissions[collectionTitle].add(permission);
                    }
                });
                setSelectedPermissions(updatedPermissions);

                if (userGroups.length > 0) {
                    const firstPermission = userGroups[0].name.split('_')[1].toLowerCase();
                    setSelectedPermissionLevel(firstPermission);
                }
            } catch (error) {
                console.error("Error fetching user groups:", error);
            } 
        };
        fetchUserAssignedGroups();
    }, [userId]);

    const handlePermissionLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPermissionLevel(event.target.value);
    };

    const handleCollectionCheckboxChange = (collectionTitle: string, isChecked: boolean) => {
        const permissionGroups = collectionPermissions[collectionTitle]?.filter(
            g => g.permission === selectedPermissionLevel
        );
    
        if (!permissionGroups || permissionGroups.length === 0) {
            console.warn(`No groups found for collection: ${collectionTitle} with permission: ${selectedPermissionLevel}`);
            return;
        }
    
        setSelectedPermissions(prev => {
            const newPermissions = { ...prev };
            if (!newPermissions[collectionTitle]) {
                newPermissions[collectionTitle] = new Set();
            }
    
            const updatedSet = new Set(newPermissions[collectionTitle]);
            if (isChecked) {
                updatedSet.add(selectedPermissionLevel);
            } else {
                updatedSet.delete(selectedPermissionLevel);
            }
    
            return { ...newPermissions, [collectionTitle]: updatedSet };
        });
    
        setSelectedGroups(prev => {
            const groupUuidsToModify = new Set(permissionGroups.map(g => g.uuid));
            if (isChecked) {
                const groupsToAdd = permissionGroups.filter(g => 
                    !prev.some(existing => existing.uuid === g.uuid)
                );
                return [...prev, ...groupsToAdd];
            } else {
                return prev.filter(g => !groupUuidsToModify.has(g.uuid));
            }
        });
    };

    const handleSelectAll = (community: CommunityWithCollections) => {
        // Filter collections that have the selected permission level
        const filteredCollections = community.collections.filter(collection => {
            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
            return collectionPermissions[collectionTitle]?.some(p => p.permission === selectedPermissionLevel);
        });

        // Check if all collections are already selected
        const allSelected = filteredCollections.every(collection => {
            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
            return selectedPermissions[collectionTitle]?.has(selectedPermissionLevel);
        });

        // Update selected permissions and groups for all collections in the community
        filteredCollections.forEach(collection => {
            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
            handleCollectionCheckboxChange(collectionTitle, !allSelected);
        });
    };

    const isAllSelected = (community: CommunityWithCollections): boolean => {
        const filteredCollections = community.collections.filter(collection => {
            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
            return collectionPermissions[collectionTitle]?.some(p => p.permission === selectedPermissionLevel);
        });

        return filteredCollections.length > 0 && filteredCollections.every(collection => {
            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
            return selectedPermissions[collectionTitle]?.has(selectedPermissionLevel);
        });
    };

     const handleGroupChanges = async (): Promise<void> => {
        if (userId) {
            // Existing user flow
            const prevGroupsSet = new Set(initialUserGroups.map(g => g.uuid));
            const newGroupsSet = new Set(selectedGroups.map(g => g.uuid));
        
            const addedGroups = selectedGroups.filter(g => !prevGroupsSet.has(g.uuid));
            const removedGroups = initialUserGroups.filter(g => !newGroupsSet.has(g.uuid));
        
            try {
                await Promise.all(addedGroups.map(async (group) => {
                    await addMemberToGroup(group.uuid, userId);
                }));
            
                await Promise.all(removedGroups.map(async (group) => {
                    await removeMemberToGroup(group.uuid, userId);
                }));
            
                onClose(selectedGroups);
            } catch (error) {
                console.error("Error updating user groups:", error);
            }
        } else {
            // New user flow - just return selected groups
            onClose(selectedGroups);
        }
    };

    const permissionTypes = Array.from(
        new Set(
            Object.values(collectionPermissions)
                .flatMap(perms => perms.map(p => p.permission))
    ));

    return (
        <Modal open={open} onClose={() => onClose()} >
        <Paper
            sx={{ 
                width: "80%", 
                maxWidth: "1000px",
                maxHeight: "90%", 
                overflow: "auto",
                padding: "20px"
            }}
            className="modal-paper"
        >
            <div className="modal-header-container">
                <Typography variant="h5" className="modal-header">Collection wise permission</Typography>
                <IconButton onClick={() => onClose()} className="close-icon">
                    <CloseIcon />
                </IconButton>
            </div>

            <Box sx={{ marginBottom: 2 }}>
                <FormControl>
                    <RadioGroup
                        row
                        aria-labelledby="permission-level-radio-buttons"
                        name="permission-level"
                        value={selectedPermissionLevel}
                        onChange={handlePermissionLevelChange}
                    >
                        {permissionTypes.map(permission => (
                            <FormControlLabel
                                key={permission}
                                value={permission}
                                control={<Radio />}
                                label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
                {/* Left Panel - Communities */}
                <Grid item xs={4} sx={{ borderRight: "1px solid #e0e0e0" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Communities
                    </Typography>
                    <List dense sx={{ maxHeight: '400px', overflow: 'auto' }}>
                        {communities.map(community => (
                            <ListItem 
                                key={community.id} 
                                disablePadding
                                sx={{
                                    backgroundColor: selectedCommunity?.id === community.id ? '#f0f0f0' : 'transparent'
                                }}
                            >
                                <ListItemButton 
                                    onClick={() => setSelectedCommunity(community)}
                                    sx={{ py: 1 }}
                                >
                                    <ListItemText sx={{borderBottom: '1px solid #e0e0e0', py: 1}} primary={community.metadata["dc.title"]?.[0]?.value} />
                                    {selectedCommunity?.id === community.id ? 
                                        <img src={iconsImgs.minus} alt="Collapse" style={{ width: '16px', height: '16px' }} /> :
                                        <img src={iconsImgs.arrow} alt="Expand" style={{ width: '16px', height: '16px' }} />}
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Grid>

                {/* Right Panel - Collections */}
                <Grid item xs={8}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Collections
                        </Typography>
                        {selectedCommunity ? (
                            <>
                                <Box >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isAllSelected(selectedCommunity)}
                                                onChange={() => handleSelectAll(selectedCommunity)}
                                            />
                                        }
                                        label="Select All"
                                    />
                                </Box>
                                <List dense sx={{ maxHeight: '400px', overflow: 'auto' }}>
                                    {selectedCommunity.collections
                                        .filter(collection => {
                                            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
                                            return collectionPermissions[collectionTitle]?.some(p => p.permission === selectedPermissionLevel);
                                        })
                                        .map(collection => {
                                            const collectionTitle = collection.metadata?.["dc.title"]?.[0]?.value || "Unnamed Collection";
                                            const isCollectionChecked = selectedPermissions[collectionTitle]?.has(selectedPermissionLevel) || false;

                                            return (
                                                <ListItem key={collection.id} disablePadding>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={isCollectionChecked}
                                                                onChange={(e) => handleCollectionCheckboxChange(collectionTitle, e.target.checked)}
                                                            />
                                                        }
                                                        label={collectionTitle}
                                                        sx={{ width: '100%', ml: 0,borderBottom: '1px solid #e0e0e0' }}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                </List>
                            </>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Select a community to view its collections.
                            </Typography>
                        )}
                    </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 2 }}>
                <Button 
                    variant="contained" 
                    onClick={handleGroupChanges}
                    sx={{ 
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' },
                        textTransform: 'none',
                        padding: '8px 20px'
                    }}
                >
                    Give Access
                </Button>
            </Box>
        </Paper>
    </Modal>
    );
};

export default AccessManagement;