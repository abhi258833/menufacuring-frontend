import { useEffect, useState } from "react";
import { addMetadataSchema, deleteMetadataSchema, fetchMetadataSchemas } from "../../api/registries";
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Pagination, TextField, Button, Box } from "@mui/material";
import "../../pages/Registries/MetadataSchemas.css"
import { useNavigate } from "react-router-dom";
import { showToast } from "../../contexts/ToastProvider";
import Loader from "../loader/loader";

interface MetadataSchema {
    id: number;
    prefix: string;
    namespace: string;
}

const MetadataSchemas = () => {
    const [schemas, setSchemas] = useState<MetadataSchema[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [page, setPage] = useState<number>(1);
    const [selected, setSelected] = useState<number[]>([]);
    const [namespace, setNamespace] = useState("");
    const [name, setName] = useState("");
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);
    const navigate = useNavigate();
    const authToken = localStorage.getItem("authToken") || "";
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIsSaveEnabled(namespace.trim() !== "" && name.trim() !== "");
    }, [namespace, name]);

    const getSchemas = async () => {
        try {
            setLoading(true);
            const { metadataschemas, totalPages } = await fetchMetadataSchemas(authToken, page - 1, 10);
            setSchemas(metadataschemas);
            setTotalPages(totalPages);
        } catch (error) {
            showToast("Error fetching metadata schemas", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getSchemas();
    }, []);

    useEffect(() => {
        getSchemas();
    }, [page, authToken]);

    const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleSelect = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const handleSave = async () => {
        const payload = { prefix: name, namespace };

        try {
            setLoading(true);
            await addMetadataSchema(payload);
            setNamespace("");
            setName("");
            getSchemas();
        } catch (error) {
            console.error("Error adding metadata schema:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSelected = async () => {
        try {
            setLoading(true);
            await Promise.all(selected.map((id) => deleteMetadataSchema(id)));
            setSelected([]);
            getSchemas();
        } catch (error) {
            console.error("Error deleting metadata schemas:", error);
        } finally {
            setLoading(false);
        }
    };
    const handleView = (prefix: string, schemaId: number) => {
        setLoading(true);
        navigate(`/bitstream/${schemaId}/${encodeURIComponent(prefix)}`);
        setLoading(false);
    };


    return (
        <Paper className="metadata-container ">
            <div className="header_shema_div top_padding">
                <h1 className="header_shema">
                    Metadata Registry
                </h1>
                <p className="header_shema_p">The metadata registry maintains a list of all metadata fields available in the repository. These fields may be divided amongst multiple schemas. However, DSpace requires the qualified Dublin Core schema.</p>
                <h2 className="header_shema_h2">
                    Create metadata schema
                </h2>
            </div>
            {loading && <Loader />}
            <Box className="form-container">
                <TextField
                    label="Namespace *"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    fullWidth
                    className="search-field_double"
                    InputLabelProps={{ className: "custom-label" }}
                />
                <TextField
                    label="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    className="search-field"
                    InputLabelProps={{ className: "custom-label" }}
                />
                <Button className="button_search_double" variant="contained" onClick={handleSave} disabled={!isSaveEnabled}>
                    Save
                </Button>

            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Select</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Namespace</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schemas.map((schema) => (
                            <TableRow key={schema.id} sx={{
                                "&:hover": { backgroundColor: "#f0f0f0" },
                                cursor: "pointer",
                            }}>
                                <TableCell>
                                    <Checkbox
                                        checked={selected.includes(schema.id)}
                                        onChange={() => handleSelect(schema.id)}
                                    />
                                </TableCell>
                                <TableCell>{schema.id}</TableCell>
                                <TableCell>{schema.namespace}</TableCell>
                                <TableCell>{schema.prefix}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" onClick={() => handleView(schema.prefix, schema.id)}>
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 2 }}>
                <Button variant="contained" color="error" onClick={handleDeleteSelected} disabled={selected.length === 0}>
                    Delete Selected
                </Button>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination count={totalPages} page={page} onChange={handleChangePage} />
            </Box>
        </Paper>

    );
};

export default MetadataSchemas;
