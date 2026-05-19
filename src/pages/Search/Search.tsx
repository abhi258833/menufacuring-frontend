import React, { useEffect, useState } from 'react';
import { searchObjects, fetchFacets, fetchHasFileCounts, parseSearchParamsFromUrl, updateUrlWithSearchParams, fetchFacet, } from '../../api/searchApi';
import { fetchItemBundles, fetchBitstreams } from '../../api/bitstream';
import './Search.css';
import PaginationComponent from '../../components/Pagination/PaginationComponent';
import YearRangeSlider from '../Search/YearRangeSlider';
import { sortOptions, resultsPerPageOptions, filterSections, metadataFields, FilterSection, SearchParams, FilterOption, } from '../../data/searchData';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton } from '@mui/material';
import { iconsImgs } from '../../utils/images';
import { siteConfig } from '../../data/data';
import { Bitstream } from '../../data/bookDetail';
import Loader from '../loader/loader';
import SecureImage from './SecureImage';
import { Group } from '../../api/group';
import { deleteItem } from '../../api/item';
import { useUserGroups } from '../../contexts/groupTypeContext';
import bgImage from "../../assets/images/Optimark1.png";
import SearchBar from '../../components/SearchBar/SearchBar';
const Search: React.FC = () => {
    const initialParams = parseSearchParamsFromUrl();

    const [inputValue, setInputValue] = useState<string>(initialParams.query || '');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [scope, setScope] = useState<string | undefined>(initialParams.scope);
    const [filters, setFilters] = useState<Record<string, any>>(initialParams.filters || {});
    const [facets, setFacets] = useState<Record<string, FilterOption[]>>({});
    const [hasFileCounts, setHasFileCounts] = useState({
        hasFileCount: 0,
        noFileCount: 0
    });

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
        filterSections.reduce((acc, section) => {
            acc[section.id] = section.defaultExpanded;
            return acc;
        }, {} as Record<string, boolean>)
    );
    const startTime = performance.now(); // Start timer
    const [loadingTime, setLoadingTime] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState<number>((initialParams.page ?? 0) + 1 || 1);
    const [size, setSize] = useState<number>(initialParams.size || resultsPerPageOptions[3].value);
    const [totalData, setTotalData] = useState<number>(0);
    const [sortOption, setSortOption] = useState(sortOptions[0].value);
    const [isLoading, setIsLoading] = useState(false);
    const [originalBitstreams, setOriginalBitstreams] = useState<Bitstream[]>([]);
    const [thumbnailBitstreams, setThumbnailBitstreams] = useState<Bitstream[]>([]);
    const [thumbnailsByItem, setThumbnailsByItem] = useState<Record<string, Bitstream[]>>({});
    const navigate = useNavigate();
    const [facetPagination, setFacetPagination] = useState<Record<string, { page: number, size: number }>>(
        filterSections.reduce((acc, section) => {
            acc[section.id] = { page: 0, size: 5 };
            return acc;
        }, {} as Record<string, { page: number, size: number }>)
    );
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const { groupCategories, isAdministrator } = useUserGroups();

    const isAdmingroup = (groupCategories.admin as Group[]).some((group: Group) =>
        group.name.toLowerCase().includes('administrator')
    );

    const toggleItemSelection = (uuid: string) => {
        setSelectedItems(prev => {
            if (prev.includes(uuid)) {
                return prev.filter(id => id !== uuid);
            }
            return [...prev, uuid];
        });
    };

    const handleConfirmDelete = async () => {
        if (selectedItems.length === 0) return;

        try {
            const deletePromises = selectedItems.map(uuid => deleteItem(uuid));
            await Promise.all(deletePromises);

            await handleSearch(filters, page, size, false, getSortParam());
            setSelectedItems([]);
        } catch (error) {
            console.error('Error deleting items:', error);
        } finally {
            setDeleteModalOpen(false);
        }
    };

    const handleDiscard = () => {
        setSelectedItems([]);
    }


    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
    }

    const getSortParam = (): string => {
        const option = sortOptions.find(opt => opt.value === sortOption);
        return option ? option.apiValue : 'score,DESC';
    };

    const fetchAllFacets = async (currentFilters: Record<string, any> = filters) => {
        try {
            const params: SearchParams = {
                query: inputValue,
                page: page - 1,
                size: size,
                filters: currentFilters,
                sort: getSortParam(),
                ...(scope ? { scope } : {}),
            };

            const [facetsResponse, hasFileResponse] = await Promise.all([
                fetchFacets(params, 0, 5),
                fetchHasFileCounts(params, 0, 5)
            ]);

            setFacets(facetsResponse);
            setHasFileCounts(hasFileResponse);
        } catch (error) {
            console.error('Error fetching facets:', error);
        }
    };

    const loadMoreFacetItems = async (sectionId: string) => {
        const section = filterSections.find(s => s.id === sectionId);
        if (!section) return;

        const currentPagination = facetPagination[sectionId];
        const nextPage = currentPagination.page + 1;

        try {
            const params: SearchParams = {
                query: inputValue,
                page: page - 1,
                size: size,
                filters: filters,
                sort: getSortParam(),
                ...(scope ? { scope } : {}),
            };

            const newValues = await fetchFacet(
                section.fieldName,
                params,
                nextPage,
                currentPagination.size
            );

            setFacets(prev => ({
                ...prev,
                [sectionId]: [...(prev[sectionId] || []), ...newValues]
            }));

            setFacetPagination(prev => ({
                ...prev,
                [sectionId]: {
                    ...prev[sectionId],
                    page: nextPage
                }
            }));
        } catch (error) {
            console.error('Error loading more facet items:', error);
        }
    };

    const handleSearch = async (
        currentFilters: Record<string, any> = filters,
        currentPage: number = page,
        itemsPerPage: number = size,
        resetPage: boolean = false,
        sort: string = getSortParam(),
    ) => {
        setIsLoading(true);
        try {
            const pageToFetch = resetPage ? 1 : currentPage;
            const params: SearchParams = {
                query: inputValue,
                page: pageToFetch - 1,
                size: itemsPerPage,
                sort: sort,
                filters: currentFilters,
                ...(scope ? { scope } : {})
            };

            updateUrlWithSearchParams(params);

            const data = await searchObjects(params);

            setSearchResults(data.results);
            setTotalData(data.totalElements);
            if (resetPage) {
                setPage(1);
            }

            await fetchAllFacets(currentFilters);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
    }, []);



    const updateFilter = (filterType: string, value: any, isChecked: boolean) => {
        setFilters(prev => {
            let newValue;
            const section = filterSections.find(s => s.id === filterType);

            if (!section) return prev;

            if (section.filterType === 'boolean') {
                newValue = isChecked ? value : null;
            } else if (section.filterType === 'range') {
                newValue = isChecked ? [value] : [];
            } else {
                newValue = isChecked
                    ? Array.from(new Map([...(prev[filterType] || []), value].map(item => [item, item])).keys())
                    : (prev[filterType] || []).filter((item: string) => item !== value);
            }

            const newFilters = {
                ...prev,
                [filterType]: newValue
            };

            handleSearch(newFilters, 1, size, true, getSortParam());

            return newFilters;
        });
    };
    useEffect(() => {
        const fetchThumbnails = async () => {
            const startTime = performance.now(); // Start timer

            try {
                if (searchResults.length > 0) {
                    const thumbnails: Record<string, Bitstream[]> = {};

                    for (const result of searchResults) {
                        const uuid = result._embedded?.indexableObject?.uuid;
                        if (!uuid) continue;

                        const bundles = await fetchItemBundles(uuid);
                        if (bundles.length > 0) {
                            const originalBundle = bundles.find(b => b.name === 'ORIGINAL') || bundles[0];
                            const thumbnailBundle = bundles.find(b => b.name === 'THUMBNAIL') || bundles[0];
                            const originalbitstreamsData = await fetchBitstreams(originalBundle.uuid);
                            const thumbnailbitstreamsData = await fetchBitstreams(thumbnailBundle.uuid);
                            setOriginalBitstreams(originalbitstreamsData);
                            setThumbnailBitstreams(thumbnailbitstreamsData);
                            thumbnails[uuid] = thumbnailbitstreamsData;
                        }
                    }

                    setThumbnailsByItem(thumbnails);
                }
            } catch (error) {
                console.error(error);
            } finally {
                const endTime = performance.now(); // End timer
                const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2);
                setLoadingTime(timeInSeconds); // Save to state for UI
            }
        };

        fetchThumbnails();
    }, [searchResults]);
    const getMetadataValue = (metadata: any, field: string): string | null => {
        if (metadata && metadata[field] && metadata[field].length > 0) {
            return metadata[field][0].value;
        }
        return null;
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        handleSearch(filters, newPage, size, false, getSortParam());
    };

    const resetFilters = () => {
        const newFilters = {};
        setFilters(newFilters);
        handleSearch(newFilters, 1, size, true);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const renderFilterSection = (section: FilterSection) => {
        switch (section.filterType) {
            case 'checkbox':
                if (!facets[section.id]?.length) return null;
                return (
                    <ul style={{ listStyle: 'none', padding: '0' }}>
                        {facets[section.id].map((option, index) => (
                            <li key={index}>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={(filters[section.id] || []).includes(option.id)}
                                            onChange={(e) => updateFilter(section.id, option.id, e.target.checked)}
                                        />
                                        <span style={{ marginLeft: '10px' }}>{option.label}</span>
                                    </div>
                                    <span style={{ backgroundColor: '#eee', padding: '2px 5px', borderRadius: '33px' }}>
                                        {option.count}
                                    </span>
                                </label>
                            </li>
                        ))}

                        {/* Show more button */}
                        {facets[section.id].length % facetPagination[section.id]?.size === 0 && (
                            <button
                                className='show-more-button'
                                onClick={() => loadMoreFacetItems(section.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#1a73e8',
                                    cursor: 'pointer',
                                    padding: '10px',
                                    textAlign: 'left',
                                    width: '100%'
                                }}
                            >
                                Show more
                            </button>
                        )}
                    </ul>
                );
            case 'range':
                return (
                    <YearRangeSlider
                        onApply={(startYear, endYear) => {
                            const dateRange = `${startYear} - ${endYear}`;
                            updateFilter(section.id, dateRange, true);
                        }}
                    />
                );
            case 'boolean':
                return (
                    <ul style={{ listStyle: 'none', padding: '0' }}>
                        <li style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={filters[section.id] === true}
                                        onChange={(e) => updateFilter(section.id, true, e.target.checked)}
                                    />
                                    <span style={{ marginLeft: '10px' }}>Yes</span>
                                </div>
                                <span style={{ backgroundColor: '#eee', padding: '2px 5px', borderRadius: '33px' }}>
                                    {hasFileCounts.hasFileCount}
                                </span>
                            </label>
                        </li>
                    </ul>
                );
            default:
                return null;
        }
    };

    const deleteAction = (
        <div className="bulk-actions"
            style={{
                margin: '10px 0',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                display: selectedItems.length > 0 ? 'flex' : 'none',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
            <div>
                <span>{selectedItems.length} item(s) selected</span>
            </div>
            <div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDiscard}
                    style={{ marginRight: '3px' }}
                >
                    Discard
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => setDeleteModalOpen(true)}
                    startIcon={<img className="sresult_icon" src={iconsImgs.remove} alt="Delete" />}
                >
                    Delete Selected
                </Button>
            </div>
        </div>
    );

    if (isLoading) return <Loader />;
    return (
        <div className="search-container row">
            <div className="filters-and-results">
                <div className='filters-and-setting'>
                    <div className="filters col-3">
                        <div className="Zns0ac"><span className="I75YIf">Filter by</span></div>
                        {filterSections.map(section => {
                            const shouldShowSection =
                                section.filterType === 'range' ||
                                (section.filterType === 'checkbox' && facets[section.id]?.length > 0) ||
                                (section.filterType === 'boolean' && hasFileCounts.hasFileCount > 0);

                            if (!shouldShowSection) return null;
                            if (section.id === 'subject' && Array.isArray(facets[section.id])) {
                                facets[section.id] = facets[section.id].map(f => {
                                    const maxLength = 15;
                                    const label = f.label.trim();
                                    const trimmed = label.length > maxLength ? label.slice(0, maxLength) + '...' : label;
                                    return {
                                        ...f,
                                        label: trimmed
                                    };
                                });
                            }



                            return (
                                <div key={section.id}>
                                    <div className={`filter_name ${expandedSections[section.id] ? '' : 'border-bottom'}`} onClick={() => toggleSection(section.id)}>
                                        <h2 className='ZF0dQe'>{section.label}</h2>
                                        <button
                                            className={`toggle-button ${expandedSections[section.id] ? 'up' : 'down'}`}

                                        ></button>
                                    </div>
                                    {expandedSections[section.id] && (
                                        <div className='li_filter'>
                                            {renderFilterSection(section)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}


                    </div>
                    <div className='filter_reset'>
                        <button className='filter_reset_btn'
                            style={{ width: '93%', padding: '10px', border: 'none', borderRadius: '4px' }}
                            onClick={resetFilters}
                        >
                            Reset filters
                        </button>
                    </div>
                    <div className="dropdown-container">
                        <h1 className="Zns0ac"><span className="I75YIf">Setting</span></h1>
                        <div>
                            <label htmlFor="sort">Sort By</label>
                            <select
                                id="sort"
                                value={sortOption}
                                onChange={(e) => {
                                    const newSortOption = e.target.value;
                                    setSortOption(newSortOption);
                                    const option = sortOptions.find(opt => opt.value === newSortOption);
                                    const apiSortValue = option ? option.apiValue : 'score,DESC';
                                    handleSearch(filters, page, size, false, apiSortValue);
                                }}
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="results-per-page">Results per page</label>
                            <select
                                id="results-per-page"
                                value={size}
                                onChange={(e) => {
                                    const newSize = parseInt(e.target.value, 10);
                                    setSize(newSize);
                                    handleSearch(filters, 1, newSize, true, getSortParam());
                                }}
                            >
                                {resultsPerPageOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="search-results col-9">
                    <div className='col-12'>
                        <Grid container alignItems="center" className="search-container">
                            <Grid item xs={12} sm={12} md={12}>
                                <SearchBar
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onSubmit={() => handleSearch(filters, 1, size, true, getSortParam())}
                                    placeholder="Search the repository..."
                                    variant="page"
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </div>

                    <div className="col-12">
                        <Grid container alignItems="center" className="results-header">
                            <Grid item xs={10} sm={10} lg={11} className="results-header-content">
                                {loadingTime && (
                                    <h4 className="search-item-counter">
                                        <span className="counter-value">{totalData}</span> Items found in{" "}
                                        <span className="counter-value">
                                            {Math.max(
                                                parseFloat(loadingTime) > 0.80
                                                    ? parseFloat(loadingTime) - 0.50
                                                    : parseFloat(loadingTime),
                                                0
                                            ).toFixed(2)}
                                        </span>{" "}
                                        seconds
                                    </h4>
                                )}
                            </Grid>
                            <Grid item xs={2} sm={2} lg={1} className="results-header-actions">
                                <div className="results-header-actions-inner">
                                    <button
                                        className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <img className="sresult_icon" src={iconsImgs.grid} alt="Grid" />
                                    </button>
                                    <button
                                        className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <img className="sresult_icon" src={iconsImgs.list} alt="List" />
                                    </button>
                                </div>
                            </Grid>
                        </Grid>
                    </div>


                    {isLoading ? (
                        <div className="loading-indicator">Loading results...</div>
                    ) : (
                        <>
                            {selectedItems.length > 0 && (
                                <Grid container>
                                    <Grid item xs={12}>
                                        {deleteAction}
                                    </Grid>
                                </Grid>
                            )}
                            <Grid container spacing={2} className="results-body">
                                {viewMode === 'list' ? (
                                    searchResults.map((result, index) => {
                                        const metadata = result._embedded?.indexableObject?.metadata;
                                        const type = result._embedded?.indexableObject?.type;

                                        const title =
                                            metadata?.["dc.title"]?.[0]?.value ||
                                            metadata?.["dc.uhid"]?.[0]?.value ||
                                            "Unknown Title";

                                        const uuid = result._embedded?.indexableObject?.uuid;


                                        const abstract = metadata?.["dc.description.abstract"]?.[0]?.value;
                                        const date = metadata?.["dc.date.created"]?.[0]?.value;

                                        const assetId = metadata?.["dc.assetid"]?.[0]?.value;
                                        const invoiceNumber = metadata?.["dc.invoiceNumber"]?.[0]?.value;
                                        const docType = metadata?.["dc.DocType"]?.[0]?.value;
                                        const vendorName = metadata?.["dc.VendorName"]?.[0]?.value;
                                        const issuedDate = metadata?.["dc.date.issued"]?.[0]?.value;

                                        const empName = metadata?.["dc.EmpName"]?.[0]?.value;
                                        const empId = metadata?.["dc.empid"]?.[0]?.value;
                                        const hrDocNo = metadata?.["dc.hrDocNo"]?.[0]?.value;

                                        const contractStatus = metadata?.["dc.ContractStatus"]?.[0]?.value;
                                        const contractOwner = metadata?.["dc.ContractOwner"]?.[0]?.value;
                                        const contractValue = metadata?.["dc.ContractValue"]?.[0]?.value;
                                        const organization = metadata?.["dc.organization"]?.[0]?.value;
                                        const material = metadata?.["dc.Material"]?.[0]?.value;
                                        const paymentTerms = metadata?.["dc.PaymentTerms"]?.[0]?.value;

                                        const displayType = metadata?.["dc.type"]?.[0]?.value || type;


                                        const handleTitleClick = () => {
                                            if (uuid) {
                                                navigate(`/items/${uuid}`);
                                            }
                                        };

                                        const isSelected = uuid && selectedItems.includes(uuid);

                                        return (
                                            <Grid item xs={12} key={index}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        borderRadius: "8px",
                                                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                                        marginBottom: "20px",
                                                        overflow: "hidden",
                                                        backgroundColor: isSelected ? "#e3f2fd" : "#fff",
                                                        border: isSelected ? "2px solid #1976d2" : "none",
                                                        position: "relative",
                                                    }}
                                                >
                                                    {/* Colored Sidebar */}
                                                    <div
                                                        style={{
                                                            width: "100px",
                                                            backgroundColor: "#f97316",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#fff",
                                                            fontWeight: "bold",
                                                            position: "relative",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                backgroundColor: "#fff",
                                                                color: "#f97316",
                                                                borderRadius: "50%",
                                                                width: "48px",
                                                                height: "48px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "20px",
                                                                marginBottom: "5px",
                                                            }}
                                                        >
                                                            <i className="fas fa-cube"></i>
                                                        </div>

                                                    </div>

                                                    {/* Thumbnail & Content */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            padding: "15px",
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {thumbnailsByItem[result._embedded?.indexableObject?.uuid]
                                                            ?.filter(bitstream => /\.(jpe?g|png)$/i.test(bitstream.name))
                                                            .slice(0, 1)
                                                            .map(bitstream => (
                                                                <SecureImage
                                                                    key={bitstream.uuid}
                                                                    uuid={bitstream.uuid}
                                                                    className="thumbnail-img_list img-fluid"
                                                                    style={{
                                                                        maxHeight: '100px',
                                                                        maxWidth: '100px',
                                                                        marginRight: '20px',
                                                                        borderRadius: '8px',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                    alt="Thumbnail"
                                                                />
                                                            ))}

                                                        {/* Right Text Section */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                                <span style={{
                                                                    backgroundColor: '#f0f0f0',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    marginRight: '10px',
                                                                    fontSize: '13px'
                                                                }}>
                                                                    {displayType}
                                                                </span>
                                                                <h3
                                                                    style={{
                                                                        margin: '0',
                                                                        cursor: 'pointer',
                                                                        fontSize: '18px',
                                                                        fontWeight: 600,
                                                                        color: '#333'
                                                                    }}
                                                                    onClick={isSelected ? undefined : handleTitleClick}
                                                                >
                                                                    {title}
                                                                </h3>
                                                            </div>
                                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "14px", color: "#555", fontFamily: "inter, sans-serif" }}>

                                                                {assetId && (
                                                                    <span><strong>Asset ID:</strong> {assetId}</span>
                                                                )}

                                                                {invoiceNumber && (
                                                                    <span><strong>Invoice Number:</strong> {invoiceNumber}</span>
                                                                )}

                                                                {docType && (
                                                                    <span><strong>Document Type:</strong> {docType}</span>
                                                                )}

                                                                {vendorName && (
                                                                    <span><strong>Vendor Name:</strong> {vendorName}</span>
                                                                )}

                                                                {issuedDate && (
                                                                    <span><strong>Issued Date:</strong> {issuedDate}</span>
                                                                )}

                                                                {date && (
                                                                    <span><strong>Date Issued:</strong> {date}</span>
                                                                )}

                                                                {empName && (
                                                                    <span><strong>Employee Name:</strong> {empName}</span>
                                                                )}

                                                                {empId && (
                                                                    <span><strong>Employee ID:</strong> {empId}</span>
                                                                )}

                                                                {hrDocNo && (
                                                                    <span><strong>HR Document No:</strong> {hrDocNo}</span>
                                                                )}

                                                                {contractStatus && (
                                                                    <span><strong>Contract Status:</strong> {contractStatus}</span>
                                                                )}

                                                                {contractOwner && (
                                                                    <span><strong>Contract Owner:</strong> {contractOwner}</span>
                                                                )}

                                                                {contractValue && (
                                                                    <span><strong>Contract Value:</strong> {contractValue}</span>
                                                                )}

                                                                {organization && (
                                                                    <span><strong>Organization:</strong> {organization}</span>
                                                                )}

                                                                {material && (
                                                                    <span><strong>Material:</strong> {material}</span>
                                                                )}

                                                                {paymentTerms && (
                                                                    <span><strong>Payment Terms:</strong> {paymentTerms}</span>
                                                                )}





                                                            </div>



                                                        </div>

                                                        {/* Delete Button */}
                                                        {(isAdministrator || isAdmingroup) && (
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    justifyContent: "end",
                                                                    alignItems: "center",
                                                                    marginLeft: "5px",
                                                                }}
                                                            >
                                                                <IconButton
                                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                                        e.stopPropagation();
                                                                        uuid && toggleItemSelection(uuid);
                                                                    }}
                                                                    color="primary"
                                                                    style={{
                                                                        fontSize: "18px",
                                                                        cursor: "pointer",
                                                                        padding: "5px",
                                                                        background: "none",
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <img className="itemh_icon" src={iconsImgs.remove} alt="Delete" />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </div>
                                                </div>
                                            </Grid>
                                        );
                                    })
                                ) : (
                                    searchResults.map((result, index) => {
                                        const metadata = result._embedded?.indexableObject?.metadata;
                                        const type = result._embedded?.indexableObject?.type;
                                        const title = metadata?.['dc.title']?.[0]?.value || metadata?.['dc.uhid']?.[0]?.value || 'Unknown Title';
                                        const uuid = result._embedded?.indexableObject?.uuid;
                                        const abstract = getMetadataValue(metadata, metadataFields.abstract);
                                        const date = getMetadataValue(metadata, metadataFields.date);
                                        const author = getMetadataValue(metadata, metadataFields.author);
                                        const entity = getMetadataValue(metadata, metadataFields.entityType);
                                        const assetId = getMetadataValue(metadata, metadataFields.assetId);
                                        const invoiceNumber = getMetadataValue(metadata, metadataFields.invoiceNumber);
                                        const docType = getMetadataValue(metadata, metadataFields.docType);
                                        const vendorName = getMetadataValue(metadata, metadataFields.vendorName);
                                        const issuedDate = getMetadataValue(metadata, metadataFields.issuedDate);
                                        const empName = getMetadataValue(metadata, metadataFields.empName);
                                        const empId = getMetadataValue(metadata, metadataFields.empId);
                                        const hrDocNo = getMetadataValue(metadata, metadataFields.hrDocNo);
                                        const contractStatus = getMetadataValue(metadata, metadataFields.ContractStatus);
                                        const contractOwner = getMetadataValue(metadata, metadataFields.ContractOwner);
                                        const contractValue = getMetadataValue(metadata, metadataFields.ContractValue);
                                        const organization = getMetadataValue(metadata, metadataFields.organization);
                                        const material = getMetadataValue(metadata, metadataFields.Material);
                                        const paymentTerms = getMetadataValue(metadata, metadataFields.PaymentTerms);
                                        const quantity = getMetadataValue(metadata, metadataFields.Quantity);
                                        const displayType = entity || type;

                                        const handleTitleClick = () => {
                                            if (uuid) {
                                                const keyword = inputValue ? encodeURIComponent(inputValue) : '';
                                                navigate(`/items/${uuid}${keyword ? `?keyword=${keyword}` : ''}`);
                                            }
                                        };

                                        const isSelected = uuid && selectedItems.includes(uuid);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} lg={4} key={index}>
                                                <div
                                                    className="grid_main"
                                                    onClick={isSelected
                                                        ? (e: React.MouseEvent<HTMLDivElement>) => {
                                                            e.stopPropagation();
                                                            uuid && toggleItemSelection(uuid);
                                                        }
                                                        : handleTitleClick
                                                    }
                                                    style={{
                                                        border: isSelected ? '2px solid #1976d2' : '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        padding: '10px',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        height: '100%',
                                                        backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '5px',
                                                            right: '5px',
                                                            width: '20px',
                                                            height: '20px',
                                                            backgroundColor: '#1976d2',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '12px'
                                                        }}>
                                                            ✓
                                                        </div>
                                                    )}


                                                    {/* Thumbnail */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            margin: "10px 0",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                gap: "8px",
                                                                padding: "10px 5px 10px 5px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "12px",
                                                                boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
                                                                width: "500px",
                                                                height: "240px",
                                                                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
                                                                backgroundSize: "contain",
                                                                backgroundRepeat: "no-repeat",
                                                                backgroundPosition: "center",
                                                                color: "#fff",
                                                                fontFamily: "inter, sans-serif",
                                                            }}

                                                        >
                                                            {assetId && (
                                                                <div>
                                                                    <strong>Asset ID:</strong> {assetId}
                                                                </div>
                                                            )}

                                                            {invoiceNumber && (
                                                                <div>
                                                                    <strong>Invoice Number:</strong> {invoiceNumber}
                                                                </div>
                                                            )}

                                                            {docType && (
                                                                <div>
                                                                    <strong>Document Type:</strong> {docType}
                                                                </div>
                                                            )}

                                                            {vendorName && (
                                                                <div>
                                                                    <strong>Vendor Name:</strong> {vendorName}
                                                                </div>
                                                            )}

                                                            {issuedDate && (
                                                                <div>
                                                                    <strong>Issued Date:</strong> {issuedDate}
                                                                </div>
                                                            )}
                                                            {empName && (
                                                                <div>
                                                                    <strong>Employee Name:</strong> {empName}
                                                                </div>
                                                            )}

                                                            {empId && (
                                                                <div>
                                                                    <strong>Employee ID:</strong> {empId}
                                                                </div>
                                                            )}

                                                            {hrDocNo && (
                                                                <div>
                                                                    <strong>HR Document No:</strong> {hrDocNo}
                                                                </div>
                                                            )}
                                                            {contractStatus && (
                                                                <div>
                                                                    <strong>Contract Status:</strong> {contractStatus}
                                                                </div>
                                                            )}

                                                            {contractOwner && (
                                                                <div>
                                                                    <strong>Contract Owner:</strong> {contractOwner}
                                                                </div>
                                                            )}

                                                            {contractValue && (
                                                                <div>
                                                                    <strong>Contract Value:</strong> {contractValue}
                                                                </div>
                                                            )}

                                                            {organization && (
                                                                <div>
                                                                    <strong>Organization:</strong> {organization}
                                                                </div>
                                                            )}
                                                            {material && (
                                                                <div>
                                                                    <strong>Material:</strong> {material}
                                                                </div>
                                                            )}

                                                            {paymentTerms && (
                                                                <div>
                                                                    <strong>Payment Terms:</strong> {paymentTerms}
                                                                </div>
                                                            )}

                                                            {quantity && (
                                                                <div>
                                                                    <strong>Quantity:</strong> {quantity}
                                                                </div>
                                                            )}

                                                        </div>
                                                    </div>


                                                    {abstract && (
                                                        <p style={{ margin: '10px 0', color: '#555', fontSize: '14px' }}>
                                                            {abstract}
                                                        </p>
                                                    )}

                                                    {/* Delete button */}
                                                    {(isAdministrator || isAdmingroup) &&

                                                        <IconButton
                                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                                e.stopPropagation();
                                                                uuid && toggleItemSelection(uuid);
                                                            }}
                                                            color="primary"
                                                            style={{
                                                                fontSize: '18px',
                                                                cursor: 'pointer',
                                                                padding: '5px',
                                                                background: 'none',
                                                            }}
                                                            title='Delete'
                                                        >
                                                            <img className="itemh_icon" src={iconsImgs.remove} alt="Delete" />
                                                        </IconButton>
                                                    }

                                                    <IconButton
                                                        className='itemh_btn'
                                                        onClick={handleTitleClick}
                                                        color="primary"
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '3px',
                                                            right: '14px',
                                                            fontSize: '18px',
                                                            cursor: 'pointer',
                                                            padding: '5px',
                                                            background: 'none',
                                                        }}
                                                    >
                                                        <img className="itemh_icon" src={iconsImgs.arrow} alt="Arrow" />
                                                    </IconButton>
                                                </div>
                                            </Grid>
                                        );
                                    }
                                    )
                                )}
                            </Grid>
                        </>
                    )}


                </div>
            </div>


            <Dialog
                open={deleteModalOpen}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {selectedItems.length} selected item(s)?
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

            <div style={{ bottom: 10, padding: "10px", }}>
                <PaginationComponent
                    totalData={totalData}
                    perPage={size}
                    currentPage={page}
                    onPageChange={(newPage) => {
                        handlePageChange(newPage);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                />
            </div>
        </div>

    );
};

export default Search;
