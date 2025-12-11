import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Assessment, TrendingUp, Inventory, Warning, AttachMoney } from '@mui/icons-material';

// Types & Enums
import { getReport } from '../services/reportService';
import { ReportType, ReportResult } from '../types/models';

// -Configuration Helper for Tables
// This maps report types to friendly column names for the Data Grid
const TABLE_COLUMNS: Record<string, { label: string; key: string; align?: 'left'|'right'|'center' }[]> = {
  [ReportType.LOW_STOCK]: [
    { label: 'Product Name', key: 'name' },
    { label: 'SKU', key: 'sku' },
    { label: 'Current Qty', key: 'quantity', align: 'center' },
    { label: 'Reorder Threshold', key: 'threshold', align: 'center' },
  ],
  [ReportType.INVENTORY]: [
    { label: 'Product Name', key: 'name' },
    { label: 'SKU', key: 'sku' },
    { label: 'In Stock', key: 'quantity', align: 'center' },
    { label: 'Unit Price', key: 'unit_price', align: 'right' },
    { label: 'Total Value', key: 'total_value', align: 'right' },
  ],
  [ReportType.DEAD_STOCK]: [
    { label: 'Product Name', key: 'name' },
    { label: 'SKU', key: 'sku' },
    { label: 'Stagnant Qty', key: 'quantity', align: 'center' },
    { label: 'Tied Capital ($)', key: 'value', align: 'right' },
  ],
  [ReportType.RESTOCK]: [
    { label: 'Product Name', key: 'name' },
    { label: 'Current Stock', key: 'current_stock', align: 'center' },
    { label: 'Daily Velocity', key: 'daily_sales', align: 'center' },
    { label: 'Est. Days Left', key: 'days_remaining', align: 'center' },
  ],
};

// Colors for Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export default function Analytics() {
  const theme = useTheme();
  
  // State
  const [selectedType, setSelectedType] = useState<ReportType>(ReportType.SALES);
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getReport(selectedType);
        setReportData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to generate analytics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedType]);

  // Icon Helper
  const getIconForType = (type: ReportType) => {
    switch (type) {
      case ReportType.SALES: return <TrendingUp />;
      case ReportType.PROFIT: return <AttachMoney />;
      case ReportType.LOW_STOCK: return <Warning />;
      case ReportType.INVENTORY: return <Inventory />;
      default: return <Assessment />;
    }
  };

  // Renderers
  const renderTable = (data: any[]) => {
    const columns = TABLE_COLUMNS[selectedType] || [];
    
    if (columns.length === 0) return <Alert severity="warning">No column configuration for this report type.</Alert>;

    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || 'left'}>
                  <strong>{col.label}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index} hover>
                {columns.map((col) => {
                  let val = row[col.key];
                  // Format currency if needed
                  if (col.key === 'unit_price' || col.key === 'total_value' || col.key === 'value') {
                    val = `$${Number(val).toFixed(2)}`;
                  }
                  // Styling for critical values
                  if (col.key === 'days_remaining' && val < 7) {
                    return (
                        <TableCell key={col.key} align={col.align || 'left'}>
                             <Chip label={`${val} days`} color="error" size="small" />
                        </TableCell>
                    )
                  }
                  return (
                    <TableCell key={col.key} align={col.align || 'left'}>
                      {val}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderVisualization = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300} color="text.secondary">
            <Assessment sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
            <Typography>No data available for this period.</Typography>
        </Box>
      );
    }

    switch (reportData.chartType) {
      case 'BAR':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend />
              <Bar dataKey="value" fill={theme.palette.primary.main} name="Units Sold" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'LINE':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={theme.palette.success.main} 
                strokeWidth={3} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
                name="Revenue ($)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'PIE':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={reportData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string | number; percent?: number }) => 
                  `${name ?? ''} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'TABLE':
        return renderTable(reportData.data);

      default:
        return <Alert severity="info">Visualization format not supported.</Alert>;
    }
  };

  // Main Layout
  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
            Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
            Visualize your inventory health and sales performance.
            </Typography>
        </Box>
        
        {/* Report Selector */}
        <Paper elevation={0} variant="outlined" sx={{ p: 1, minWidth: 300, bgcolor: 'background.paper' }}>
            <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                    value={selectedType}
                    label="Report Type"
                    onChange={(e) => setSelectedType(e.target.value as ReportType)}
                >
                    <MenuItem value={ReportType.SALES}>Sales Trends (Line)</MenuItem>
                    <MenuItem value={ReportType.TOP_SELLERS}>Top Sellers (Bar)</MenuItem>
                    <MenuItem value={ReportType.PROFIT}>Profit Margins (Pie)</MenuItem>
                    <Divider />
                    <MenuItem value={ReportType.LOW_STOCK}>Low Stock Alerts</MenuItem>
                    <MenuItem value={ReportType.INVENTORY}>Inventory Valuation</MenuItem>
                    <MenuItem value={ReportType.RESTOCK}>Restock Suggestions</MenuItem>
                    <MenuItem value={ReportType.DEAD_STOCK}>Dead Stock Audit</MenuItem>
                </Select>
            </FormControl>
        </Paper>
      </Box>

      {/* Content Area */}
      <Grid container spacing={3}>
        
        {/* Left: Summary Card */}
        <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2} sx={{ height: '100%', bgcolor: theme.palette.primary.main, color: 'white' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', p: 4 }}>
                    {loading ? (
                         <CircularProgress color="inherit" />
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, opacity: 0.9 }}>
                                {getIconForType(selectedType)}
                                <Typography variant="h6" sx={{ ml: 1, fontWeight: 500 }}>
                                    Report Summary
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                                {reportData?.title}
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
                                {reportData?.summary}
                            </Typography>
                        </>
                    )}
                </CardContent>
            </Card>
        </Grid>

        {/* Right: Visualization Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={2} sx={{ height: '100%', minHeight: 450 }}>
            <CardContent>
                {error ? (
                    <Alert severity="error">{error}</Alert>
                ) : loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                Data Visualization
                            </Typography>
                            {/* Optional: Add Export Button here later */}
                        </Box>
                        {renderVisualization()}
                    </>
                )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}