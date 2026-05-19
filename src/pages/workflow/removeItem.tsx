import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Stack
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { getWorkspaceItem, removeWorkspaceItem } from '../../api/workflow'
import { useParams, useNavigate } from 'react-router-dom'
import { WorkspaceMetedata } from '../../data/workflowdata'
import Loader from '../loader/loader'

const RemoveItem = () => {
    const [workspace, setWorkspace] = useState<WorkspaceMetedata | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchWorkspaceItem = async () => {
            setLoading(true)
            try {
                if (!id) return
                const response = await getWorkspaceItem(id)
                if (response) {
                    setWorkspace(response)
                }
            } catch (error) {
                console.error('Error fetching workspace item:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchWorkspaceItem()
    }, [id])

    const handleCancel = () => {
        navigate(-1)
    }

    const handleDelete = async () => {
        if (!workspace) return

        try {
            setLoading(true)
            if (!id) return;
            await removeWorkspaceItem(id)
            navigate('/workflowSearch')
        } catch (error) {
            console.error('Error deleting workspace item:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!workspace) return null

    return (
        <Container maxWidth="lg">
            <Typography variant='h4' sx={{ marginBottom: 3 }}>Workspace Item Details</Typography>

            {loading ? (
                <Loader />
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>


                                {/* Metadata */}
                                {Object.entries(workspace.metadata).map(([field, values]) => (
                                    values.map((valueObj, index) => (
                                        <TableRow key={`${field}-${index}`}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{field}</TableCell>
                                            <TableCell>
                                                <Typography>{valueObj.value}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setDeleteModalOpen(true)}
                            disabled={loading}
                        >
                            Delete Workspace
                        </Button>
                    </Stack>

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                    >
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to delete this workspace item? This action cannot be undone.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => setDeleteModalOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                color="error"
                                autoFocus
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Container>
    )
}

export default RemoveItem