import React, { useState } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton, TextField, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import {
  Delete,
  Edit,
  PersonAddAlt1,
  ArrowForwardIos
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logoImg from '../Login/Logo/logoImg.png';
import './WorkerManagement.css';
import {
  useGetWorkersQuery,
  useAddWorkerMutation,
  useDeleteWorkerMutation,
  useUpdateWorkerMutation
} from '../../API/WorkerApi';

const WorkerManagement = () => {
  const navigate = useNavigate();
  const { data: workers = [], isLoading } = useGetWorkersQuery();
  const [addWorker] = useAddWorkerMutation();
  const [deleteWorker] = useDeleteWorkerMutation();
  const [updateWorker] = useUpdateWorkerMutation();

  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // סטייט חדש לפתיחת מודל מחיקה
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'TECHNICIAN' });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ name: '', username: '', password: '', role: 'TECHNICIAN' });
    setOpen(true);
  };

  const handleOpenEdit = (worker) => {
    setIsEditMode(true);
    setSelectedId(worker.id);
    setFormData({ name: worker.name, username: worker.username, password: '', role: worker.role });
    setOpen(true);
  };

  const handleOpenDeleteConfirm = (id) => {
    setSelectedId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
  try {
      await deleteWorker(selectedId).unwrap();
      setDeleteDialogOpen(false);
      alert("העובד נמחק בהצלחה!");
    } catch (err) {
       const serverMessage = err?.data; 

      if (serverMessage) {
        alert(serverMessage); // יציג בדיוק: "לא ניתן למחוק עובד שיש לו משימות פעילות במערכת."
      } else {
        alert("שגיאה במחיקת העובד, אנא נסה שוב.");
      }
      setDeleteDialogOpen(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isEditMode) {
        await updateWorker({ id: selectedId, ...formData }).unwrap();
      } else {
        await addWorker(formData).unwrap();
      }
      setOpen(false);
    } catch (err) {
      alert("שגיאה בשמירת הנתונים.");
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
            <Typography variant="h4" className="page-title-elegant">ניהול צוות עובדים</Typography>
            <Typography className="page-subtitle">הגדרת הרשאות משתמשים ועדכון פרטי כוח אדם במערכת</Typography>
          </div>
          <Button
            variant="contained"
            disableElevation
            className="action-btn-styled"
            startIcon={<PersonAddAlt1 sx={{ ml: 1 }} />} // מוסיף רווח משמאל לאייקון
            onClick={handleOpenAdd}
          >
            הוספת עובד חדש
          </Button>
        </Box>

        <Paper className="data-paper-clean" elevation={0}>
          <TableContainer className="custom-table-container">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="th-cell">שם מלא</TableCell>
                  <TableCell className="th-cell">שם משתמש</TableCell>
                  <TableCell className="th-cell" align="center">תפקיד</TableCell>
                  <TableCell align="left" className="th-cell">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id} className="tr-body">
                    <TableCell className="td-name">{worker.name}</TableCell>
                    <TableCell className="td-username">{worker.username}</TableCell>
                    <TableCell align="center">
                      <div className={`status-pill-fixed role-${worker.role.toLowerCase()}`}>
                        {worker.role === 'ADMIN' ? 'מנהל' :
                          worker.role === 'TECHNICIAN' ? 'טכנאי' : worker.role === 'LOGISTICS' ? 'לוגיסטיקה' : 'טוען'}
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <IconButton size="small" onClick={() => handleOpenEdit(worker)} className="icon-edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteConfirm(worker.id)} className="icon-delete">
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

      {/* דיאלוג הוספה ועדכון עובד */}
      <Dialog open={open} onClose={() => setOpen(false)} className="professional-dialog">
        <DialogTitle className="dialog-header">
          {isEditMode ? 'עדכון פרטי עובד' : 'יצירת חשבון עובד חדש'}
        </DialogTitle>
        <DialogContent className="dialog-body">
          <TextField label="שם מלא" fullWidth variant="outlined" margin="normal" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <TextField label="שם משתמש" fullWidth variant="outlined" margin="normal" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          <TextField label="סיסמה" type="password" placeholder={isEditMode ? "השאר ריק כדי לא לשנות" : ""} fullWidth variant="outlined" margin="normal" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <TextField select label="תפקיד במערכת" fullWidth variant="outlined" margin="normal" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <MenuItem value="TECHNICIAN">טכנאי</MenuItem>
            <MenuItem value="CHARGER">טוען</MenuItem>
            <MenuItem value="LOGISTICS">לוגיסטיקה</MenuItem>
            <MenuItem value="ADMIN">מנהל</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions className="dialog-footer">
          <Button onClick={() => setOpen(false)} className="btn-text">ביטול</Button>
          <Button onClick={handleSave} variant="contained" disableElevation className="btn-save">
            {isEditMode ? 'שמור שינויים' : 'צור משתמש'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג מחיקה מעוצב בדיוק באותו סגנון של שאר המודלים */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} className="professional-dialog">
        <DialogTitle className="dialog-header">אישור מחיקת עובד</DialogTitle>
        <DialogContent>
          <Typography className="dialog-text-center">
            האם ברצונך למחוק עובד זה מהמערכת? <br />
            פעולה זו היא סופית ולא ניתן לבטלה.
          </Typography>
        </DialogContent>
        <DialogActions className="dialog-footer" style={{ justifyContent: 'center', paddingBottom: '10px' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} className="btn-text">ביטול</Button>
          <Button onClick={handleConfirmDelete} variant="contained" disableElevation className="btn-delete-confirm">
            מחק עובד
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default WorkerManagement;