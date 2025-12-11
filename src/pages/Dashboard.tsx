import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Avatar, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  Skeleton, 
  IconButton,
  Alert,
  useTheme
} from '@mui/material';
import { 
  TrendingUp, 
  AttachMoney, 
  Warning, 
  Inventory, 
  ArrowForward, 
  AddShoppingCart, 
  PostAdd,
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { getReport } from '../services/reportService';
import transactionService from '../services/transactionService';
import { ReportType, TransactionResponse } from '../types/models';

// --- TYPES ---
interface DashboardMetrics {
  totalRevenue: number;
  lowStockCount: number;
  inventoryValue: number;
}

// --- COMPONENTS ---

const KpiCard = ({ title, value, icon, color, loading }: { title: string, value: string, icon: React.ReactNode, color: string, loading: boolean }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" variant="subtitle2" gutterBottom fontWeight="bold">
            {title.toUpperCase()}
          </Typography>
          {loading ? (
            <Skeleton width={100} height={40} />
          ) : (
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
              {value}
            </Typography>
          )}
        </Box>
        <Avatar variant="rounded" sx={{ bgcolor: `${color}15`, color: color }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalRevenue: 0, lowStockCount: 0, inventoryValue: 0 });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        // Parallel Fetching: Reports for KPIs + Transaction History for the list
        const [salesRes, lowStockRes, inventoryRes, historyRes] = await Promise.all([
          getReport(ReportType.SALES),
          getReport(ReportType.LOW_STOCK),
          getReport(ReportType.INVENTORY),
          transactionService.getHistory() // Assuming this exists from your Checkout.tsx
        ]);

        // 1. Process Sales Data (Sum Revenue)
        const revenue = salesRes.data.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0);
        
        // 2. Process Inventory Value
        const invValue = inventoryRes.data.reduce((acc: number, curr: any) => acc + (curr.total_value || 0), 0);

        setMetrics({
          totalRevenue: revenue,
          lowStockCount: lowStockRes.data.length,
          inventoryValue: invValue
        });

        // 3. Set Chart Data (Take last 7-10 points for a cleaner dashboard sparkline)
        setSalesData(salesRes.data.slice(-10)); 

        // 4. Set Recent Transactions (Top 5)
        setRecentTransactions(historyRes.data ? historyRes.data.slice(0, 5) : []);

      } catch (error) {
        console.error("Dashboard Load Failed", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Overview</Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome back! Here's what's happening with your inventory today.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined" 
            startIcon={<PostAdd />}
            onClick={() => navigate('/inventory')}
          >
            Add Product
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddShoppingCart />} 
            disableElevation
            onClick={() => navigate('/checkout')}
          >
            New Sale
          </Button>
        </Box>
      </Box>

      {/* KPI ROW */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard 
            title="Total Revenue (30d)" 
            value={`$${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={<AttachMoney />} 
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard 
            title="Low Stock Alerts" 
            value={metrics.lowStockCount.toString()} 
            icon={<Warning />} 
            color={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <KpiCard 
            title="Inventory Value" 
            value={`$${metrics.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
            icon={<Inventory />} 
            color={theme.palette.primary.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* MAIN CONTENT SPLIT */}
      <Grid container spacing={3}>
        
        {/* LEFT COL: CHART & TRANSACTIONS */}
        <Grid size={{ xs: 12, lg: 8 }}>
          
          {/* SALES CHART WIDGET */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">Sales Trend</Typography>
                <IconButton size="small" onClick={() => navigate('/analytics')}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Box>
              <Box height={300} width="100%">
                {loading ? (
                  <Skeleton variant="rectangular" height="100%" />
                ) : (
                  <ResponsiveContainer>
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(val: number) => [`$${val.toFixed(2)}`, 'Revenue']}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="linear" 
                        dataKey="revenue" 
                        stroke={theme.palette.success.main} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* RECENT TRANSACTIONS TABLE */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>Recent Transactions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary' }}>ID</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>Product</TableCell>
                      <TableCell align="center" sx={{ color: 'text.secondary' }}>Date</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [1,2,3].map(i => (
                        <TableRow key={i}>
                          <TableCell colSpan={4}><Skeleton animation="wave" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No recent sales found.</TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.map((tx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>#{tx.id}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{tx.productSku || "Unknown SKU"}</TableCell>
                          <TableCell align="center">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`$${tx.totalPrice.toFixed(2)}`} 
                              size="small" 
                              sx={{ bgcolor: '#e8f5e9', color: 'success.dark', fontWeight: 'bold' }} 
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COL: SIDEBAR WIDGETS */}
        <Grid size={{ xs: 12, lg: 4 }}>
          
          {/* QUICK ACTIONS */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: '#fafafa' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>Quick Actions</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="outlined" 
                  sx={{ justifyContent: 'flex-start' }}
                  startIcon={<AddShoppingCart />} 
                  onClick={() => navigate('/checkout')}
                >
                  Process Sale
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ justifyContent: 'flex-start' }}
                  startIcon={<PostAdd />} 
                  onClick={() => navigate('/inventory')}
                >
                  Manage Inventory
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ justifyContent: 'flex-start' }}
                  startIcon={<TrendingUp />} 
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* SYSTEM HEALTH / ALERTS */}
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">Attention Needed</Typography>
              </Box>
              
              {loading ? (
                <Skeleton height={100} />
              ) : metrics.lowStockCount === 0 ? (
                <Box textAlign="center" py={4} color="text.secondary">
                  <Inventory sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">Everything looks good!</Typography>
                </Box>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {metrics.lowStockCount} items are running low on stock.
                  </Alert>
                  <Button size="small" onClick={() => navigate('/analytics')}>
                    View Low Stock Report
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

        </Grid>
      </Grid>
    </Box>
  );
}