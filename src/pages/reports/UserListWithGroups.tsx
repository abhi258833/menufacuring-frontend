import React, { useCallback, useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, Pagination, Button,
    CircularProgress,
    Container,
    Grid
} from "@mui/material";
import axios from "axios";
import { userList } from "../../api/usermanagement";
import { SaveAlt as DownloadIcon } from "@mui/icons-material";
import Loader from "../loader/loader";

interface EpersonMetadata {
    [key: string]: {
        value: string;
        language: string | null;
        authority: string | null;
        confidence: number;
        place: number;
    }[];
}

export interface Eperson {
    id: string;
    uuid: string;
    name: string;
    email: string;
    metadata: EpersonMetadata;
    _links: {
        groups: {
            href: string;
        };
    };
}

interface Group {
    name?: string;
    metadata?: {
        ["dc.title"]?: { value: string }[];
    };
}

interface GroupApiResponse {
    _embedded?: {
        groups?: Group[];
    };
}

const UserListTable: React.FC = () => {
    const [users, setUsers] = useState<Eperson[]>([]);
    const [groupMap, setGroupMap] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [csvLoading, setCsvLoading] = useState<boolean>(false);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [page, setPage] = useState<number>(1);
    const size = 10;

    const fetchUsers = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await userList(page - 1, size, "");
            const realUsers = data.epersons as Eperson[];
            setUsers(realUsers);
            setTotalPages(data.totalPages);

            const csrfToken = localStorage.getItem("csrfToken");
            const authToken = localStorage.getItem("authToken");

            const groupPromises = realUsers.map(async (user) => {
                const response = await axios.get(user._links.groups.href, {
                    headers: {
                        "Content-Type": "application/json",
                        "X-XSRF-TOKEN": csrfToken,
                        Authorization: authToken,
                    },
                    withCredentials: true,
                });

                const groupData = response.data as GroupApiResponse;
                const groupNames: string[] =
                    groupData._embedded?.groups?.map(
                        (group) =>
                            group.metadata?.["dc.title"]?.[0]?.value ||
                            group.name ||
                            "Unnamed Group"
                    ) || [];

                return { id: user.id, groupNames };
            });

            const resolvedGroups = await Promise.all(groupPromises);
            const groupMapData: Record<string, string[]> = {};
            resolvedGroups.forEach(({ id, groupNames }) => {
                groupMapData[id] = groupNames;
            });
            setGroupMap(groupMapData);
        } catch (error) {
            console.error("Error fetching users or groups:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(page);
    }, [page, fetchUsers]);

    const handleChangePage = (_: React.ChangeEvent<unknown>, newPage: number) => {
        setPage(newPage);
    };

    const fetchAllUsers = async () => {
        const csrfToken = localStorage.getItem("csrfToken");
        const authToken = localStorage.getItem("authToken");
        const allUsers: Eperson[] = [];
        const allGroupMap: Record<string, string[]> = {};

        const firstPageData = await userList(0, size, "");
        const totalPages = firstPageData.totalPages;

        for (let p = 0; p < totalPages; p++) {
            const data = p === 0 ? firstPageData : await userList(p, size, "");
            const realUsers = data.epersons as Eperson[];
            allUsers.push(...realUsers);

            const groupPromises = realUsers.map(async (user) => {
                const response = await axios.get(user._links.groups.href, {
                    headers: {
                        "Content-Type": "application/json",
                        "X-XSRF-TOKEN": csrfToken,
                        Authorization: authToken,
                    },
                    withCredentials: true,
                });

                const groupData = response.data as GroupApiResponse;
                const groupNames: string[] =
                    groupData._embedded?.groups?.map(
                        (group) =>
                            group.metadata?.["dc.title"]?.[0]?.value ||
                            group.name ||
                            "Unnamed Group"
                    ) || [];

                return { id: user.id, groupNames };
            });

            const resolvedGroups = await Promise.all(groupPromises);
            resolvedGroups.forEach(({ id, groupNames }) => {
                allGroupMap[id] = groupNames;
            });
        }

        return { allUsers, allGroupMap };
    };

    const downloadCSV = async () => {
        setCsvLoading(true);
        try {
            const { allUsers, allGroupMap } = await fetchAllUsers();

            const headers = ["Name", "Email", "Groups"];
            const rows = allUsers.map((user) => {
                const firstName = user.metadata?.["eperson.firstname"]?.[0]?.value || "";
                const lastName = user.metadata?.["eperson.lastname"]?.[0]?.value || "";
                const fullName = `${firstName} ${lastName}`.trim() || user.name;
                const email = user.email;
                const groups = allGroupMap[user.id]?.join(", ") || "No Groups";

                return [fullName, email, groups];
            });

            const csvContent = [
                headers.join(","),
                ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "user_list.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading CSV:", error);
        } finally {
            setCsvLoading(false);
        }
    };

    return (
        <Container className="top_padding">
            <Grid container justifyContent="space-between" alignItems="center" className="header_epeople">
                <Typography variant="h4" sx={{ mb: 1 }}>
                    User List
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={downloadCSV}
                    disabled={csvLoading}
                    sx={{ mb: 1 }}
                >
                    {csvLoading ? <Loader /> : "Download CSV"}
                </Button>
            </Grid>

            {loading ? (
                <CircularProgress sx={{ display: "block", margin: "auto", my: 3 }} />
            ) : (
                <>
                    <TableContainer
                        component={Paper}
                        sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell><strong>First Name</strong></TableCell>
                                    <TableCell><strong>Last Name</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Groups</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => {
                                    const firstName = user.metadata?.["eperson.firstname"]?.[0]?.value || "N/A";
                                    const lastName = user.metadata?.["eperson.lastname"]?.[0]?.value || "N/A";
                                    const groups = groupMap[user.id] || [];

                                    return (
                                        <TableRow
                                            key={user.id}
                                            sx={{
                                                "&:hover": { backgroundColor: "#f0f0f0" },
                                                cursor: "default",
                                            }}
                                        >
                                            <TableCell>{firstName}</TableCell>
                                            <TableCell>{lastName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{groups.join(", ") || "No Groups"}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handleChangePage}
                        sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 3 }}
                    />
                </>
            )}
        </Container>

    );
};

export default UserListTable;
