import React, { useEffect, useState } from 'react';
import { fetchItemDetails } from '../../api/item';
import { fetchBitstreams, fetchItemBundles } from '../../api/bitstream';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './bookDetail.css';
import { Bitstream, BookDetailsData } from '../../data/bookDetail';
import { downloadPDF } from '../../api/bitstream';
import { useAuth } from '../../contexts/AuthContext';
import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import Loader from '../loader/loader';
import SecureImage from '../Search/SecureImage';
import { useUserGroups } from '../../contexts/groupTypeContext';
import { getowningCollection } from '../../api/item';
import AIAssistant from '../../app/item-page/ai-assistant/AIAssistant';
import { parseHandleFromUri } from '../../utils/handle';




const BookDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('keyword') ? decodeURIComponent(searchParams.get('keyword')!) : '';
    const [item, setItem] = useState<BookDetailsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [originalBitstreams, setOriginalBitstreams] = useState<Bitstream[]>([]);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { isAdministrator, groupCategories } = useUserGroups();
    const [collection, setCollection] = useState<any>(null);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const fetchOwningCollection = async (itemId: string) => {
        try {
            const collection = await getowningCollection(itemId);
            setCollection(collection);
        } catch (error) {
            console.error("Error fetching owning collection:", error);
        }
    }
    useEffect(() => {
        fetchOwningCollection(id || '');
    }, [])


    const displayEditButton = () => {
        const uploadGroups = groupCategories.upload.map(group =>
            group.name.replace('_Upload', '')
        );

        const adminGroups = groupCategories.admin.map(group =>
            group.name.replace('_Admin', '')
        );

        const allAccessGroups = Array.from(new Set([...uploadGroups, ...adminGroups]));
        return allAccessGroups.includes(collection)
    };

    const isAccess = displayEditButton();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                if (id) {
                    const itemDetails = await fetchItemDetails(id);
                    setItem(itemDetails);
                    const bundles = await fetchItemBundles(id);
                    if (bundles.length > 0) {
                        const originalBundle = bundles.find(b => b.name === 'ORIGINAL') || bundles[0];
                        const originalbitstreamsData = await fetchBitstreams(originalBundle.uuid);
                        setOriginalBitstreams(originalbitstreamsData);
                    }
                }
            } catch (error) {
                setError("Data not found");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getMetadataValue = (field: string): string | null => {
        if (!item || !item.metadata) return null;
        const metadataField = item.metadata[field as keyof typeof item.metadata];
        return metadataField && metadataField.length > 0 ? metadataField[0].value : null;
    };

    const title = getMetadataValue('dc.title') || getMetadataValue('dc.invoiceNumber');
    const assetId = getMetadataValue('dc.assetid');
    const invoiceNumber = getMetadataValue('dc.invoiceNumber');
    const docType = getMetadataValue('dc.DocType');
    const vendorName = getMetadataValue('dc.vendorName');
    const issuedDate = getMetadataValue('dc.date.issued');
    const empName = getMetadataValue('dc.EmpName');
    const empId = getMetadataValue('dc.empid');
    const hrDocNo = getMetadataValue('dc.hrDocNo');
    const contractOwner = getMetadataValue('dc.ContractOwner');
    const contractStatus = getMetadataValue('dc.ContractStatus');
    const contractValue = getMetadataValue('dc.ContractValue');
    const organization = getMetadataValue('dc.organization');
    const material = getMetadataValue('dc.Material');
    const paymentTerms = getMetadataValue('dc.PaymentTerms');
    const quantity = getMetadataValue('dc.Quantity');
    const status = getMetadataValue('dc.Status');
    const totalValue = getMetadataValue('dc.TotalValue');
    const unitPrice = getMetadataValue('dc.UnitPrice');
    const identifierUri = getMetadataValue('dc.identifier.uri');
    const itemHandle = item?.handle || parseHandleFromUri(identifierUri);
    const primaryPdfBitstream = originalBitstreams.find((bitstream) => /\.pdf$/i.test(bitstream.name));

    const handleSummaryNavigate = (page: number) => {
        if (!primaryPdfBitstream) {
            return;
        }

        const params = new URLSearchParams();
        params.set('uuid', primaryPdfBitstream.uuid);
        params.set('itemId', id || '');
        params.set('name', primaryPdfBitstream.name);
        params.set('page', String(page));

        if (itemHandle) {
            params.set('handle', itemHandle);
        }

        if (keyword) {
            params.set('keyword', keyword);
        }

        window.open(`/pdf-viewer?${params.toString()}`, '_blank', 'noopener,noreferrer');
        setSummaryModalOpen(false);
    };

    const renderAIActions = () => (
        <Stack direction="row" spacing={1} flexWrap="nowrap" useFlexGap>
            <Button
                variant="contained"
                size="small"
                startIcon={<SummarizeOutlinedIcon />}
                onClick={() => setSummaryModalOpen(true)}
                disabled={!itemHandle}
                className="ai-action-btn"
            >
                Summary
            </Button>
            <Button
                variant="outlined"
                size="small"
                startIcon={<QuestionAnswerOutlinedIcon />}
                onClick={() => setChatModalOpen(true)}
                disabled={!itemHandle}
                className="ai-action-btn ai-action-btn-outlined"
            >
                Ask AI
            </Button>
        </Stack>
    );

    if (isLoading) return <Loader />;
    if (error) return <h3>{error}</h3>;
    if (!item) return <div>Item not found</div>;

    return (
        <>

            <div className='container main_bdtl_div'>
                <div className='d-flex justify-content-between align-items-center mb-3'>
                    <div className='d-flex align-items-center'>
                        <Tooltip title="Go Back">
                            <IconButton className="header-icon-btn" onClick={() => navigate(-1)}>
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <h1 className='bdtl_title ms-3 mb-0'>{title}</h1>
                    </div>
                    {isAuthenticated && (isAdministrator || isAccess) && (
                        <Tooltip title="Edit Item">
                            <IconButton className="header-icon-btn" onClick={() => navigate(`/edit-item/${id}`)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
                <div className='row'>
                    <div className='col-lg-4 col-md-12 col-12 text-center mb-3'>
                        {id ? (
                            <SecureImage
                                key={id}
                                srcPath={`/api/thumbnails/${id}`}
                                className="thumbnail-img img-fluid"
                                alt={title || 'Item thumbnail'}
                            />
                        ) : (
                            <div className="placeholder-thumbnail">
                                <p>No thumbnail available</p>
                            </div>
                        )}
                    </div>

                    <div className='col-lg-8 col-md-12 col-12'>
                        <table className='modern-table w-100'>
                            <tbody>
                                {assetId && (
                                    <tr>
                                        <th>Asset ID</th>
                                        <td>{assetId}</td>
                                    </tr>
                                )}

                                {invoiceNumber && (
                                    <tr>
                                        <th>Invoice Number</th>
                                        <td>{invoiceNumber}</td>
                                    </tr>
                                )}

                                {docType && (
                                    <tr>
                                        <th>Document Type</th>
                                        <td>{docType}</td>
                                    </tr>
                                )}

                                {vendorName && (
                                    <tr>
                                        <th>Vendor Name</th>
                                        <td>{vendorName}</td>
                                    </tr>
                                )}

                                {issuedDate && (
                                    <tr>
                                        <th>Issued Date</th>
                                        <td>{issuedDate}</td>
                                    </tr>
                                )}

                                {empName && (
                                    <tr>
                                        <th>Employee Name</th>
                                        <td>{empName}</td>
                                    </tr>
                                )}

                                {empId && (
                                    <tr>
                                        <th>Employee ID</th>
                                        <td>{empId}</td>
                                    </tr>
                                )}

                                {hrDocNo && (
                                    <tr>
                                        <th>HR Document No</th>
                                        <td>{hrDocNo}</td>
                                    </tr>
                                )}

                                {contractOwner && (
                                    <tr>
                                        <th>Contract Owner</th>
                                        <td>{contractOwner}</td>
                                    </tr>
                                )}

                                {contractStatus && (
                                    <tr>
                                        <th>Contract Status</th>
                                        <td>{contractStatus}</td>
                                    </tr>
                                )}
                                {contractValue && (
                                    <tr>
                                        <th>Contract Value</th>
                                        <td>{contractValue}</td>
                                    </tr>
                                )}

                                {organization && (
                                    <tr>
                                        <th>Organization</th>
                                        <td>{organization}</td>
                                    </tr>
                                )}

                                {material && (
                                    <tr>
                                        <th>Material</th>
                                        <td>{material}</td>
                                    </tr>
                                )}

                                {paymentTerms && (
                                    <tr>
                                        <th>Payment Terms</th>
                                        <td>{paymentTerms}</td>
                                    </tr>
                                )}

                                {quantity && (
                                    <tr>
                                        <th>Quantity</th>
                                        <td>{quantity}</td>
                                    </tr>
                                )}

                                {status && (
                                    <tr>
                                        <th>Status</th>
                                        <td>{status}</td>
                                    </tr>
                                )}

                                {totalValue && (
                                    <tr>
                                        <th>Total Value</th>
                                        <td>{totalValue}</td>
                                    </tr>
                                )}

                                {unitPrice && (
                                    <tr>
                                        <th>Unit Price</th>
                                        <td>{unitPrice}</td>
                                    </tr>
                                )}



                                {originalBitstreams.length > 0 && (() => {
                                    const pdfBitstreams = originalBitstreams.filter(bitstream => /.pdf$/i.test(bitstream.name));

                                    // If only one PDF, show simple list format
                                    if (pdfBitstreams.length === 1 || pdfBitstreams.length === 0) {
                                        return (
                                            <>
                                                <tr>
                                                    <th>Action</th>
                                                    <td>
                                                        <div className="action-row-content">
                                                            <div className="action-icon-group">
                                                                {pdfBitstreams.map(bitstream => (
                                                                    <div key={bitstream.uuid} className='mb-2'>
                                                                        <Tooltip title="View PDF">
                                                                            <IconButton className="action-icon-btn" onClick={() => window.open(`/pdf-viewer?uuid=${encodeURIComponent(bitstream.uuid)}&itemId=${encodeURIComponent(id ?? '')}&name=${encodeURIComponent(bitstream.name)}${itemHandle ? `&handle=${encodeURIComponent(itemHandle)}` : ''}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`, '_blank', 'noopener,noreferrer')}>
                                                                                <VisibilityIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>

                                                                        <Tooltip title="View In Flip PDF">
                                                                            <IconButton className="action-icon-btn" onClick={() => window.open(`/flip-book-viewer?uuid=${bitstream.uuid}&itemId=${id}`, '_blank')}>
                                                                                <MenuBookIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>

                                                                        {isAuthenticated && (
                                                                            <Tooltip title="Download PDF">
                                                                                <IconButton className="action-icon-btn" onClick={() => downloadPDF(bitstream.uuid, bitstream.name, id || '')}>
                                                                                    <DownloadIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="action-divider" />
                                                            {renderAIActions()}
                                                        </div>
                                                    </td>
                                                </tr>

                                            </>
                                        );
                                    }
                                    // If multiple PDFs, show table format
                                    return (
                                        <>
                                            <tr>
                                                <th>Action</th>
                                                <td colSpan={2}>
                                                    <div className="action-row-content">
                                                        {renderAIActions()}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>PDF Files</th>
                                                <th>Actions</th>
                                            </tr>
                                            {pdfBitstreams.map(bitstream => (
                                                <tr key={bitstream.uuid}>
                                                    <td className="pdf-name-cell">
                                                        {bitstream.name}
                                                    </td>
                                                    <td className="action-buttons-cell">
                                                        <div className="d-flex flex-wrap gap-2">
                                                            <Tooltip title="View PDF">
                                                                <IconButton className="action-icon-btn" onClick={() => window.open(`/pdf-viewer?uuid=${bitstream.uuid}&itemId=${encodeURIComponent(id ?? '')}&name=${encodeURIComponent(bitstream.name)}${itemHandle ? `&handle=${encodeURIComponent(itemHandle)}` : ''}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`, '_blank', 'noopener,noreferrer')}>
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Flip PDF">
                                                                <IconButton className="action-icon-btn" onClick={() => window.open(`/flip-book-viewer?uuid=${bitstream.uuid}&itemId=${id}`, '_blank')}>
                                                                    <MenuBookIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {isAuthenticated && (
                                                                <Tooltip title="Download">
                                                                    <IconButton className="action-icon-btn" onClick={() => downloadPDF(bitstream.uuid, bitstream.name, id || '')}>
                                                                        <DownloadIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}


                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AIAssistant
                    handle={itemHandle}
                    mode="summary"
                    open={summaryModalOpen}
                    onNavigate={handleSummaryNavigate}
                    onClose={() => setSummaryModalOpen(false)}
                />
                <AIAssistant
                    handle={itemHandle}
                    mode="chat"
                    open={chatModalOpen}
                    onClose={() => setChatModalOpen(false)}
                />

            </div>
        </>
    );
};

export default BookDetails;
