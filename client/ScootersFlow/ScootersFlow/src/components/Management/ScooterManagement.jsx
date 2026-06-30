import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import {
  Delete,
  Edit,
  DirectionsBike,
  ArrowForwardIos
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logoImg from '../Login/Logo/logoImg.png';
import './ScooterManagement.css'; // שימוש בקובץ ה-CSS התואם
import {
  useGetScootersQuery,
  useAddScooterMutation,
  useDeleteScooterMutation,
  useUpdateScooterMutation
} from '../../API/ScooterApi';

// זיכרון מטמון (Cache) גלובלי פשוט למניעת הצפת פניות לשרת ה-API
const addressCache = {};

const ScooterAddress = ({ lat, lng, index }) => {
  const [address, setAddress] = useState('טוען כתובת...');
  const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;

  useEffect(() => {
    if (!lat || !lng) { setAddress('מיקום לא ידוע'); return; }
    
    // אם המיקום הזה כבר תורגם בעבר, נציג אותו מייד מהזיכרון ללא פנייה לשרת
    if (addressCache[cacheKey]) {
      setAddress(addressCache[cacheKey]);
      return;
    }

    let isMounted = true;

    const fetchAddress = async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=he`);
        const data = await response.json();
        if (data?.address) {
          const { road, house_number, city, town, village } = data.address;
          const formattedAddress = [road, house_number, city || town || village].filter(Boolean).join(', ') || 'מיקום בשטח';
          
          // שמירה ב-Cache
          addressCache[cacheKey] = formattedAddress;
          
          if (isMounted) setAddress(formattedAddress);
        } else { 
          if (isMounted) setAddress('מיקום בשטח'); 
        }
      } catch { 
        if (isMounted) setAddress('מיקום בשטח'); 
      }
    };

    // ביזור הבקשות: נותן לכל שורה בטבלה "תור" משלה (לפי האינדקס שלה בטבלה) 
    // כדי לא להציף את השרת ביותר מ-1 בקשה בשנייה
    const delayTimer = setTimeout(fetchAddress, index * 1100);

    return () => {
      isMounted = false;
      clearTimeout(delayTimer);
    };
  }, [lat, lng, cacheKey, index]);

  return <p className="task-scooter-address" style={{ margin: 0 }}>{address}</p>;
};

const FleetManagement = () => {
  const navigate = useNavigate();
  const { data: scooters = [], isLoading } = useGetScootersQuery(undefined, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true
  });
  const [addScooter] = useAddScooterMutation();
  const [deleteScooter] = useDeleteScooterMutation();
  const [updateScooter] = useUpdateScooterMutation();

  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // משתני המצב עבור דיאלוג המחיקה המעוצב
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scooterIdToDelete, setScooterIdToDelete] = useState(null);

  // הגדרת מצב התחלתי חופף לישות ה-Scooter ב-Java
  const [formData, setFormData] = useState({
    batteryLevel: 100,
    status: 'AVAILABLE',
    latitude: 31.7683,
    longitude: 35.2137
  });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ batteryLevel: 100, status: 'AVAILABLE', latitude: 31.7683, longitude: 35.2137 });
    setOpen(true);
  };

  const handleOpenEdit = (scooter) => {
    setIsEditMode(true);
    setSelectedId(scooter.id);
    setFormData({
      batteryLevel: scooter.batteryLevel,
      status: scooter.status,
      latitude: scooter.latitude,
      longitude: scooter.longitude
    });
    setOpen(true);
  };

  const handleDeleteClick = (id) => {
    setScooterIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteScooter(scooterIdToDelete).unwrap();
      setDeleteDialogOpen(false);
      setScooterIdToDelete(null);
    } catch (err) {
      alert("שגיאה במחיקת הקורקינט.");
    }
  };

  const handleSave = async () => {
    try {
      if (isEditMode) {
        await updateScooter({ id: selectedId, ...formData }).unwrap();
      } else {
        await addScooter(formData).unwrap();
      }
      setOpen(false);
    } catch (err) {
      alert("שגיאה בשמירת הנתונים.");
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'זמין';
      case 'CHARGING': return 'סוללה נמוכה';
      case 'IN_REPAIR': return 'בתיקון';
      case 'IN_USE': return 'בנסיעה';
      default: return status;
    }
  };

  if (isLoading) return <div className="loading-screen"><Typography>טוען נתונים...</Typography></div>;

  return (
    <div className="admin-page-bg">
      <header className="admin-top-nav">
        <div className="nav-right">
          <div className="logo-container">
            <img src={logoImg} alt="ScooterFlow" className="admin-logo-fixed" />
          </div>
          <div className="nav-divider"></div>
          <Typography className="nav-context-title">מרכז בקרה ותפעול</Typography>
        </div>
        <Button
          className="back-link"
          startIcon={<ArrowForwardIos sx={{ fontSize: 12, ml: 1 }} />}
          onClick={() => navigate('/dashboard')}
        >
          חזרה ללוח בקרה
        </Button>
      </header>

      <Container maxWidth="xl" className="admin-main-content">
        <Box className="content-header">
          <div className="title-stack">
            <Typography variant="h4" className="page-title-elegant">ניהול צי קורקינטים</Typography>
            <Typography className="page-subtitle">צפייה בסטטוס הכלים בזמן אמת, שינוי מצב ידני וניהול הצי</Typography>
          </div>
          <Button
            variant="contained"
            disableElevation
            className="action-btn-styled"
            startIcon={<DirectionsBike sx={{ ml: 1 }} />}
            onClick={handleOpenAdd}
          >
            הוספת כלי חדש לצי
          </Button>
        </Box>

        <Paper className="data-paper-clean" elevation={0}>
          <TableContainer className="custom-table-container">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="th-cell">מזהה כלי (ID)</TableCell>
                  <TableCell className="th-cell">רמת סוללה</TableCell>
                  <TableCell className="th-cell" align="center">מיקום (רחוב ועיר)</TableCell>
                  <TableCell className="th-cell" align="center">סטטוס תפעולי</TableCell>
                  <TableCell align="left" className="th-cell">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scooters.map((scooter, index) => (
                  <TableRow key={scooter.id} className="tr-body">
                    <TableCell className="td-name">#{scooter.id}</TableCell>
                    <TableCell className="td-username">
                      <span style={{
                        fontWeight: 'bold',
                        color: scooter.batteryLevel <= 20 ? '#f90505' : scooter.batteryLevel <= 50 ? '#a004fa' : '#3408fc'
                      }}>
                        {scooter.batteryLevel}%
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      {/* שים לב שהעברנו את ה-index כדי לנהל את קצב הפניות התקני לשרת */}
                      <ScooterAddress lat={scooter.latitude} lng={scooter.longitude} index={index} />
                    </TableCell>
                    <TableCell align="center">
                      <div className={`status-pill-fixed status-${scooter.status.toLowerCase()}`}>
                        {getStatusLabel(scooter.status)}
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <IconButton size="small" onClick={() => handleOpenEdit(scooter)} className="icon-edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(scooter.id)} className="icon-delete">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} className="professional-dialog">
        <DialogTitle className="dialog-header">
          {isEditMode ? `עדכון קורקינט #${selectedId}` : 'רישום קורקינט חדש לצי'}
        </DialogTitle>
        <DialogContent className="dialog-body">
          <TextField
            label="רמת סוללה (0-100)"
            type="number"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formData.batteryLevel}
            onChange={(e) => setFormData({ ...formData, batteryLevel: parseInt(e.target.value) || 0 })}
          />
          <TextField
            label="קו רוחב (Latitude)"
            type="number"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
          />
          <TextField
            label="קו אורך (Longitude)"
            type="number"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
          />
          <TextField
            select
            label="סטטוס כלי"
            fullWidth
            variant="outlined"
            margin="normal"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <MenuItem value="AVAILABLE">זמין לרכיבה (AVAILABLE)</MenuItem>
            <MenuItem value="IN_USE">בנסיעה פעילה (IN_USE)</MenuItem>
            <MenuItem value="CHARGING">בטעינה (CHARGING)</MenuItem>
            <MenuItem value="IN_REPAIR">בתיקון במעבדה (IN_REPAIR)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions className="dialog-footer">
          <Button onClick={() => setOpen(false)} className="btn-text">ביטול</Button>
          <Button onClick={handleSave} variant="contained" disableElevation className="btn-save">
            {isEditMode ? 'עדכן כלי' : 'הוסף לצי'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} className="professional-dialog">
        <DialogTitle className="dialog-header">אישור מחיקת קורקינט</DialogTitle>
        <DialogContent>
          <Typography className="dialog-text-center">
            האם ברצונך למחוק קורקינט זה מהצי? <br />
            פעולה זו היא סופית ולא ניתן לבטלה.
          </Typography>
        </DialogContent>
        <DialogActions className="dialog-footer" style={{ justifyContent: 'center', paddingBottom: '10px' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} className="btn-text">ביטול</Button>
          <Button onClick={handleConfirmDelete} variant="contained" disableElevation className="btn-delete-confirm">
            מחק קורקינט
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FleetManagement;