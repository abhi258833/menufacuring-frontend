import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Pagination,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { fetchSubCommunities } from '../../api/communities';
import SubCommunity from './SubCommunity';
import Loader from '../loader/loader';

interface SubCommunityItem {
    uuid: string;
    name: string;
    handle: string;
    metadata?: {
        "dc.title"?: Array<{ value: string }>;
        "dc.description"?: Array<{ value: string }>;
    };
    type: string;
}

interface SubCommunitiesResponse {
    _embedded?: {
        subcommunities: SubCommunityItem[];
    };
    page?: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}

interface SubCommunitiesListProps {
    parentCommunityId: string;
    onRefresh?: () => void;
}

const SubCommunitiesList: React.FC<SubCommunitiesListProps> = ({ parentCommunityId, onRefresh }) => {
    const [subCommunities, setSubCommunities] = useState<SubCommunityItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const pageSize = 12;

    const loadSubCommunities = async () => {
        setLoading(true);
        try {
            const data = await fetchSubCommunities(parentCommunityId, page, pageSize) as SubCommunitiesResponse;
            setSubCommunities(data._embedded?.subcommunities || []);
            setTotalPages(data.page?.totalPages || 1);
        } catch (error) {
            console.error('Error loading subcommunities:', error);
            setSubCommunities([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubCommunities();
    }, [parentCommunityId, page]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value - 1);
    };

    const handleSubCommunityCreated = () => {
        setShowModal(false);
        loadSubCommunities();
        onRefresh?.();
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Sub-Communities
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setShowModal(true)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold',
                    }}
                >
                    Create Sub-Community
                </Button>
            </Box>

            {loading && <Loader />}

            {!loading && subCommunities.length === 0 ? (
                <Card sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                        No sub-communities yet. Click the button above to create one!
                    </Typography>
                </Card>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {subCommunities.map((subCom) => (
                            <Grid item xs={12} sm={6} md={4} key={subCom.uuid}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <CardHeader
                                        title={subCom.name}
                                        sx={{
                                            backgroundColor: '#f5f5f5',
                                            '& .MuiCardHeader-title': {
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold',
                                                color: '#333',
                                            },
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        {subCom.metadata?.["dc.description"]?.[0]?.value && (
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                                {subCom.metadata["dc.description"][0].value}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color="textSecondary">
                                            Handle: {subCom.handle}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            UUID: {subCom.uuid.substring(0, 8)}...
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page + 1}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            )}

            <SubCommunity
                open={showModal}
                handleClose={() => setShowModal(false)}
                parentCommunityId={parentCommunityId}
                onSubCommunityCreated={handleSubCommunityCreated}
            />
        </Box>
    );
};

export default SubCommunitiesList;
