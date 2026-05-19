import React, { useEffect, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupIcon from '@mui/icons-material/Group'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckboxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import { getWorkflowObject, parseSearchParamsFromUrl, updateUrlWithSearchParams, workflowFacets, removeWorkspaceItem } from '../../api/workflow'
import { FilterOption, FacetValue, SearchParams, WorkspaceItem } from '../../data/workflowdata'
import '../Search/Search.css'
import PaginationComponent from '../../components/Pagination/PaginationComponent'
import { resultsPerPageOptions, sortOptions } from '../../data/searchData'
import { useNavigate } from 'react-router-dom'
import Loader from '../loader/loader'
import { showToast } from '../../contexts/ToastProvider'

const Workflow = () => {
    const initialParams = parseSearchParamsFromUrl()
    const [inputValue, setInputValue] = useState<string>(initialParams.query || '')
    const [isLoading, setIsLoading] = useState(false)
    const [page, setPage] = useState<number>((initialParams.page ?? 0) + 1 || 1)
    const [size, setSize] = useState<number>(initialParams.size || resultsPerPageOptions[3].value)
    const [searchResults, setSearchResults] = useState<WorkspaceItem[]>([])
    const [totalData, setTotalData] = useState<number>(0)
    const [filters, setFilters] = useState<Record<string, any>>(initialParams.filters || {})
    const [facets, setFacets] = useState<Record<string, FacetValue[]>>({})
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
        FilterOption.reduce((acc, section) => {
            acc[section.id] = section.defaultExpanded
            return acc
        }, {} as Record<string, boolean>)
    )
    const [sortOption, setSortOption] = useState(sortOptions[0].value)
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
    const navigate = useNavigate()

    const fetchAllFacets = async (currentFilters: Record<string, any> = filters) => {
        try {
            const params: SearchParams = {
                query: inputValue,
                page: page - 1,
                size: size,
                filters: currentFilters,
                sort: getSortParam(),
            }
            const facetsResponse = await workflowFacets(params)
            setFacets(facetsResponse)
        } catch (error) {
            console.error('Error fetching facets:', error)
        }
    }

    const handleSearch = async (
        currentFilters: Record<string, any> = filters,
        currentPage: number = page,
        itemsPerPage: number = size,
        resetPage: boolean = false,
        sort: string = getSortParam(),
    ) => {
        setIsLoading(true)
        try {
            const pageToFetch = resetPage ? 1 : currentPage
            const params: SearchParams = {
                query: inputValue,
                page: pageToFetch - 1,
                size: itemsPerPage,
                sort: sort,
                filters: currentFilters,
            }

            updateUrlWithSearchParams(params)
            const result = await getWorkflowObject(params)

            if (result && result.objects) {
                setSearchResults(result.objects)
                setTotalData(result.totalElements)
                if (resetPage) {
                    setPage(1)
                }
            }

            await fetchAllFacets(currentFilters)
        } catch (error) {
            console.error('Error fetching data:', error)
            showToast('Failed to fetch workflow data', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        handleSearch()
    }, [])

    const getSortParam = (): string => {
        const option = sortOptions.find(opt => opt.value === sortOption)
        return option ? option.apiValue : 'score,DESC'
    }

    const resetFilters = () => {
        const newFilters = {}
        setFilters(newFilters)
        setInputValue('')
        setSortOption(sortOptions[0].value)
        handleSearch(newFilters, 1, size, true)
    }

    const updateFilter = (filterType: string, value: any, isChecked: boolean) => {
        setFilters(prev => {
            let newValue
            const section = FilterOption.find(s => s.id === filterType)

            if (!section) return prev

            if (section.filterType === 'range') {
                newValue = isChecked ? [value] : []
            } else {
                newValue = isChecked
                    ? Array.from(new Map([...(prev[filterType] || []), value].map(item => [item, item])).keys())
                    : (prev[filterType] || []).filter((item: string) => item !== value)
            }

            const newFilters = {
                ...prev,
                [filterType]: newValue,
            }

            handleSearch(newFilters, 1, size, true, getSortParam())
            return newFilters
        })
    }

    const handleSearchClick = () => {
        handleSearch(filters, 1, size, true, getSortParam())
    }

    const getMetadata = (result: WorkspaceItem) => {
        return result?._embedded?.indexableObject?.sections?.traditionalpageone || {}
    }

    const handleDeleteClick = (id: number) => {
        if (id) {
            navigate(`/removeWorkflowItem/${id}`)
        }
    }

    const handleEditClick = (uuid: string) => {
        if (uuid) {
            navigate(`/resourcePolicy/${uuid}`)
        }
    }

    const handleSupervisionClick = (uuid: string) => {
        if (uuid) {
            navigate(`/supervisionSelecter/${uuid}`)
        }
    }

    const toggleItemSelection = (id: number) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedItems(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedItems.size === searchResults.length && searchResults.length > 0) {
            setSelectedItems(new Set())
        } else {
            const allIds = new Set(
                searchResults
                    .map((result) => result._embedded?.indexableObject?.id)
                    .filter((id): id is number => id !== undefined)
            )
            setSelectedItems(allIds)
        }
    }

    const handleMultipleDelete = async () => {
        if (selectedItems.size === 0) {
            showToast('Please select items to delete', 'warning')
            return
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`
        )

        if (!confirmDelete) return

        try {
            const itemsArray = Array.from(selectedItems)
            let successCount = 0
            let failCount = 0

            for (const id of itemsArray) {
                try {
                    // Call the removeWorkspaceItem API
                    await removeWorkspaceItem(id.toString())
                    successCount++
                } catch (error) {
                    console.error(`Error deleting item ${id}:`, error)
                    failCount++
                }
            }

            // Clear selection
            setSelectedItems(new Set())

            // Refresh search results
            await handleSearch(filters, page, size, false)

            if (failCount === 0) {
                showToast(`Successfully deleted ${successCount} item(s)`, 'success')
            } else {
                showToast(
                    `Deleted ${successCount} item(s). Failed to delete ${failCount} item(s).`,
                    'warning'
                )
            }
        } catch (error) {
            console.error('Error during bulk delete:', error)
            showToast('Error deleting items', 'error')
        }
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant='h3' sx={{ mb: 1, fontWeight: 600, color: '#1a237e' }}>
                    Workflow Supervision
                </Typography>
                <Typography variant='body1' sx={{ color: '#666' }}>
                    Manage items under supervision and view workflow tasks
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Filters Sidebar */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ position: 'sticky', top: 20 }}>
                        <CardHeader
                            title='Filters'
                            action={
                                <IconButton size='small' onClick={resetFilters}>
                                    <RefreshIcon />
                                </IconButton>
                            }
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            {/* Search Input */}
                            <Box sx={{ p: 2, pb: 1 }}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    placeholder='Search items...'
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: '#ccc' }} />
                                    }}
                                    variant='outlined'
                                />
                            </Box>

                            {/* Sort Dropdown */}
                            <Box sx={{ p: 2, pb: 1 }}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel>Sort By</InputLabel>
                                    <Select
                                        value={sortOption}
                                        label='Sort By'
                                        onChange={(e) => {
                                            setSortOption(e.target.value)
                                            const option = sortOptions.find(opt => opt.value === e.target.value)
                                            const apiSort = option ? option.apiValue : 'score,DESC'
                                            handleSearch(filters, 1, size, true, apiSort)
                                        }}
                                    >
                                        {sortOptions.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Filter Sections */}
                            {FilterOption.map((filterSection) => (
                                <Accordion
                                    key={filterSection.id}
                                    expanded={expandedSections[filterSection.id] || false}
                                    onChange={() => setExpandedSections(prev => ({
                                        ...prev,
                                        [filterSection.id]: !prev[filterSection.id]
                                    }))}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography sx={{ fontWeight: 500 }}>
                                            {filterSection.label}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 1 }}>
                                        {facets[filterSection.id]?.length > 0 ? (
                                            <Stack spacing={1}>
                                                {facets[filterSection.id].map((option, idx) => (
                                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <input
                                                                type='checkbox'
                                                                checked={(filters[filterSection.id] || []).includes(option.id)}
                                                                onChange={(e) => updateFilter(filterSection.id, option.id, e.target.checked)}
                                                            />
                                                            <Typography sx={{ ml: 1, fontSize: '0.9rem' }}>
                                                                {option.label}
                                                            </Typography>
                                                        </Box>
                                                        <Chip label={option.count} size='small' variant='outlined' />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Typography variant='caption' sx={{ color: '#999' }}>
                                                No filters available
                                            </Typography>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            ))}

                            <Box sx={{ p: 2, pt: 2 }}>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    onClick={handleSearchClick}
                                    startIcon={<SearchIcon />}
                                >
                                    Search
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results */}
                <Grid item xs={12} md={9}>
                    {/* Selection Toolbar */}
                    {selectedItems.size > 0 && (
                        <Card sx={{ mb: 2, backgroundColor: '#e3f2fd', border: '2px solid #2196f3' }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant='body1' sx={{ fontWeight: 600, color: '#1976d2' }}>
                                        {selectedItems.size} item(s) selected
                                    </Typography>
                                </Box>
                                <Stack direction='row' spacing={1}>
                                    <Button
                                        variant='contained'
                                        color='error'
                                        size='small'
                                        startIcon={<DeleteIcon />}
                                        onClick={handleMultipleDelete}
                                    >
                                        Delete Selected ({selectedItems.size})
                                    </Button>
                                    <Button
                                        variant='outlined'
                                        size='small'
                                        onClick={() => setSelectedItems(new Set())}
                                    >
                                        Clear Selection
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* Info Bar */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant='body2' sx={{ color: '#666' }}>
                                    Showing{' '}
                                    <strong>
                                        {Math.min((page - 1) * size + 1, totalData)}-
                                        {Math.min(page * size, totalData)}
                                    </strong>{' '}
                                    of <strong>{totalData}</strong> items
                                </Typography>
                            </Box>
                            <FormControl size='small' sx={{ minWidth: 150 }}>
                                <InputLabel>Per Page</InputLabel>
                                <Select
                                    value={size}
                                    label='Per Page'
                                    onChange={(e) => {
                                        setSize(e.target.value as number)
                                        setPage(1)
                                        handleSearch(filters, 1, e.target.value as number, true)
                                    }}
                                >
                                    {resultsPerPageOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </CardContent>
                    </Card>

                    {/* Items List */}
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <Loader />
                        </Box>
                    ) : searchResults.length === 0 ? (
                        <Alert severity='info'>No items found</Alert>
                    ) : (
                        <>
                            {/* Select All Row */}
                            <Card sx={{ mb: 2, backgroundColor: '#f9f9f9' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                                    <IconButton
                                        size='small'
                                        onClick={toggleSelectAll}
                                        sx={{ p: 0 }}
                                    >
                                        {selectedItems.size === searchResults.length && searchResults.length > 0 ? (
                                            <CheckboxIcon sx={{ color: '#1976d2' }} />
                                        ) : (
                                            <CheckBoxOutlineBlankIcon />
                                        )}
                                    </IconButton>
                                    <Typography variant='body2' sx={{ color: '#666', cursor: 'pointer' }} onClick={toggleSelectAll}>
                                        Select all on this page
                                    </Typography>
                                </CardContent>
                            </Card>

                            <Stack spacing={2}>
                                {searchResults.map((result, index) => {
                                    const id = result._embedded?.indexableObject?.id
                                    const metadata = getMetadata(result)
                                    const type = result._embedded?.indexableObject?.type
                                    const title = metadata?.['dc.title']?.[0]?.value || 'Unknown Title'
                                    const uuid = result._embedded?.indexableObject?._embedded?.item.uuid
                                    const abstract = metadata?.['dc.description.abstract']?.[0]?.value
                                    const date = metadata?.['dc.date.issued']?.[0]?.value
                                    const author = metadata?.['dc.contributor.author']?.[0]?.value
                                    const publisher = metadata?.['dc.publisher']?.[0]?.value

                                    return (
                                        <Card
                                            key={`${id}-${index}`}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { boxShadow: 3 },
                                                backgroundColor: selectedItems.has(id) ? '#e3f2fd' : 'inherit',
                                                border: selectedItems.has(id) ? '2px solid #2196f3' : '1px solid #ddd',
                                            }}
                                        >
                                            <CardContent>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={1} sm={1} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => toggleItemSelection(id)}
                                                            sx={{ p: 0 }}
                                                        >
                                                            {selectedItems.has(id) ? (
                                                                <CheckboxIcon sx={{ color: '#1976d2' }} />
                                                            ) : (
                                                                <CheckBoxOutlineBlankIcon />
                                                            )}
                                                        </IconButton>
                                                    </Grid>
                                                    <Grid item xs={11} sm={11} md={7}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Chip label={type} size='small' color='primary' variant='outlined' />
                                                            <Typography variant='h6' sx={{ fontWeight: 600, flex: 1 }}>
                                                                {title}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant='body2' sx={{ color: '#666', mb: 1 }}>
                                                            {publisher && <span><strong>{publisher}</strong>, </span>}
                                                            {date && <span>{date} </span>}
                                                            {author && <span>by {author}</span>}
                                                        </Typography>
                                                        {abstract && (
                                                            <Typography variant='body2' sx={{ color: '#555', mt: 1 }}>
                                                                {abstract.length > 200 ? `${abstract.substring(0, 200)}...` : abstract}
                                                            </Typography>
                                                        )}
                                                    </Grid>
                                                    <Grid item xs={12} md={4}>
                                                        <Stack spacing={1}>
                                                            <Button
                                                                fullWidth
                                                                variant='contained'
                                                                color='primary'
                                                                size='small'
                                                                startIcon={<EditIcon />}
                                                                onClick={() => handleEditClick(uuid)}
                                                            >
                                                                Manage Policies
                                                            </Button>
                                                            <Button
                                                                fullWidth
                                                                variant='outlined'
                                                                color='primary'
                                                                size='small'
                                                                startIcon={<GroupIcon />}
                                                                onClick={() => handleSupervisionClick(uuid)}
                                                            >
                                                                Supervision
                                                            </Button>
                                                            <Button
                                                                fullWidth
                                                                variant='outlined'
                                                                color='error'
                                                                size='small'
                                                                startIcon={<DeleteIcon />}
                                                                onClick={() => handleDeleteClick(id)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </Stack>

                            {/* Pagination */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <PaginationComponent
                                    totalData={totalData}
                                    perPage={size}
                                    currentPage={page}
                                    onPageChange={(newPage) => {
                                        setPage(newPage)
                                        handleSearch(filters, newPage, size, false)
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </Grid>
            </Grid>
        </Box>
    )
}

export default Workflow