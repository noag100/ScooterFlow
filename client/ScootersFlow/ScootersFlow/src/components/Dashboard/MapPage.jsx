import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
    Container, Paper, Typography, Box, Button, Grid
} from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import './MapPage.css';
import logoImg from '../Login/Logo/logoImg.png';
import ScooterMap from '../Map/Map';

const MapPage = ({ user, onLogout }) => {
    const [scooters, setScooters] = useState([]);
    const [stats, setStats] = useState({
        totalScooters: 0, criticalCount: 0, avgBattery: 0, openTasks: 0, utilizationPct: 0,
        batteryChart: [], workerLoadChart: []
    });

    const [focusedScooter, setFocusedScooter] = useState(null);
    const mapRef = useRef(null);
    const navigate = useNavigate();

    const COLORS = {
        available: '#00cec9',
        inUse: '#0984e3',
        charging: '#6c5ce7',
        repair: '#b2bec3',
        critical: '#d63031',
        text: '#64748b'
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [sRes, statsRes, tasksRes] = await Promise.all([
                fetch('http://localhost:8080/api/scooters', { headers }),
                fetch('http://localhost:8080/api/scooters/stats', { headers }),
                fetch('http://localhost:8080/api/tasks', { headers }) // <--- משיכת המשימות
            ]);

            if (!sRes.ok || !statsRes.ok || !tasksRes.ok) return;

            const scootersData = await sRes.json();
            const statsData = await statsRes.json();
            const tasksData = await tasksRes.json(); // <--- שמירת המשימות

            // חישוב כמות הקורקינטים שיש להם משימת טעינה פתוחה או בביצוע
            const needingChargeCount = tasksData.filter(task =>
                task.type === 'CHARGE' && task.status !== 'COMPLETED'
            ).length;

            // עדכון אובייקט הסטטיסטיקה הקיים
            setScooters(scootersData);
            setStats({
                ...statsData,
                // אנחנו דורסים את הנתון המקורי מהשרת ומחליפים אותו בכמות המשימות הפעילות
                chargingCount: needingChargeCount
            });

        } catch (e) {
            console.error("Error fetching dashboard data:", e);
        }
    };

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 5000);
        return () => clearInterval(timer);
    }, []);

    const statusPieData = [
        { name: 'זמין', value: scooters.filter(s => s.status === 'AVAILABLE').length, color: COLORS.available },
        { name: 'בשימוש', value: scooters.filter(s => s.status === 'IN_USE').length, color: COLORS.inUse },
        { name: 'סוללה נמוכה', value: stats.chargingCount || 0, color: COLORS.charging },
        { name: 'בתיקון', value: scooters.filter(s => s.status === 'IN_REPAIR').length, color: COLORS.repair }
    ];

    return (
        <div className="admin-page-bg dashboard-wrapper">

            {/* ── Top nav ── */}
            <header className="admin-top-nav">
                <div className="nav-right">
                    <div className="logo-container">
                        <img src={logoImg} alt="ScooterFlow" className="admin-logo-fixed" />
                    </div>
                    <div className="nav-divider" />
                    <Typography className="nav-context-title">לוח בקרה ראשי</Typography>
                </div>

                <div className="nav-left-actions">
                    <Box className="header-navigation-buttons">
                        <Button
                            variant="contained"
                            className="action-btn-styled-header"
                            startIcon={<AddCircleOutlinedIcon sx={{ ml: 1 }} />}
                            onClick={() => navigate('/add-scooter')}
                        >
                            ניהול צי
                        </Button>
                        <Button
                            variant="outlined"
                            className="secondary-action-btn-header"
                            startIcon={<PeopleOutlinedIcon sx={{ ml: 1 }} />}
                            onClick={() => navigate('/workers')}
                        >
                            צוות עובדים
                        </Button>
                    </Box>
                    <div className="nav-divider" />
                    <Typography className="user-welcome">שלום, <b>{user || 'מנהל'}</b></Typography>
                    <Button className="logout-btn-minimal" onClick={onLogout}>התנתקות</Button>
                </div>
            </header>

            {/* ── Main content ── */}
            <Container maxWidth={false} className="dashboard-content-fluid">
                {/*
                    dashboard-main-grid is flex row-reverse (no wrap):
                      - first child in DOM = map  → appears on LEFT  (40%)
                      - second child in DOM = stats → appears on RIGHT (60%)
                */}
                <Box className="dashboard-main-grid">

                    {/* MAP — 40% */}
                    <Box className="map-grid-col">
                        <ScooterMap
                            scooters={scooters}
                            focusedScooter={focusedScooter}
                            ref={mapRef}
                        />
                    </Box>

                    {/* STATS — 60% */}
                    <Box className="scrollable-stats-side">

                        {/* Section header */}
                        <Box className="dashboard-section-title" sx={{ mb: 1.5 }}>
                            <Typography variant="h4" className="page-title-elegant">סטטוס צי בזמן אמת</Typography>
                            <Typography className="page-subtitle">ניטור סוללות, ויסות עומסי עבודה וניצולת משאבים</Typography>
                        </Box>

                        {/* KPI row */}
                        <Box sx={{ display: 'flex', gap: '12px', mb: 1.5, width: '100%' }}>
                            {[
                                { label: 'סה"כ צי', val: stats.totalScooters, icon: '🛴', cls: 'total' },
                                { label: 'ניצולת מערך', val: `${stats.utilizationPct}%`, icon: '📈', cls: 'util' },
                                { label: 'משימות פתוחות', val: stats.openTasks, icon: '📋', cls: 'task' },
                                { label: 'קריטי (≤10%)', val: stats.criticalCount, icon: '🪫', cls: 'crit' }
                            ].map((kpi, i) => (
                                <Paper key={i} className={`kpi-card-professional ${kpi.cls}`} elevation={0}>
                                    <Box className="kpi-card-header">
                                        <span className="kpi-icon-badge">{kpi.icon}</span>
                                        <Typography className="kpi-label-new">{kpi.label}</Typography>
                                    </Box>
                                    <Typography className="kpi-value-new">{kpi.val}</Typography>
                                </Paper>
                            ))}
                        </Box>

                        {/* Pie + Area charts side by side */}
                        <Box className="charts-bottom-row" sx={{ mb: 1.5 }}>

                            {/* Pie chart */}
                            <Paper className="chart-box-premium" elevation={0}>
                                <Typography className="chart-title">התפלגות סטטוסים בצי</Typography>
                                <div className="pie-dashboard-layout">
                                    {/* Pie */}
                                    <div className="pie-chart-holder">
                                        <ResponsiveContainer width="100%" height={150}>
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    startAngle={90}
                                                    endAngle={-270}
                                                >
                                                    {statusPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend */}
                                    <div className="pie-legend-custom-grid">
                                        {statusPieData.map((item, i) => (
                                            <div key={i} className="legend-item-premium">
                                                <span
                                                    className="dot-indicator"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <Typography className="legend-text-main">
                                                    {item.name}: <b>{item.value}</b>
                                                </Typography>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Paper>

                            {/* Battery area chart */}
                            <Paper className="chart-box-premium" elevation={0}>
                                <Typography className="chart-title">רמות אנרגיה וטעינה בצי</Typography>
                                <ResponsiveContainer width="100%" height={150}>
                                    <AreaChart
                                        data={stats.batteryChart}
                                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}                                   >
                                        <defs>
                                            <linearGradient id="colorInUse" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.inUse} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={COLORS.inUse} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false} tickLine={false}
                                            fontSize={11} tick={{ fill: '#94a3b8' }}
                                            padding={{ left: 10, right: 10 }}
                                        />
                                        <YAxis
                                            width={30}
                                            axisLine={false} tickLine={false}
                                            fontSize={11} tick={{ fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '10px',
                                                border: 'none',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={COLORS.inUse}
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorInUse)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Box>

                        {/* Worker load chart — full width of stats column */}
                        <Paper className="chart-box-premium" elevation={0}>
                            <Typography className="chart-title">חלוקת עומס עבודה וויסות משימות פעילות</Typography>
                            <ResponsiveContainer width="100%" height={150}>
                                <AreaChart
                                    /* הוקוס פוקוס: מסננים את "דני המנהל" (או כל שם שמכיל מנהל) מלהופיע בגרף */
                                    data={stats.workerLoadChart ? stats.workerLoadChart.filter(w => !w.name.includes('מנהל')) : []}
                                    margin={{ top: 8, right: 8, left: -25, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorWorkerTasks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                        tick={{ fill: '#94a3b8' }}
                                        /* מונע מהשמות בצדדים (כמו רוני) להיחתך או להידבק לציר */
                                        padding={{ left: 10, right: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={11}
                                        tick={{ fill: '#94a3b8' }}
                                        allowDecimals={false}
                                        tickCount={5}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '10px',
                                            border: 'none',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                            fontSize: '12px',
                                            direction: 'rtl' /* מסדר את כיוון הטקסט בתוך הבלון הצף */
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tasksCount"
                                        stroke="#6c5ce7"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorWorkerTasks)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>

                    </Box>{/* end scrollable-stats-side */}
                </Box>{/* end dashboard-main-grid */}
            </Container>
        </div>
    );
};

export default MapPage;
