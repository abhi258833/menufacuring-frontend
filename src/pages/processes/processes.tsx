import React from 'react'
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, Pagination, Button,
    CircularProgress,
    Container,
    Grid, IconButton, Box, Tabs, Tab
    , Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import {
    failedProcess,
    runningProcess,
    scheduledProcess,
    completedProcess,
    removeProcess
} from '../../api/processes';
import { iconsImgs } from '../../utils/images';
import { useNavigate } from 'react-router-dom';

function Processes() {
    const [activeTab, setActiveTab] = React.useState<number>(0);
    const [failedProcesses, setFailedProcesses] = React.useState<any>([]);
    const [runningProcesses, setRunningProcesses] = React.useState<any>([]);
    const [scheduledProcesses, setScheduledProcesses] = React.useState<any>([]);
    const [completedProcesses, setCompletedProcesses] = React.useState<any>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [failedTotalPages, setFailedTotalPages] = React.useState<number>(1);
    const [runningTotalPages, setRunningTotalPages] = React.useState<number>(1);
    const [scheduledTotalPages, setScheduledTotalPages] = React.useState<number>(1);
    const [completedTotalPages, setCompletedTotalPages] = React.useState<number>(1);
    const [page, setPage] = React.useState<number>(1);
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [selectedProcessId, setSelectedProcessId] = React.useState<number | null>(null);
    const navigate = useNavigate();


    const fetchFailedProcess = async () => {
        setLoading(true);
        const { processes, totalPages } = await failedProcess(page - 1, 5);
        setFailedProcesses(processes || []);
        setFailedTotalPages(totalPages);
        setLoading(false);
    };

    const fetchRunningProcess = async () => {
        setLoading(true);
        const { processes, totalPages } = await runningProcess(page - 1, 5);
        setRunningProcesses(processes || []);
        setRunningTotalPages(totalPages);
        setLoading(false);
    };

    const fetchScheduledProcess = async () => {
        setLoading(true);
        const { processes, totalPages } = await scheduledProcess(page - 1, 5);
        setScheduledProcesses(processes || []);
        setScheduledTotalPages(totalPages);
        setLoading(false);
    };

    const fetchCompletedProcess = async () => {
        setLoading(true);
        const { processes, totalPages } = await completedProcess(page - 1, 5);
        setCompletedProcesses(processes || []);
        setCompletedTotalPages(totalPages);
        setLoading(false);
    };

    React.useEffect(() => {
        switch (activeTab) {
            case 0:
                fetchCompletedProcess();
                break;
            case 1:
                fetchRunningProcess();
                break;
            case 2:
                fetchScheduledProcess();
                break;
            case 3:
                fetchFailedProcess();
                break;

        }
    }, [page, activeTab]);

    const handleDeletClick = async (processId: number) => {
        setSelectedProcessId(processId);
        setDeleteModalOpen(true);
    }

    const handleConfirmDelete = async () => {
    if (selectedProcessId === null) {
        setDeleteModalOpen(false);
        return;
    }

    try {
        setLoading(true);
        await removeProcess(selectedProcessId);
        
        switch (activeTab) {
            case 0:
                await fetchCompletedProcess();
                break;
            case 1:
                await fetchRunningProcess();
                break;
            case 2:
                await fetchScheduledProcess();
                break;
            case 3:
               await fetchFailedProcess();
                break;
        }
    } catch (error) {
        console.error("Error deleting process:", error);
    } finally {
        setLoading(false);
        setDeleteModalOpen(false);
        setSelectedProcessId(null);
    }
}
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
    };
    const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setPage(1); 
    };

    const renderEmptyState = () => (
        <Box sx={{
            p: 3,
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f5f5f5'
        }}>
            <Typography variant="body1">No processes found</Typography>
        </Box>
    );


    const renderProcessTable = (processes: any[], showEndTime: boolean = true) => {

        if (processes.length === 0) {
            return renderEmptyState();
        }

        return (
            <TableContainer
                component={Paper}
                sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><strong>Process ID</strong></TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            {showEndTime && <TableCell><strong>Finish time (UTC)</strong></TableCell>}
                            <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {processes.map((process: any) => {
                            const Process_ID = process.processId;
                            const Name = process.scriptName;
                            const timeField = showEndTime ? process.endTime : process.creationTime;
                            const Formatted_time = new Date(timeField).toLocaleString("en-US", {
                                timeZone: "UTC",
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            });

                            return (
                               <TableRow
  key={Process_ID}
  sx={{
      "&:hover": { backgroundColor: "#f0f0f0" },
      cursor: "pointer",   // 👈 change to pointer
  }}
  onClick={() => navigate(`/process/${Process_ID}`)}   // 👈 redirect to detail page
>
    <TableCell>{Process_ID}</TableCell>
    <TableCell>{Name}</TableCell>
    <TableCell>{Formatted_time}</TableCell>
    <TableCell>
        <IconButton
            className='btn_table'
            color="error"
            title="Delete"
            onClick={(e) => {
                e.stopPropagation(); // 👈 prevent row click
                handleDeletClick(Process_ID);
            }}
        >
            <img className="table_icon" src={iconsImgs.remove} alt="Remove" />
        </IconButton>
    </TableCell>
</TableRow>

                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderPagination = (totalPages: number) => {
        if (totalPages > 1) {
            return (
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 3 }}
                />
            );
        }
        return null;
    };

    return (
        <Container className="top_padding">
            <Grid container justifyContent="space-between" alignItems="center" className="header_epeople">
                <Typography variant="h4" sx={{ mb: 1 }}>
                    Processes Overview
                </Typography>
            </Grid>

            <Box sx={{ width: '100%', mt: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="process tabs">
                    <Tab label="Completed" />
                    <Tab label="Running" />
                    <Tab label="Scheduled" />
                    <Tab label="Failed" />
                </Tabs>
            </Box>

            {loading ? (
                <CircularProgress sx={{ display: "block", margin: "auto", my: 3 }} />
            ) : (
                <>
                    {activeTab === 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Completed Processes
                            </Typography>
                            {renderProcessTable(completedProcesses)}
                            {renderPagination(completedTotalPages)}
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Running Processes
                            </Typography>
                            {renderProcessTable(runningProcesses, false)}
                            {renderPagination(runningTotalPages)}
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Scheduled Processes
                            </Typography>
                            {renderProcessTable(scheduledProcesses, false)}
                            {renderPagination(scheduledTotalPages)}
                        </Box>
                    )}

                    {activeTab === 3 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Failed Processes
                            </Typography>
                            {renderProcessTable(failedProcesses)}
                            {renderPagination(failedTotalPages)}
                        </Box>
                    )}
                </>
            )}
            <Dialog
                open={deleteModalOpen}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete  process {selectedProcessId}?
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
    )
}

export default Processes