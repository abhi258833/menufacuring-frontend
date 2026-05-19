import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchItemInfo, patchItemMetadata } from "../../api/item";
import Loader from "../loader/loader";
import {
    Button,
    Container,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent
} from "@mui/material";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    IconButton,
    Box,

} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Bitstream, PatchOperation } from "../../data/bookDetail";
import { fetchBitstreams, fetchItemBundles, removeBitstream } from "../../api/bitstream";
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useNavigate } from "react-router-dom";
import { ItemInfo } from "../../data/itemFormData";
import { iconsImgs } from "../../utils/images";
import { fetchMetadataFields, fetchMetadataFieldsforDC, MetadataField } from "../../api/metadata";


const EditItem = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const [itemInfo, setItemInfo] = useState<ItemInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<{
        key: string;
        index: number;
    } | null>(null);
    const [originalItemInfo, setOriginalItemInfo] = useState<ItemInfo | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const [pendingUpdates, setPendingUpdates] = useState<PatchOperation[]>([]);
    const [originalBitstreams, setOriginalBitstreams] = useState<Bitstream[]>([]);
    const [thumbnailBitstreams, setThumbnailBitstreams] = useState<Bitstream[]>([]);
    const [pendingBitstreamDeletions, setPendingBitstreamDeletions] = useState<string[]>([]);
    const [deletedBitstreams, setDeletedBitstreams] = useState<Bitstream[]>([]);
    const Navigate = useNavigate();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bitstreamToDelete, setBitstreamToDelete] = useState<Bitstream | null>(null);
    const [showAddMetadataTable, setShowAddMetadataTable] = useState(false);
    const [metadataSchema, setMetadataSchema] = useState<MetadataField[]>([]);
    const [selectedSchemaId, setSelectedSchemaId] = useState<any>("");
    const [totalElements, setTotalElements] = useState(0);
    const rowsPerPage = 10;
    const [page, setPage] = useState<number>(1);
    const [newMetadataValue, setNewMetadataValue] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);

    const authToken = localStorage.getItem("authToken") || "";


    useEffect(() => {
        const fetchItemData = async () => {
            if (!itemId) return;
            try {
                setLoading(true);
                const data = await fetchItemInfo(itemId);
                setItemInfo(data);
                setOriginalItemInfo(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching item info:", err);
                setError("Failed to fetch item information");
            } finally {
                setLoading(false);
            }
        };

        fetchItemData();
    }, [itemId]);

    const handleEditClick = (key: string, index: number, currentValue: string) => {
        setEditingField({ key, index });
        setEditedValue(currentValue);
    };

    const handleSaveClick = () => {
        if (!editingField || !itemInfo) return;

        const { key, index } = editingField;
        const originalValue = itemInfo.metadata[key][index].value;

        if (editedValue !== originalValue) {
            const newUpdate: PatchOperation = {
                op: "replace",
                path: `/metadata/${key}/${index}`,
                value: {
                    ...itemInfo.metadata[key][index],
                    value: editedValue
                }
            };

            setPendingUpdates([...pendingUpdates, newUpdate]);

            const updatedMetadata = { ...itemInfo.metadata };
            const updatedValues = [...updatedMetadata[key]];

            updatedValues[index] = {
                ...updatedValues[index],
                value: editedValue
            };

            updatedMetadata[key] = updatedValues;

            setItemInfo({
                ...itemInfo,
                metadata: updatedMetadata
            });
        }

        setEditingField(null);
        setEditedValue("");
    };


    const handleDeleteClick = (key: string, index: number) => {
        if (!itemInfo) return;

        const deleteOperation: PatchOperation = {
            op: "remove",
            path: `/metadata/${key}/${index}`
        };

        setPendingUpdates([...pendingUpdates, deleteOperation]);

        let updatedMetadata = { ...itemInfo.metadata };
        const updatedValues = [...updatedMetadata[key]];
        updatedValues.splice(index, 1);

        if (updatedValues.length === 0) {
            const { [key]: _, ...rest } = updatedMetadata;
            updatedMetadata = rest;
        } else {
            updatedMetadata[key] = updatedValues;
        }

        setItemInfo({
            ...itemInfo,
            metadata: updatedMetadata
        });
    };

    const handleSaveAll = async () => {
        if (!itemInfo || pendingUpdates.length === 0) return;

        try {
            setLoading(true);
            await patchItemMetadata(itemInfo.id, pendingUpdates);
            setPendingUpdates([]);
            setError(null);
            Navigate(`/edit-item/${itemId}`);
        } catch (err) {
            console.error("Error updating item:", err);
            setError("Failed to update item");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        setEditingField(null);
        setEditedValue("");
    };

    const handleDiscardAll = () => {
        if (!originalItemInfo) return;

        setItemInfo(originalItemInfo);
        setPendingUpdates([]);
        setEditingField(null);
        setEditedValue("");
    };
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedValue(e.target.value);
    };

    useEffect(() => {
        const fetchThumbnails = async () => {
            try {
                setLoading(true);
                if (!itemId) return;

                const bundles = await fetchItemBundles(itemId);
                if (bundles.length > 0) {
                    const originalBundle = bundles.find(b => b.name === 'ORIGINAL') || bundles[0];
                    const thumbnailBundle = bundles.find(b => b.name === 'THUMBNAIL') || bundles[0];
                    const originalbitstreamsData = await fetchBitstreams(originalBundle.uuid);
                    const thumbnailbitstreamsData = await fetchBitstreams(thumbnailBundle.uuid);
                    setOriginalBitstreams(originalbitstreamsData);
                    setThumbnailBitstreams(thumbnailbitstreamsData);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchThumbnails();
    }, []);

    const handleDeleteBitstream = (bitstreamId: string) => {

        const bitstreamToDelete = originalBitstreams.find(bs => bs.uuid === bitstreamId);
        if (!bitstreamToDelete) return;

        setBitstreamToDelete(bitstreamToDelete);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!bitstreamToDelete) return;

        setPendingBitstreamDeletions([...pendingBitstreamDeletions, bitstreamToDelete.uuid]);
        setOriginalBitstreams(originalBitstreams.filter(bs => bs.uuid !== bitstreamToDelete.uuid));
        setDeletedBitstreams([...deletedBitstreams, bitstreamToDelete]);
        setDeleteModalOpen(false);
        setBitstreamToDelete(null);
    };
    const handleBitstreamSave = async () => {
        if (pendingBitstreamDeletions.length === 0) return;

        try {
            setLoading(true);

            const deleteOperations: PatchOperation[] = pendingBitstreamDeletions.map(bitstreamId => ({
                op: "remove",
                path: `/bitstreams/${bitstreamId}`
            }));

            await Promise.all(deleteOperations.map(op => removeBitstream([op])));

            setPendingBitstreamDeletions([]);
            setDeletedBitstreams([]);

            Navigate(`/edit-item/${itemId}`);
        } catch (err) {
            console.error("Error deleting bitstreams:", err);
            setError("Failed to delete bitstreams");

            setOriginalBitstreams([...originalBitstreams, ...deletedBitstreams]);
            setPendingBitstreamDeletions([]);
            setDeletedBitstreams([]);
        } finally {
            setLoading(false);
        }
    };
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setBitstreamToDelete(null);
    };

    const handleDiscardBitstreamChanges = () => {
        setOriginalBitstreams([...originalBitstreams, ...deletedBitstreams]);
        setPendingBitstreamDeletions([]);
        setDeletedBitstreams([]);
    };

    const handleShowTable = () => {
        setShowAddMetadataTable(!showAddMetadataTable);
    }
    const handleMetadataChange = (event: SelectChangeEvent<string>) => {
        setSelectedSchemaId(event.target.value);
    };

    useEffect(() => {
        const loadMetadataFields = async () => {
            try {
                const fields = await fetchMetadataFieldsforDC("", authToken, page - 1, rowsPerPage, "");

                if (page === 1) {
                    setMetadataSchema(fields.metadatafields);
                } else {
                    setMetadataSchema(prev => [...prev, ...fields.metadatafields]);
                }

                // ✅ store totalElements, not totalPages
                setTotalElements(fields.totalElements);
            } catch (err) {
                setError("Failed to fetch metadata fields.");
            }
        };

        loadMetadataFields();
    }, [authToken, page]);


    const handleAddMetadata = async () => {
        if (!selectedSchemaId || !newMetadataValue.trim()) {
            setError("Metadata field and value are required.");
            return;
        }

        try {
            const selectedSchema = metadataSchema.find(schema => schema.id === selectedSchemaId);
            if (!selectedSchema) return;

            const metadataKey = `${selectedSchema._embedded?.schema?.prefix}.${selectedSchema.element}` +
                (selectedSchema.qualifier ? `.${selectedSchema.qualifier}` : '');

            const addOperation: PatchOperation = {
                op: "add",
                path: `/metadata/${metadataKey}/-`,
                value: {
                    value: newMetadataValue,
                    language: null,
                    authority: null,
                    confidence: -1
                }
            };

            setPendingUpdates([...pendingUpdates, addOperation]);

            const updatedMetadata = { ...itemInfo!.metadata };
            if (!updatedMetadata[metadataKey]) {
                updatedMetadata[metadataKey] = [];
            }
            updatedMetadata[metadataKey].push({
                value: newMetadataValue,
                // language: null,
                // authority: null,
                // confidence: -1
            });

            setItemInfo({
                ...itemInfo!,
                metadata: updatedMetadata
            });

            setNewMetadataValue("");
            setSelectedSchemaId("");
            setShowAddMetadataTable(false);
            setError(null);
        } catch (err) {
            console.error("Error adding metadata:", err);
            setError("Failed to add metadata field.");
        }
    };

    const fetchNextPage = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handleMenuScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const list = event.target as HTMLDivElement;
        const scrollThreshold = 10;

        if (list.scrollTop + list.clientHeight >= list.scrollHeight - scrollThreshold) {
            if (page * rowsPerPage < totalElements) {
                fetchNextPage();
            }
        }
    };

    if (loading && !editingField) {
        return <Loader />;
    }

    if (!itemInfo) {
        return <div className="no-data">No item information available</div>;
    }

    return (
        <Container sx={{ mt: 2, mb: 2 }} >
            <Container sx={{ marginBottom: "30px" }} >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                    className="header_epeople"
                >
                    <Typography variant="h4">
                        <span className="label-text">Edit Item :</span> <span className="item-name">{itemInfo.name}</span>
                    </Typography>

                    <Box sx={{ display: "flex" }}>
                        <Button
                            variant="contained"
                            color="success"
                            disabled={pendingUpdates.length === 0 || loading}
                            onClick={handleSaveAll}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDiscardAll}
                            disabled={pendingUpdates.length === 0 || loading}
                            sx={{ marginLeft: "10px" }}
                        >
                            Discard
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleShowTable}
                            sx={{ marginLeft: "10px" }}
                        >
                            Add {<img className="table_icon_add" src={iconsImgs.add} alt="Add" />}
                        </Button>
                    </Box>
                </Box>
                {showAddMetadataTable && (
                    <TableContainer component={Paper} sx={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        overflow: "hidden",
                        marginTop: 2,
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell><b>Field</b></TableCell>
                                    <TableCell><b>Values</b></TableCell>
                                    <TableCell><b>Actions</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <FormControl fullWidth sx={{}}>
                                            <Select
                                                value={selectedSchemaId}
                                                onChange={handleMetadataChange}
                                                displayEmpty
                                                MenuProps={{
                                                    PaperProps: {
                                                        ref: menuRef,
                                                        onScroll: handleMenuScroll,
                                                        style: { maxHeight: 300 },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="" disabled>
                                                    Select Metadata Schema
                                                </MenuItem>
                                                {metadataSchema.map((schema) => (
                                                    <MenuItem key={schema.id} value={schema.id}>
                                                        {schema._embedded?.schema?.prefix}.{schema.element}
                                                        {schema.qualifier ? `.${schema.qualifier}` : ''}
                                                    </MenuItem>
                                                ))}
                                                {loading && metadataSchema.length < totalElements && (
                                                    <MenuItem disabled>Loading more...</MenuItem>
                                                )}

                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell >
                                        <TextField
                                            sx={{ marginTop: 2 }}
                                            value={newMetadataValue}
                                            onChange={(e) => setNewMetadataValue(e.target.value)}
                                            fullWidth
                                            placeholder="Enter value"
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="contained" color="primary"
                                            onClick={handleAddMetadata}
                                        >
                                            Add
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <TableContainer component={Paper} sx={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    marginTop: 2
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                <TableCell><b>Field</b></TableCell>
                                <TableCell><b>Values</b></TableCell>
                                <TableCell><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(itemInfo.metadata).map(([key, values], rowIndex) => (
                                <TableRow
                                    key={key}
                                    sx={{
                                        "&:hover": { backgroundColor: "#f0f0f0" },
                                        cursor: "pointer",
                                    }}
                                >
                                    <TableCell>
                                        <strong>{key}</strong>
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {values.map((value, i) => (
                                                editingField?.key === key && editingField?.index === i ? (
                                                    <TextField
                                                        key={`${key}-${i}-edit`}
                                                        variant="outlined"
                                                        size="small"
                                                        value={editedValue}
                                                        onChange={handleValueChange}
                                                        disabled={loading}
                                                        sx={{ minWidth: 200, marginBottom: '0 !important' }}
                                                    />
                                                ) : (
                                                    <Typography
                                                        key={`${key}-${i}`}
                                                        variant="body2"
                                                        sx={{
                                                            maxWidth: 300,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            marginBottom: 1,
                                                        }}
                                                    >
                                                        {value.value}
                                                    </Typography>
                                                )
                                            ))}
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {values.map((value, i) => (
                                                editingField?.key === key && editingField?.index === i ? (
                                                    <Box key={`${key}-${i}-actions`} sx={{ display: 'flex', }}>
                                                        <IconButton
                                                            className="btn_table"
                                                            color="primary"
                                                            onClick={handleSaveClick}
                                                            disabled={loading}
                                                            title="Save"
                                                        >
                                                            <img className="table_icon" src={iconsImgs.save} alt="Save" />
                                                        </IconButton>
                                                        <IconButton
                                                            className="btn_table_editi"
                                                            color="secondary"
                                                            onClick={handleCancelClick}
                                                            disabled={loading}
                                                            title="Cancel"
                                                        >
                                                            <img className="table_icon" src={iconsImgs.cancel} alt="Cancel" />
                                                        </IconButton>
                                                    </Box>
                                                ) : (
                                                    <Box key={`${key}-${i}-actions`} sx={{ display: 'flex', gap: 1 }}>
                                                        <IconButton
                                                            className="btn_table"
                                                            color="primary"
                                                            onClick={() => handleEditClick(key, i, value.value)}
                                                            disabled={loading}
                                                            title="Edit"
                                                        >
                                                            <img className="table_icon" src={iconsImgs.edit} alt="Edit" />
                                                        </IconButton>
                                                        <IconButton
                                                            className="btn_table_editi"
                                                            color="error"
                                                            onClick={() => handleDeleteClick(key, i)}
                                                            disabled={loading}
                                                            title="Delete"
                                                        >
                                                            <img className="table_icon" src={iconsImgs.remove} alt="Remove" />
                                                        </IconButton>
                                                    </Box>
                                                )
                                            ))}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
            <Container>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBitstreamSave}
                        disabled={pendingBitstreamDeletions.length === 0 || loading}
                        sx={{ marginBottom: "20px" }}
                    >
                        {loading ? 'Saving...' : 'Save Bitstream Changes'}
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDiscardBitstreamChanges}
                        disabled={pendingBitstreamDeletions.length === 0 || loading}
                        sx={{ marginBottom: "20px" }}
                    >
                        Discard Bitstream Changes
                    </Button>
                </Box>
                <Table>
                    <TableHead>
                        <TableRow>

                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Format</b></TableCell>
                            <TableCell><b>Actions</b></TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">BUNDLE: ORIGINAL</Typography>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                        color="primary"
                                        onClick={() => Navigate(`/add-bitstream/${itemId}`)}
                                        title="Add"
                                        size="small"
                                    >
                                        <img className="table_icon_add" src={iconsImgs.add} alt="Add" />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableBody>

                    <TableBody>
                        {originalBitstreams.map((bitstream) => (

                            <TableRow key={bitstream.uuid}>

                                <TableCell>
                                    <Typography variant="body2">
                                        {bitstream.name}
                                    </Typography>
                                </TableCell>
                                <TableCell></TableCell>

                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            color="primary"
                                            onClick={() => window.open(bitstream._links.content.href, "_blank")}
                                            title="View"
                                            size="small"
                                        >
                                            <DownloadRoundedIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteBitstream(bitstream.uuid)}
                                            title="Delete"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Dialog
                    open={deleteModalOpen}
                    onClose={handleCancelDelete}
                >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete the bitstream {" "}
                            <strong>{bitstreamToDelete?.name}</strong>?
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
        </Container>
    );
};

export default EditItem;