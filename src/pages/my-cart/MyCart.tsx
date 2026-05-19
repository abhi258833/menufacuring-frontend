import React, { useEffect, useState } from 'react';
import {
    Box, Paper, Typography, Table, TableHead, TableBody,
    TableCell, TableContainer, TableRow, CircularProgress, Button,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { getUserById } from '../../api/usermanagement';
import { downloadPDF } from '../../api/bitstream';
import { siteConfig } from '../../data/data';
import { getAuthHeaders } from '../../api/searchApi';

type MyCartProps = { userId: string };

type CartItemInfo = {
    fullValue: string;
    itemId: string;
    bitstreamId: string;
    name: string;
    date: string;
    pages: string | null;
};

type SortKey = 'name' | 'date' | null;
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };

const MyCart: React.FC<MyCartProps> = ({ userId }) => {
    const [cartItems, setCartItems] = useState<CartItemInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });



    useEffect(() => { if (userId) fetchUserCart(userId); }, [userId]);

    const fetchUserCart = async (id: string) => {
        setLoading(true);

        try {
            const authToken = localStorage.getItem('authToken') || '';
            const user = await getUserById(id, authToken);
            const rawValues: string[] =
                (user.metadata?.['eperson.cart'] ?? []).map((e: any) => e.value);

            const items: CartItemInfo[] = await Promise.all(
                rawValues.map(async (raw) => {
                    let itemId = '';
                    let bitstreamId = '';
                    let date = 'N/A';
                    let pages: string | null = null;

                    const match = raw.match(/^([a-f0-9-]{36})_([a-f0-9-]{36})_([\d]{4}-[\d]{2}-[\d]{2})_(.+)?$/i);
                    if (match) {
                        itemId = match[1];
                        bitstreamId = match[2];
                        date = match[3];
                        pages = match[4] || null;
                    } else {
                        console.warn(`Invalid cart format: ${raw}`);
                    }

                    let name = 'Unknown';

                    if (bitstreamId) {
                        try {
                            const resp = await fetch(
                                `${siteConfig.apiEndpoint}/api/core/bitstreams/${bitstreamId}`,
                                { headers: getAuthHeaders() }
                            );
                            if (resp.ok) {
                                const data = await resp.json();
                                name = data.metadata?.['dc.title']?.[0]?.value || name;
                            }
                        } catch (err) {
                            console.error(`Failed to fetch bitstream info for ${bitstreamId}:`, err);
                        }
                    }

                    return { fullValue: raw, itemId, bitstreamId, name, date, pages };
                })
            );

            setCartItems(items);

        } catch (err) {
            console.error('Failed to load cart', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: SortKey) =>
        setSortConfig((prev) =>
            prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
        );

    const sortedItems = [...cartItems].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getSortSymbol = (key: SortKey) =>
        sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽') : '';

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 6, p: 3, borderRadius: 4 }}>
            <Typography variant="h5" gutterBottom>My Cart</Typography>

            {cartItems.length === 0 ? (
                <Box textAlign="center" py={4}>
                    <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: 'grey.500', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Your cart is empty.</Typography>
                    <Button variant="contained" color="primary">Add Books</Button>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>#</strong></TableCell>
                                <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                                    <strong>Document Name{getSortSymbol('name')}</strong>
                                </TableCell>
                                <TableCell onClick={() => handleSort('date')} sx={{ cursor: 'pointer' }}>
                                    <strong>Date Added{getSortSymbol('date')}</strong>
                                </TableCell>
                                <TableCell><strong>Pages</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {sortedItems.map((item, idx) => (
                                <TableRow key={item.fullValue}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{item.name || '-'}</TableCell>
                                    <TableCell>{item.date || '-'}</TableCell>
                                    <TableCell>{item.pages || 'All'}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                downloadPDF(
                                                    item.bitstreamId,
                                                    item.name,
                                                    item.itemId,
                                                    item.pages
                                                )
                                            }
                                        >
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};

export default MyCart;
