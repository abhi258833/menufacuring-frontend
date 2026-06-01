import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/Search';
import { AnimatePresence, motion } from 'framer-motion';
import { advancedSearchFields, AdvancedFilter } from '../../data/searchData';
import { fetchFacet } from '../../api/searchApi';
import { useRef } from 'react';
import { AddBox, AddBoxRounded, AddBoxSharp, AddIcCallRounded } from '@mui/icons-material';
import { fetchCollections } from '../../api/collection';

const resourceTypeOptions = [
  { label: 'Resource Type', value: 'all' },
];

const selectMenuProps = {
  disableScrollLock: true,
  PaperProps: {
    sx: {
      maxHeight: 260,
      overflowY: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      '& .MuiList-root': {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingTop: 0,
        paddingBottom: 0,
      },
      '& .MuiList-root::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
};

type AdvancedSearchPayload = {
  resourceType: string;
  scope?: string;
  collectionName?: string;
  advancedFilters: AdvancedFilter[];
};

interface AdvancedSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSearch: (payload: AdvancedSearchPayload) => void;
}

const defaultFieldId = advancedSearchFields[0]?.id || 'title';
const suggestionEnabledFields = new Set(
  advancedSearchFields
    .filter((field) => field.id !== 'date')
    .map((field) => field.id)
);

const AdvancedSearchDialog: React.FC<AdvancedSearchDialogProps> = ({ open, onClose, onSearch }) => {
  const valueWrapperRef = useRef<HTMLDivElement | null>(null);
  const [resourceType, setResourceType] = useState('all');
  const [collectionScope, setCollectionScope] = useState('all');
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [field, setField] = useState(defaultFieldId);
  const [operator, setOperator] = useState(advancedSearchFields[0]?.operators[0]?.apiValue || 'equals');
  const [value, setValue] = useState('');
  const [filters, setFilters] = useState<AdvancedFilter[]>([]);
  const [suggestions, setSuggestions] = useState<{ field: string; values: Array<{ label: string; count: number }> }>({ field: '', values: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const selectedField = useMemo(
    () => advancedSearchFields.find((item) => item.id === field) || advancedSearchFields[0],
    [field]
  );

  useEffect(() => {
    const nextOperator = selectedField?.operators[0]?.apiValue || 'equals';
    if (!selectedField?.operators.some((item) => item.apiValue === operator)) {
      setOperator(nextOperator);
    }
  }, [field, operator, selectedField]);

  useEffect(() => {
    const loadCollections = async () => {
      const result = await fetchCollections();
      setCollections(result.map((item) => ({ id: item.id, name: item.name })));
    };

    if (open) {
      loadCollections();
    }
  }, [open]);

  const fetchSuggestions = async (fieldName: string, query: string) => {
    if (!query || query.length < 2) {
      setSuggestions({ field: '', values: [] });
      setShowSuggestions(false);
      return;
    }

    try {
      const facetName = advancedSearchFields.find((item) => item.id === fieldName)?.fieldName || fieldName;
      const suggestionResults = await fetchFacet(
        facetName,
        {
          query: '',
          page: 0,
          size: 5,
          resourceType,
        },
        0,
        5,
        query
      );

      setSuggestions({
        field: fieldName,
        values: suggestionResults.map((item) => ({ label: item.label, count: item.count })),
      });
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching advanced search suggestions:', error);
      setSuggestions({ field: '', values: [] });
      setShowSuggestions(false);
    }
  };

  const appendFilter = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return filters;
    }

    const nextFilters = [
      ...filters,
      {
        id: Date.now().toString(),
        field,
        operator,
        value: trimmedValue,
      },
    ];

    setFilters(nextFilters);
    setValue('');
    return nextFilters;
  };

  const handleAddFilter = () => {
    appendFilter();
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters((currentFilters) => currentFilters.filter((item) => item.id !== filterId));
  };

  const handleReset = () => {
    setResourceType('all');
    setCollectionScope('all');
    setField(defaultFieldId);
    setOperator(advancedSearchFields[0]?.operators[0]?.apiValue || 'equals');
    setValue('');
    setFilters([]);
    setSuggestions({ field: '', values: [] });
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    const nextFilters = value.trim() ? appendFilter() : filters;
    const selectedCollectionName =
      collectionScope !== 'all'
        ? collections.find((collection) => collection.id === collectionScope)?.name
        : undefined;

    onSearch({
      resourceType,
      scope: collectionScope !== 'all' ? collectionScope : undefined,
      collectionName: selectedCollectionName,
      advancedFilters: nextFilters,
    });
  };

  const currentOperators = selectedField?.operators || [];
  const suggestionsVisible = showSuggestions && suggestions.field === field && suggestions.values.length > 0;
  const suggestionAnchorEl = valueWrapperRef.current;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0, scaleY: 0.95 }}
          animate={{ height: 'auto', opacity: 1, scaleY: 1 }}
          exit={{ height: 0, opacity: 0, scaleY: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            mass: 0.8,
          }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            zIndex: 1600,
            width: 'min(680px, calc(100vw - 24px))',
            transformOrigin: 'top center',
            willChange: 'transform, opacity, height',
            transform: 'translateZ(0)',
          }}
        >
          <Paper
            className="advanced-search-dialog"
            elevation={0}
            sx={{
              overflow: 'visible',
              border: '1px solid #e5e7eb',
              boxShadow: '0 22px 60px rgba(15, 23, 42, 0.18)',
              bgcolor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <Box sx={{ position: 'relative', p: { xs: 1.75, md: 2.5 } }}>
            <IconButton
              onClick={onClose}
              aria-label="Close advanced search"
              sx={{
                position: 'absolute',
                right: 14,
                top: 14,
                color: '#1f2937',
                bgcolor: '#ffffff',
                border: '1px solid #d9e1e8',
                '&:hover': {
                  bgcolor: '#f8fafc',
                },
              }}
            >
              <CloseIcon />
            </IconButton>

            <Typography
              sx={{
                fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                fontSize: { xs: '0.9rem', md: '0.9rem' },
                color: '#111827',
                pr: 5,
                lineHeight: 1.45,
                maxWidth: '54rem',
              }}
            >
              Advanced Search is useful for more specific search options.
              <br />
              You can use a single or a combination of fields to perform Advanced Search.
            </Typography>

            <Stack spacing={1.75} sx={{ mt: 2.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '260px 1fr' },
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                <Select
                  value={resourceType}
                  onChange={(event) => setResourceType(event.target.value)}
                  MenuProps={selectMenuProps}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected === 'all') {
                      return 'Resource Type';
                    }

                    return resourceTypeOptions.find((option) => option.value === selected)?.label || selected;
                  }}
                  sx={{
                    height: 42,
                    bgcolor: '#ffffff',
                    borderRadius: 0,
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontSize: 14,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d8e2ea',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#b9c8d3',
                    },
                  }}
                >
                  {resourceTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>

                <Select
                  value={collectionScope}
                  onChange={(event) => setCollectionScope(event.target.value as string)}
                  MenuProps={selectMenuProps}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected === 'all') {
                      return 'All Collections';
                    }

                    return collections.find((collection) => collection.id === selected)?.name || selected;
                  }}
                  sx={{
                    height: 42,
                    bgcolor: '#ffffff',
                    borderRadius: 0,
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontSize: 14,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d8e2ea',
                    },
                  }}
                >
                  <MenuItem value="all">All Collections</MenuItem>
                  {collections.map((collection) => (
                    <MenuItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {filters.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ pt: 0.5 }}>
                  {filters.map((filter) => {
                    const filterField = advancedSearchFields.find((item) => item.id === filter.field);
                    const fieldLabel = filterField?.label || filter.field;
                    const operatorLabel = filterField?.operators.find((item) => item.apiValue === filter.operator)?.label || filter.operator;

                    return (
                      <Chip
                        key={filter.id}
                        label={`${fieldLabel} ${operatorLabel} ${filter.value}`}
                        onDelete={() => handleRemoveFilter(filter.id || '')}
                        sx={{
                          borderRadius: 999,
                          bgcolor: '#fff7ed',
                          color: '#92400e',
                          border: '1px solid #fdba74',
                          fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                          fontWeight: 600,
                        }}
                      />
                    );
                  })}
                </Stack>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '180px 150px 1fr 80px' },
                  gap: 1.5,
                  alignItems: 'center',
                  '& > *': {
                    minWidth: 0,
                  },
                }}
              >
                <Select
                  value={field}
                  onChange={(event) => setField(event.target.value)}
                  MenuProps={selectMenuProps}
                  fullWidth
                  sx={{
                    height: 42,
                    bgcolor: '#ffffff',
                    borderRadius: 0,
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontSize: 14,
                    minWidth: 0,
                    '& .MuiSelect-select': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d8e2ea',
                    },
                  }}
                >
                  {advancedSearchFields.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>

                <Select
                  value={operator}
                  onChange={(event) => setOperator(event.target.value)}
                  MenuProps={selectMenuProps}
                  fullWidth
                  sx={{
                    height: 42,
                    bgcolor: '#ffffff',
                    borderRadius: 0,
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontSize: 14,
                    minWidth: 0,
                    '& .MuiSelect-select': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d8e2ea',
                    },
                  }}
                >
                  {currentOperators.map((option) => (
                    <MenuItem key={option.id} value={option.apiValue}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>

                <Box ref={valueWrapperRef} sx={{ position: 'relative', width: '100%', minWidth: 0 }}>
                  <TextField
                    name="advanced-search-value"
                    autoComplete="off"
                    inputProps={{
                      autoComplete: 'new-password',
                      autoCorrect: 'off',
                      autoCapitalize: 'none',
                      spellCheck: false,
                    }}
                    value={value}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setValue(nextValue);

                      if (suggestionEnabledFields.has(field)) {
                        fetchSuggestions(field, nextValue);
                      } else {
                        setShowSuggestions(false);
                        setSuggestions({ field: '', values: [] });
                      }
                    }}
                    onFocus={() => {
                      if (value.length > 1 && suggestionEnabledFields.has(field)) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Enter value"
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        height: 42,
                        borderRadius: 0,
                        bgcolor: '#ffffff',
                        fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                        fontSize: 14,
                      },
                      '& .MuiInputBase-input': {
                        paddingTop: '9px',
                        paddingBottom: '9px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#d8e2ea',
                      },
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        setShowSuggestions(false);
                        handleAddFilter();
                      }
                    }}
                  />

                  {Boolean(suggestionAnchorEl) && suggestionsVisible && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 1700,
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          width: '100%',
                          maxHeight: 176,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          bgcolor: '#ffffff',
                          border: '1px solid #d8e2ea',
                          borderRadius: 0,
                          boxShadow: '0 10px 20px rgba(15, 23, 42, 0.10)',
                          overscrollBehavior: 'contain',
                          scrollbarGutter: 'stable',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          '&::-webkit-scrollbar': {
                            display: 'none',
                          },
                        }}
                      >
                        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                          {suggestions.values.map((suggestion, index) => (
                            <Box
                              component="li"
                              key={`${suggestion.label}-${index}`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setValue(suggestion.label);
                                setShowSuggestions(false);
                              }}
                              sx={{
                                px: 1.5,
                                py: 0.95,
                                cursor: 'pointer',
                                fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                                minHeight: 40,
                                borderBottom: index === suggestions.values.length - 1 ? 'none' : '1px solid #eef2f5',
                                '&:hover': {
                                  bgcolor: '#f8fafc',
                                },
                              }}
                            >
                              <span>{suggestion.label}</span>
                              <span style={{ color: '#6b7280', fontWeight: 600 }}>
                                {suggestion.count}
                              </span>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  )}
                </Box>

                <Button
                  onClick={handleAddFilter}
                  variant="outlined"
                  startIcon={<AddBoxSharp />}
                  sx={{
                    minWidth: 80,
                    height: 41,
                    borderRadius: 0,
                    borderColor: '#fb923c',
                    color: '#c2410c',
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 300,
                    bgcolor: '#ffffff',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: '#ea580c',
                      bgcolor: '#fff7ed',
                    },
                  }}
                >
                Add
                </Button>
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ pt: 0.5 }}>
                <Button
                  onClick={handleReset}
                  variant="contained"
                  sx={{
                    minWidth: 110,
                    height: 44,
                    borderRadius: 0,
                    bgcolor: '#d97706',
                    color: '#ffffff',
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 700,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#b45309',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSearch}
                  variant="contained"
                  startIcon={<SearchIcon />}
                  sx={{
                    minWidth: 126,
                    height: 44,
                    borderRadius: 0,
                    bgcolor: '#d97706',
                    color: '#ffffff',
                    fontFamily: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 700,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#b45309',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Search
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdvancedSearchDialog;
