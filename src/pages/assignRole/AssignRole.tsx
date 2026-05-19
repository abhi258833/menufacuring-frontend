import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import {
    fetchSubmitterGroup,
    createSubmitterGroup,
    deleteSubmitterGroup,
    fetchReviewerGroup,
    createReviewerGroup,
    deleteReviewerGroup,
    fetchEditorGroup,
    createEditorGroup,
    deleteEditorGroup,
    fetchFinalEditorGroup,
    createFinalEditorGroup,
    deleteFinalEditorGroup,
    Group,
} from '../../api/assignRole'
import { showToast } from '../../contexts/ToastProvider'
import Loader from '../loader/loader'

type RoleType = 'submitter' | 'reviewer' | 'editor' | 'finalEditor'

type GroupState = Record<RoleType, Group | null>

type LoadingState = Record<RoleType, boolean>

type ErrorState = Record<RoleType, string | null>

const AssignRole: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [groups, setGroups] = useState<GroupState>({
        submitter: null,
        reviewer: null,
        editor: null,
        finalEditor: null,
    })

    const [loading, setLoading] = useState<LoadingState>({
        submitter: false,
        reviewer: false,
        editor: false,
        finalEditor: false,
    })

    const [error, setError] = useState<ErrorState>({
        submitter: null,
        reviewer: null,
        editor: null,
        finalEditor: null,
    })

    const [pageLoading, setPageLoading] = useState(true)
    const [openDialog, setOpenDialog] = useState(false)
    const [dialogType, setDialogType] = useState<RoleType | null>(null)

    // Fetch all groups on component mount
    useEffect(() => {
        fetchAllGroups()
    }, [id])

    const fetchAllGroups = async () => {
        if (!id) return

        setPageLoading(true)
        try {
            const [submitterG, reviewerG, editorG, finalEditorG] = await Promise.all([
                fetchSubmitterGroup(id),
                fetchReviewerGroup(id),
                fetchEditorGroup(id),
                fetchFinalEditorGroup(id),
            ])

            setGroups({
                submitter: submitterG,
                reviewer: reviewerG,
                editor: editorG,
                finalEditor: finalEditorG,
            })
        } catch (err: any) {
            console.error('Error fetching groups:', err)
            showToast('Error loading role groups', 'error')
        } finally {
            setPageLoading(false)
        }
    }

    const handleOpenDialog = (type: RoleType) => {
        setDialogType(type)
        setOpenDialog(true)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setDialogType(null)
    }

    const handleCreateGroup = async () => {
        if (!id || !dialogType) return

        setLoading({ ...loading, [dialogType]: true })
        try {
            let newGroup: Group

            switch (dialogType) {
                case 'submitter':
                    newGroup = await createSubmitterGroup(id, `${dialogType} group`)
                    break
                case 'reviewer':
                    newGroup = await createReviewerGroup(id, `${dialogType} group`)
                    break
                case 'editor':
                    newGroup = await createEditorGroup(id, `${dialogType} group`)
                    break
                case 'finalEditor':
                    newGroup = await createFinalEditorGroup(id, `${dialogType} group`)
                    break
                default:
                    return
            }

            setGroups({ ...groups, [dialogType]: newGroup })
            handleCloseDialog()
        } catch (err: any) {
            console.error(`Error creating ${dialogType} group:`, err)
        } finally {
            setLoading({ ...loading, [dialogType]: false })
        }
    }

    const handleDeleteGroup = async (type: RoleType) => {
        if (!id) return

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the ${type} group? This action cannot be undone.`
        )

        if (!confirmDelete) return

        setLoading({ ...loading, [type]: true })
        try {
            switch (type) {
                case 'submitter':
                    await deleteSubmitterGroup(id)
                    break
                case 'reviewer':
                    await deleteReviewerGroup(id)
                    break
                case 'editor':
                    await deleteEditorGroup(id)
                    break
                case 'finalEditor':
                    await deleteFinalEditorGroup(id)
                    break
            }

            setGroups({ ...groups, [type]: null })
        } catch (err: any) {
            console.error(`Error deleting ${type} group:`, err)
        } finally {
            setLoading({ ...loading, [type]: false })
        }
    }

    const renderGroupCard = (
        type: RoleType,
        title: string,
        color: 'info' | 'success' | 'warning' | 'error'
    ) => {
        const group = groups[type]
        const isLoading = loading[type]

        return (
            <Grid item xs={12} md={6} key={type}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader
                        title={title}
                        titleTypographyProps={{ variant: 'h6' }}
                        sx={{ backgroundColor: `${color}.light`, pb: 1 }}
                    />
                    <CardContent>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress size={40} />
                            </Box>
                        ) : group ? (
                            <Box>
                                <Typography variant='body2' sx={{ mb: 2 }}>
                                    <strong>Group Name:</strong> {group.name}
                                </Typography>
                                {group.metadata?.['dc.description'] && (
                                    <Typography variant='body2' sx={{ mb: 2, color: '#666' }}>
                                        <strong>Description:</strong>{' '}
                                        {group.metadata['dc.description'][0]?.value || 'N/A'}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant='outlined'
                                        color='error'
                                        size='small'
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleDeleteGroup(type)}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box>
                                <Typography
                                    variant='body2'
                                    sx={{ mb: 2, color: '#999', fontStyle: 'italic' }}
                                >
                                    No {title.toLowerCase()} group assigned
                                </Typography>
                                <Button
                                    variant='contained'
                                    color={color}
                                    size='small'
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog(type)}
                                >
                                    Create Group
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        )
    }

    if (pageLoading) {
        return (
            <Container maxWidth='lg' sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <Loader />
                </Box>
            </Container>
        )
    }

    return (
        <Container maxWidth='lg' sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    variant='text'
                    onClick={() => navigate(-1)}
                    sx={{ mb: 2 }}
                >
                    ← Back
                </Button>
                <Typography variant='h4' sx={{ mb: 1, fontWeight: 600 }}>
                    Assign Roles to Collection
                </Typography>
                <Typography variant='body1' sx={{ color: '#666' }}>
                    Manage workflow roles for this collection by creating and assigning groups
                </Typography>
            </Box>

            {/* Info Alert */}
            <Alert severity='info' sx={{ mb: 4 }}>
                Each role can have one group assigned. Create or delete groups to manage who can
                perform specific workflow tasks in this collection.
            </Alert>

            {/* Role Cards Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {renderGroupCard('submitter', 'Submitter', 'info')}
                {renderGroupCard('reviewer', 'Reviewer', 'success')}
                {renderGroupCard('editor', 'Editor', 'warning')}
                {renderGroupCard('finalEditor', 'Final Editor', 'error')}
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant='contained'
                    onClick={() => navigate(-1)}
                >
                    Back to Collection
                </Button>
                <Button
                    variant='outlined'
                    onClick={fetchAllGroups}
                >
                    Refresh
                </Button>
            </Box>

            {/* Create Group Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
                <DialogTitle>
                    Create {dialogType ? dialogType.charAt(0).toUpperCase() + dialogType.slice(1) : ''}{' '}
                    Group
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant='body2' sx={{ mb: 2, color: '#666' }}>
                        Are you sure you want to create a new {dialogType} group for this collection?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} variant='outlined'>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateGroup}
                        variant='contained'
                        disabled={dialogType ? loading[dialogType] : false}
                    >
                        {dialogType && loading[dialogType] ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}

export default AssignRole
