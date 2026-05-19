import React, { useEffect, useState } from 'react';
import { Modal, Box, TextField, Typography, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchCommunities } from '../../api/selectCommunity';
import PaginationComponent from '../../components/Pagination/PaginationComponent';
import './collection.css';
import CreateCollectionModal from './createCollection';

interface Community {
  id: string;
  metadata: {
    [key: string]: Array<{ value: string }>;
  };
}

interface SelectCommunityModalProps {
  open: boolean;
  onClose: () => void;
}

const SelectCommunityModal: React.FC<SelectCommunityModalProps> = ({ open, onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

useEffect(() => {
  fetchData(0, size, searchText)}, [open]);
  const fetchData = async (page: number, size: number, searchValue: string = '') => {
    try {
      setLoading(true);
      const data = await fetchCommunities(page, size, searchValue);
      setCommunities(data?.communities || []);
      setTotalData(data?.totalElements || 0);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchData(page, size, searchText);
    }, 500);
    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [page, size, searchText]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const getMetadataValue = (metadata: Community['metadata'], field: string): string | null => {
    return metadata?.[field]?.[0]?.value || null;
  };

  const handleSelect = (community: Community) => {
    setSelectedCommunity(community);
    setModalOpen(true); // Open CreateCollectionModal
  };

  const handleCollectionModalClose = () => {
    setModalOpen(false);
    setSelectedCommunity(null);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box className="modal-style" sx={{ position: 'relative' }}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h5" gutterBottom>
            New Collection
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Create a new collection in
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search communities..."
            value={searchText}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : (
            <div className="list-container">
              {communities.map((community, index) => (
                <div
                  key={index}
                  className="option-items cursor-pointer"
                  onClick={() => handleSelect(community)}
                >
                  <div className="option-item">
                    {getMetadataValue(community.metadata, 'dc.title')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pagination-container">
            <PaginationComponent
              totalData={totalData}
              perPage={size}
              currentPage={page + 1}
              onPageChange={handlePageChange}
            />
          </div>
        </Box>
      </Modal>

      {selectedCommunity && (
        <CreateCollectionModal
          open={modalOpen}
          onClose={handleCollectionModalClose}
          communityId={selectedCommunity.id}
          titleText={getMetadataValue(selectedCommunity.metadata, 'dc.title') || ''}
        />
      )}
    </>
  );
};

export default SelectCommunityModal;