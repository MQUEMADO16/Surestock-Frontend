import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
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
  Tabs,
  Tab,
  useTheme,
  Button
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
import { 
  Timeline, 
  Inventory, 
  ShowChart, 
  Warning, 
  Refresh 
} from '@mui/icons-material';

import { getReport } from '../services/reportService';
import { ReportType, ReportResult } from '../types/models';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const TABLE_COLUMNS: Record<string, { label: string; key: string; align?: 'left'|'right'|'center' }[]> = {
  [ReportType.LOW_STOCK]: [
    { label: 'Product', key: 'name' },
    { label: 'Qty', key: 'quantity', align: 'center' },
    { label: 'Threshold', key: 'threshold', align: 'center' },
  ],
  [ReportType.INVENTORY]: [
    { label: 'Product', key: 'name' },
    { label: 'In Stock', key: 'quantity', align: 'center' },
    { label: 'Value', key: 'total_value', align: 'right' },
  ],
  [ReportType.DEAD_STOCK]: [
    { label: 'Product', key: 'name' },
    { label: 'Stagnant Qty', key: 'quantity', align: 'center' },
    { label: 'Tied Capital', key: 'value', align: 'right' },
  ],
  [ReportType.RESTOCK]: [
    { label: 'Product', key: 'name' },
    { label: 'Stock', key: 'current_stock', align: 'center' },
    { label: 'Velocity/Day', key: 'daily_sales', align: 'center' },
    { label: 'Days Left', key: 'days_remaining', align: 'center' },
  ],
};

const Widget = ({ title, summary, children, height = 350 }: { title: string, summary?: string, children: React.ReactNode, height?: number }) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1, p: 3 }}>
      <Box mb={2}>
        <Typography variant="h6" fontWeight="600" color="text.primary">
          {title}
        </Typography>
        {summary && (
          <Typography variant="body2" color="text.secondary">
            {summary}
          </Typography>
        )}
      </Box>
      <Box height={height} width="100%">
        {children}
      </Box>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const theme = useTheme();
  
  // 0 = Financial, 1 = Inventory, 2 = Forecasting
  const [activeTab, setActiveTab] = useState(0);
  
  // Store multiple reports at once: { "SALES": resultObj, "PROFIT": resultObj }
  const [reportCache, setReportCache] = useState<Record<string, ReportResult>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define which reports belong to which tab
  const TAB_REPORTS = [
    [ReportType.SALES, ReportType.PROFIT, ReportType.TOP_SELLERS], // Tab 0
    [ReportType.LOW_STOCK, ReportType.INVENTORY, ReportType.DEAD_STOCK], // Tab 1
    [ReportType.RESTOCK] // Tab 2
  ];

  const fetchTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      const typesToFetch = TAB_REPORTS[activeTab];
      
      // Fetch all reports for this tab in parallel
      const results = await Promise.all(
        typesToFetch.map(type => getReport(type))
      );

      // Merge new results into cache
      const newCache = { ...reportCache };
      typesToFetch.forEach((type, index) => {
        newCache[type] = results[index];
      });
      
      setReportCache(newCache);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  // --- RENDERERS ---

  const renderContent = (type: ReportType) => {
    const data = reportCache[type];
    
    if (!data) return null; // Or a skeleton placeholder

    // Table Renderer
    if (data.chartType === 'TABLE') {
      const columns = TABLE_COLUMNS[type] || [];
      return (
        <TableContainer sx={{ height: '100%' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align || 'left'} sx={{ bgcolor: '#fff', fontWeight: 'bold' }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((row: any, idx: number) => (
                <TableRow key={idx} hover>
                  {columns.map((col) => {
                    let val = row[col.key];
                    if (['unit_price', 'total_value', 'value'].includes(col.key)) val = `$${Number(val).toFixed(2)}`;
                    
                    if (col.key === 'days_remaining' && val < 14) {
                      return (
                        <TableCell key={col.key} align={col.align}><Chip label={`${val} days`} color={val < 7 ? "error" : "warning"} size="small" /></TableCell>
                      );
                    }
                    return <TableCell key={col.key} align={col.align}>{val}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // 2. Chart Renderers
    if (data.chartType === 'BAR') {
      return (
        <ResponsiveContainer>
          <BarChart data={data.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (data.chartType === 'LINE') {
      return (
        <ResponsiveContainer>
          <LineChart data={data.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 12}} />
            <YAxis />
            <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
            <Line type="monotone" dataKey="revenue" stroke={theme.palette.success.main} strokeWidth={3} dot={{r:3}} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (data.chartType === 'PIE') {
      return (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.data}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto', minHeight: '80vh' }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="700">Analytics</Typography>
        <Button 
          startIcon={<Refresh />} 
          variant="outlined" 
          onClick={fetchTabData} 
          disabled={loading}
          size="small"
        >
          Refresh Data
        </Button>
      </Box>

      {/* TABS */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'transparent', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<ShowChart />} iconPosition="start" label="Financial Performance" />
          <Tab icon={<Inventory />} iconPosition="start" label="Inventory Health" />
          <Tab icon={<Timeline />} iconPosition="start" label="Forecasting" />
        </Tabs>
      </Paper>

      {/* ERROR / LOADING */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {loading && !reportCache[TAB_REPORTS[activeTab][0]] && (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      )}

      {/* --- TAB PANELS --- */}
      
      {/* FINANCIAL PERFORMANCE */}
      {activeTab === 0 && reportCache[ReportType.SALES] && (
        <Grid container spacing={3}>
          {/* Main Hero Chart */}
          <Grid size={{ xs: 12 }}>
            <Widget 
              title={reportCache[ReportType.SALES].title} 
              summary={reportCache[ReportType.SALES].summary}
              height={300}
            >
              {renderContent(ReportType.SALES)}
            </Widget>
          </Grid>
          
          {/* Secondary Charts */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Widget title={reportCache[ReportType.PROFIT].title} summary={reportCache[ReportType.PROFIT].summary}>
              {renderContent(ReportType.PROFIT)}
            </Widget>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Widget title={reportCache[ReportType.TOP_SELLERS].title} summary={reportCache[ReportType.TOP_SELLERS].summary}>
              {renderContent(ReportType.TOP_SELLERS)}
            </Widget>
          </Grid>
        </Grid>
      )}

      {/* INVENTORY HEALTH */}
      {activeTab === 1 && reportCache[ReportType.LOW_STOCK] && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Widget title="Low Stock Alerts" summary={reportCache[ReportType.LOW_STOCK].summary} height={400}>
              {renderContent(ReportType.LOW_STOCK)}
            </Widget>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Widget title="Dead Stock (No sales 30d)" summary={reportCache[ReportType.DEAD_STOCK].summary} height={400}>
              {renderContent(ReportType.DEAD_STOCK)}
            </Widget>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Widget title="Inventory Valuation" summary={reportCache[ReportType.INVENTORY].summary} height={300}>
              {renderContent(ReportType.INVENTORY)}
            </Widget>
          </Grid>
        </Grid>
      )}

      {/* FORECASTING */}
      {activeTab === 2 && reportCache[ReportType.RESTOCK] && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Widget title={reportCache[ReportType.RESTOCK].title} summary={reportCache[ReportType.RESTOCK].summary} height={500}>
              {renderContent(ReportType.RESTOCK)}
            </Widget>
          </Grid>
        </Grid>
      )}

    </Box>
  );
}