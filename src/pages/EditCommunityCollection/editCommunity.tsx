import React, { useEffect, useState } from 'react'
import { fetchCommunities, fetchCollectionsItem, deleteCommunity, editCommunity, fetchSubCommunities } from '../../api/communities';
import { Box, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, TextField, Collapse, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { iconsImgs } from '../../utils/images';
import { deleteCollection, editCollection } from '../../api/collection';
import { Collection, Community, CommunityResponse, EmbeddedCollections } from '../../data/communityData';
import Loader from '../loader/loader';
import { useNavigate } from 'react-router-dom';
import TopCommunity from "../community/topCommunity";
import SubCommunity from '../community/SubCommunity';
import SelectCommunityModal from '../collection/selectCommunity';


const EditCommunity = () => {
    type EditableCommunity = Community & { children?: EditableCommunity[] };

    const [communities, setCommunities] = useState<EditableCommunity[]>([]);
    const [expandedCommunities, setExpandedCommunities] = useState<string[]>([]);
    const [collections, setCollections] = useState<Record<string, Collection[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
        type: 'community' | 'collection';
        uuid: string;
        communityUuid?: string;
        name: string;
    } | null>(null);

    const navigate = useNavigate();

    const [modalOpen, setModalOpen] = useState(false);
    const [openCommunityModal, setOpenCommunityModal] = useState(false);
    const [openSubCommunityModal, setOpenSubCommunityModal] = useState(false);

    const handleButtonClick = () => {
        setModalOpen(true);
    };


    const handleButtonCommunity = () => {
        setOpenCommunityModal(true);
    };


    const getCommunityTitle = (community: Community) =>
        community.metadata["dc.title"]?.[0]?.value || 'No Title Available';

    const findCommunityByUuid = (
        items: EditableCommunity[],
        uuid: string
    ): EditableCommunity | undefined => {
        for (const item of items) {
            if (item.uuid === uuid) {
                return item;
            }

            const childMatch = item.children?.length
                ? findCommunityByUuid(item.children, uuid)
                : undefined;

            if (childMatch) {
                return childMatch;
            }
        }

        return undefined;
    };

    const updateCommunityTree = (
        items: EditableCommunity[],
        uuid: string,
        updater: (community: EditableCommunity) => EditableCommunity
    ): EditableCommunity[] => {
        return items.map((community) => {
            if (community.uuid === uuid) {
                return updater(community);
            }

            if (community.children?.length) {
                return {
                    ...community,
                    children: updateCommunityTree(community.children, uuid, updater)
                };
            }

            return community;
        });
    };

    const removeCommunityFromTree = (items: EditableCommunity[], uuid: string): EditableCommunity[] => {
        return items
            .filter((community) => community.uuid !== uuid)
            .map((community) => ({
                ...community,
                children: community.children?.length
                    ? removeCommunityFromTree(community.children, uuid)
                    : community.children
            }));
    };

    const createEditableCommunity = (
        community: Community,
        childrenMap: Map<string, Community[]>
    ): EditableCommunity => ({
        ...community,
        isEditing: false,
        editedTitle: getCommunityTitle(community),
        children: (childrenMap.get(community.uuid) || []).map((child) =>
            createEditableCommunity(child, childrenMap)
        )
    });

    const fetchCommunityData = async () => {
        try {
            const response = await fetchCommunities();
            const communityData = response as CommunityResponse;
            const communityList = communityData._embedded.communities || [];

            const subcommunityResponses = await Promise.all(
                communityList.map(async (community) => {
                    try {
                        const subcommunityData = await fetchSubCommunities(community.uuid, 0, 1000) as {
                            _embedded?: { subcommunities?: Community[] };
                        };

                        return {
                            parentUuid: community.uuid,
                            subcommunities: subcommunityData._embedded?.subcommunities || []
                        };
                    } catch {
                        return {
                            parentUuid: community.uuid,
                            subcommunities: []
                        };
                    }
                })
            );

            const childIds = new Set<string>();
            const childrenMap = new Map<string, Community[]>();

            subcommunityResponses.forEach(({ parentUuid, subcommunities }) => {
                if (subcommunities.length) {
                    childrenMap.set(parentUuid, subcommunities);
                    subcommunities.forEach((subcommunity) => childIds.add(subcommunity.uuid));
                }
            });

            const topLevelCommunities = communityList.filter((community) => !childIds.has(community.uuid));
            setCommunitiesWithEditingState(topLevelCommunities, childrenMap);
            setIsLoading(false);
        } catch (err) {
            setError('Failed to fetch communities');
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchCommunityData();
    }, []);

    const setCommunitiesWithEditingState = (
        nextCommunities: Community[],
        childrenMap: Map<string, Community[]>
    ) => {
        setCommunities(nextCommunities.map((community) => createEditableCommunity(community, childrenMap)));
    };

    const handleEditClick = (uuid: string) => {
        setCommunities((currentCommunities) =>
            updateCommunityTree(currentCommunities, uuid, (community) => ({
                ...community,
                isEditing: true,
                editedTitle: getCommunityTitle(community)
            }))
        );
    };

    const handleSaveClick = async (uuid: string) => {
        try {
            const community = findCommunityByUuid(communities, uuid);
            if (!community) return;

            const originalTitle = getCommunityTitle(community);

            if (community.editedTitle === originalTitle) {
                setCommunities((currentCommunities) =>
                    updateCommunityTree(currentCommunities, uuid, (value) => ({
                        ...value,
                        isEditing: false
                    }))
                );
                return;
            }

            await editCommunity(uuid, community.editedTitle || '');
            setCommunities((currentCommunities) =>
                updateCommunityTree(currentCommunities, uuid, (value) => ({
                    ...value,
                    isEditing: false,
                    metadata: {
                        ...value.metadata,
                        "dc.title": [{ ...value.metadata["dc.title"][0], value: value.editedTitle || '' }]
                    }
                }))
            );

        } catch (err) {
            console.error('Failed to update community', err);
        }
    };

    const handleCancelClick = (uuid: string) => {
        setCommunities((currentCommunities) =>
            updateCommunityTree(currentCommunities, uuid, (community) => ({
                ...community,
                isEditing: false,
                editedTitle: getCommunityTitle(community)
            }))
        );
    };

    const handleTitleChange = (uuid: string, value: string) => {
        setCommunities((currentCommunities) =>
            updateCommunityTree(currentCommunities, uuid, (community) => ({
                ...community,
                editedTitle: value
            }))
        );
    };

    const handleDeleteClick = (uuid: string) => {
        const community = findCommunityByUuid(communities, uuid);
        if (!community) return;

        setItemToDelete({
            type: 'community',
            uuid,
            name: getCommunityTitle(community)
        });
        setDeleteModalOpen(true);
    };

    const handleShowCollection = async (uuid: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const response = await fetchCollectionsItem(uuid);
            const collectionData = response as EmbeddedCollections;
            const collectionsWithEditingState = collectionData._embedded.collections.map(collection => ({
                ...collection,
                isEditing: false,
                editedTitle: collection.metadata["dc.title"]?.[0]?.value || ''
            }));

            setCollections(prev => ({
                ...prev,
                [uuid]: collectionsWithEditingState
            }));

            setExpandedCommunities((currentExpanded) =>
                currentExpanded.includes(uuid)
                    ? currentExpanded.filter((communityUuid) => communityUuid !== uuid)
                    : [...currentExpanded, uuid]
            );
        } catch (err) {
            setError('Failed to fetch collections');
        }
    };

    const handleCollectionEditClick = (communityUuid: string, collectionUuid: string) => {
        setCollections(prev => {
            const updatedCollections = { ...prev };
            updatedCollections[communityUuid] = updatedCollections[communityUuid].map(collection => {
                if (collection.uuid === collectionUuid) {
                    return {
                        ...collection,
                        isEditing: true,
                        editedTitle: collection.metadata["dc.title"]?.[0]?.value || ''
                    };
                }
                return collection;
            });
            return updatedCollections;
        });
    };

    const handleCollectionSaveClick = async (communityUuid: string, collectionUuid: string) => {
        try {
            const collection = collections[communityUuid]?.find(value => value.uuid === collectionUuid);
            if (!collection) return;

            const originalTitle = collection.metadata["dc.title"]?.[0]?.value || '';

            if (collection.editedTitle === originalTitle) {
                setCollections(prev => {
                    const updatedCollections = { ...prev };
                    updatedCollections[communityUuid] = updatedCollections[communityUuid].map(community => {
                        if (community.uuid === collectionUuid) {
                            return {
                                ...community,
                                isEditing: false
                            };
                        }
                        return community;
                    });
                    return updatedCollections;
                });
                return;
            }

            await editCollection(collectionUuid, collection.editedTitle || '');

            setCollections(prev => {
                const updatedCollections = { ...prev };
                updatedCollections[communityUuid] = updatedCollections[communityUuid].map(community => {
                    if (community.uuid === collectionUuid) {
                        return {
                            ...community,
                            isEditing: false,
                            metadata: {
                                ...community.metadata,
                                "dc.title": [{ ...community.metadata["dc.title"][0], value: community.editedTitle || '' }]
                            }
                        };
                    }
                    return community;
                });
                return updatedCollections;
            });
        } catch (err) {
            console.error('Failed to update collection', err);
        }
    };

    const handleCollectionCancelClick = (communityUuid: string, collectionUuid: string) => {
        setCollections(prev => {
            const updatedCollections = { ...prev };
            updatedCollections[communityUuid] = updatedCollections[communityUuid].map(collection => {
                if (collection.uuid === collectionUuid) {
                    return {
                        ...collection,
                        isEditing: false,
                        editedTitle: collection.metadata["dc.title"]?.[0]?.value || ''
                    };
                }
                return collection;
            });
            return updatedCollections;
        });
    };

    const handleCollectionTitleChange = (communityUuid: string, collectionUuid: string, value: string) => {
        setCollections(prev => {
            const updatedCollections = { ...prev };
            updatedCollections[communityUuid] = updatedCollections[communityUuid].map(collection => {
                if (collection.uuid === collectionUuid) {
                    return {
                        ...collection,
                        editedTitle: value
                    };
                }
                return collection;
            });
            return updatedCollections;
        });
    };

    const handleCollectionDeleteClick = (communityUuid: string, collectionUuid: string) => {
        const collection = collections[communityUuid]?.find(c => c.uuid === collectionUuid);
        if (!collection) return;

        setItemToDelete({
            type: 'collection',
            uuid: collectionUuid,
            communityUuid,
            name: collection.metadata["dc.title"]?.[0]?.value || 'this collection'
        });
        setDeleteModalOpen(true);
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'community') {
                await deleteCommunity(itemToDelete.uuid);
                setCommunities((currentCommunities) =>
                    removeCommunityFromTree(currentCommunities, itemToDelete.uuid)
                );
            } else if (itemToDelete.type === 'collection' && itemToDelete.communityUuid) {
                await deleteCollection(itemToDelete.uuid);
                setCollections(prev => {
                    const updatedCollections = { ...prev };
                    updatedCollections[itemToDelete.communityUuid!] =
                        updatedCollections[itemToDelete.communityUuid!].filter(
                            collection => collection.uuid !== itemToDelete.uuid
                        );
                    return updatedCollections;
                });
            }
        } catch (err) {
            console.error('Failed to delete', err);
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleCollectionPolicyClick = (communityUuid: string, collectionUuid: string) => {
        navigate(`/Policies/${collectionUuid}`);
    };

    const handleCollectionAssignRoleClick = (collectionUuid: string) => {
        navigate(`/assignRole/${collectionUuid}`);
    };

    const handleCommunityPolicyClick = (communityUuid: string) => {
        navigate(`/Policies/${communityUuid}`);
    };

    const renderCommunityRows = (community: EditableCommunity, depth: number = 0): React.ReactNode => (
        <React.Fragment key={community.uuid}>
            <TableRow
                sx={{
                    "&:hover": { backgroundColor: "#f0f0f0" },
                    cursor: "pointer",
                }}
                onClick={(e) => handleShowCollection(community.uuid, e)}
            >
                <TableCell sx={{ pl: 2 + depth * 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {depth > 0 && (
                            <Box component="span" sx={{ color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>
                                -
                            </Box>
                        )}
                        {community.isEditing ? (
                            <TextField
                                variant="outlined"
                                size="small"
                                value={community.editedTitle}
                                onClick={(e => e.stopPropagation())}
                                onChange={(e) => handleTitleChange(community.uuid, e.target.value)}
                                fullWidth
                            />
                        ) : (
                            getCommunityTitle(community)
                        )}
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {community.isEditing ? (
                            <Box>
                                <IconButton
                                    className='btn_table'
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveClick(community.uuid)
                                    }}
                                    title="Save"
                                >
                                    <img className="table_icon" src={iconsImgs.save} alt="Save" />
                                </IconButton>
                                <IconButton
                                    className='btn_table'
                                    color="secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelClick(community.uuid)
                                    }}
                                    title="Cancel"
                                >
                                    <img className="table_icon" src={iconsImgs.cancel} alt="Cancel" />
                                </IconButton>
                            </Box>
                        ) : (
                            <Box>
                                <IconButton
                                    className='btn_table'
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(community.uuid)
                                    }}
                                    title="Edit"
                                >
                                    <img className="table_icon" src={iconsImgs.edit} alt="Edit" />
                                </IconButton>
                                <IconButton
                                    className='btn_table_dlt'
                                    color="error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(community.uuid)
                                    }}
                                    title="Delete"
                                >
                                    <img className="table_icon" src={iconsImgs.remove} alt="Remove" />
                                </IconButton>
                                <IconButton
                                    className='btn_table'
                                    color="secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCommunityPolicyClick(community.uuid)
                                    }}
                                    title="CommunityPolicy"
                                >
                                    <img className="table_icon" src={iconsImgs.access} alt="Remove" />
                                </IconButton>
                                <IconButton
                                    className='btn_table'
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShowCollection(community.uuid);
                                    }}
                                    title="View Collections"
                                >
                                    {expandedCommunities.includes(community.uuid) ? <img className="table_icon" src={iconsImgs.minus} alt="Minus" /> : <img className="table_icon" src={iconsImgs.add} alt="Add" />}
                                </IconButton>
                            </Box>
                        )}
                    </Box>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expandedCommunities.includes(community.uuid)} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            {community.children && community.children.length > 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom component="div">
                                        Sub-Communities
                                    </Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                                <TableCell><b>Sub-Community Name</b></TableCell>
                                                <TableCell><b>Actions</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {community.children.map((child) => renderCommunityRows(child, depth + 1))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            )}

                            <Box sx={{ mt: community.children && community.children.length > 0 ? 3 : 0 }}>
                                <Typography variant="h6" gutterBottom component="div">
                                    Collections
                                </Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                            <TableCell><b>Collection Name</b></TableCell>
                                            <TableCell><b>Actions</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {collections[community.uuid]?.map((collection) => (
                                            <TableRow
                                                sx={{
                                                    "&:hover": { backgroundColor: "#f0f0f0" },
                                                    cursor: "pointer",
                                                }}
                                                key={collection.uuid}>
                                                <TableCell>
                                                    {collection.isEditing ? (
                                                        <TextField
                                                            value={collection.editedTitle}
                                                            onChange={(e) => handleCollectionTitleChange(community.uuid, collection.uuid, e.target.value)}
                                                            fullWidth
                                                        />
                                                    ) : (
                                                        collection.metadata["dc.title"]?.[0]?.value || 'No Title Available'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        {collection.isEditing ? (
                                                            <>
                                                                <IconButton
                                                                    className='btn_table'
                                                                    color="primary"
                                                                    onClick={() => handleCollectionSaveClick(community.uuid, collection.uuid)}
                                                                    title="Save"
                                                                >
                                                                    <img className="table_icon" src={iconsImgs.save} alt="Save" />
                                                                </IconButton>
                                                                <IconButton
                                                                    className='btn_table'
                                                                    color="secondary"
                                                                    onClick={() => handleCollectionCancelClick(community.uuid, collection.uuid)}
                                                                    title="Cancel"
                                                                >
                                                                    <img className="table_icon" src={iconsImgs.cancel} alt="Cancel" />
                                                                </IconButton>
                                                            </>
                                                        ) : (
                                                            <Box>
                                                                <IconButton
                                                                    className='btn_table'
                                                                    color="primary"
                                                                    onClick={() => handleCollectionEditClick(community.uuid, collection.uuid)}
                                                                    title="Edit"
                                                                >
                                                                    <img className="table_icon" src={iconsImgs.edit} alt="Edit" />
                                                                </IconButton>
                                                                <IconButton
                                                                    className='btn_table'
                                                                    color="error"
                                                                    onClick={() => handleCollectionDeleteClick(community.uuid, collection.uuid)}
                                                                    title="Delete"
                                                                >
                                                                    <img className="table_icon" src={iconsImgs.remove} alt="Remove" />
                                                                </IconButton>
                                                                <IconButton
                                                                    className='btn_table'
                                                                    color="secondary"
                                                                    onClick={() => handleCollectionPolicyClick(community.uuid, collection.uuid)}
                                                                    title="CollectionPolicy"
                                                                >
                                                                    <img className="table_icon" src={iconsImgs.access} alt="Policy" />
                                                                </IconButton>
                                                                <IconButton
                                                                    className='btn_table'
                                                                    color="primary"
                                                                    onClick={() => handleCollectionAssignRoleClick(collection.uuid)}
                                                                    title="Assign Role"
                                                                >
                                                                    <img className="table_icon" src={iconsImgs.group_icon_black} alt="Assign Role" />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );

    return (
        <Container className="top_padding">
            <Box display="flex" justifyContent="space-between" className="header_epeople" alignItems="center" mb={2}>
                <Typography variant="h4">Edit Community</Typography>

                <Box display="flex" gap={2}>
                    <div>
                        <Button variant="contained" color="secondary" onClick={handleButtonCommunity}>
                            <img className="collection_icon" src={iconsImgs.community} alt="community" />
                            Create Community
                        </Button>

                        {/* Modal */}
                        <TopCommunity
                            open={openCommunityModal}
                            handleClose={() => setOpenCommunityModal(false)}
                            onCommunityCreated={fetchCommunityData}
                        />
                    </div>
                    <div>
                        <Button variant="contained" color="success"
                            onClick={() => {
                                handleButtonClick();
                                setExpandedCommunities([]);
                            }} >
                            <img className="collection_icon" src={iconsImgs.collection} alt="collection" />
                            Create Collection
                        </Button>
                        <SelectCommunityModal open={modalOpen}
                            onClose={() => setModalOpen(false)}
                        />
                    </div>
                    <div>
                        <Button variant="contained" color="info"
                            onClick={() => setOpenSubCommunityModal(true)}>
                            <img className="collection_icon" src={iconsImgs.collection} alt="subcommunity" />
                            Create Sub-Community
                        </Button>
                        <SubCommunity
                            open={openSubCommunityModal}
                            handleClose={() => setOpenSubCommunityModal(false)}
                            parentCommunityId={null}
                            onSubCommunityCreated={fetchCommunityData}
                        />
                    </div>
                </Box>
            </Box>
            {isLoading && <Loader />}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!isLoading && !error && (
                <>
                    <TableContainer component={Paper} sx={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        overflow: "hidden",
                        marginTop: 2
                    }}>
                        <Table sx={{ mb: 2 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell ><b>Communities</b></TableCell>
                                    <TableCell sx={{ display: 'flex', justifyContent: 'center' }}><b>Actions</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {communities.map((community) => renderCommunityRows(community))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                </>
            )}
            <Dialog
                open={deleteModalOpen}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {itemToDelete?.type} {itemToDelete?.name}?
                        <br />
                        This action cannot be undo.
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
}

export default EditCommunity;
