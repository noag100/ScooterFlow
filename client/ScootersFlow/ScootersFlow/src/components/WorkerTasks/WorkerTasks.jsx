import React, { useState, useEffect, useMemo } from 'react';
import { CircularProgress, Typography, Box, Button } from '@mui/material';
import { useGetTasksByWorkerQuery, useCompleteTaskMutation, useGetScootersByWorkerQuery } from '../../API/TaskApi';
import ScooterMap from '../Map/Map';
import logoImg from '../Login/Logo/logoImg.png';
import './WorkerTasks.css';

const ScooterAddress = ({ lat, lng }) => {
  const [address, setAddress] = useState('טוען כתובת...');

  useEffect(() => {
    if (!lat || !lng) { 
      setAddress('מיקום לא ידוע'); 
      return; 
    }
    
    const fetchAddress = async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=he`);
        const data = await response.json();
        if (data?.address) {
          const { road, house_number, city, town, village } = data.address;
          setAddress([road, house_number, city || town || village].filter(Boolean).join(', ') || 'מיקום בשטח');
        } else { 
          setAddress('מיקום בשטח'); 
        }
      } catch { 
        setAddress('מיקום בשטח'); 
      }
    };
    
    fetchAddress();
  }, [lat, lng]);

  return <p className="task-scooter-address">{address}</p>;
};

const WorkerTasks = ({ user, onLogout }) => {
  const workerId = Number(localStorage.getItem('id'));
  
  const [isSorted, setIsSorted] = useState(false);
  const [focusedScooter, setFocusedScooter] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // שליפת נתונים באמצעות RTK Query עם ה-workerId המתוקן
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useGetTasksByWorkerQuery(workerId, {
    skip: !workerId // מונע קריאה לשרת אם ה-ID חסר בטעות
  });
  const { data: scooters = [], isLoading: scootersLoading, refetch: refetchScooters } = useGetScootersByWorkerQuery(workerId, {
    skip: !workerId
  });
  const [completeTask] = useCompleteTaskMutation();

  // אלגוריתם המיון עם הגנות בטוחות על הנתונים
  const displayTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    if (!isSorted) return tasks;
    return [...tasks].sort((a, b) => {
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      if (a.type === 'CHARGE' && b.type !== 'CHARGE') return -1;
      if (a.type !== 'CHARGE' && b.type === 'CHARGE') return 1;
      return 0;
    });
  }, [tasks, isSorted]);

  const handleComplete = async (e, taskId) => {
    e.stopPropagation();
    try {
      await completeTask(taskId).unwrap();
      refetchTasks(); 
      refetchScooters();
      setFocusedScooter(null); 
      setShowSuccessModal(true);
    } catch (err) {
      console.error("שגיאה בסיום המשימה:", err);
    }
  };

  if (tasksLoading || scootersLoading) {
    return <div className="worker-loading-screen"><CircularProgress /></div>;
  }

  return (
    <div className="worker-tasks-page dashboard-wrapper">
      <header className="admin-top-nav">
        <div className="nav-right">
          <div className="logo-container">
            <img src={logoImg} alt="ScooterFlow" className="admin-logo-fixed" />
          </div>
          <div className="nav-divider" />
          <Typography className="nav-context-title">אזור עובדי שטח</Typography>
        </div>
        <div className="nav-left-actions">
          <Typography className="user-welcome">שלום, <b>{user || 'עובד'}</b></Typography>
          <Button className="logout-btn-minimal" onClick={onLogout}>התנתקות</Button>
        </div>
      </header>

      <div className="dashboard-content-fluid">
        <Box className="dashboard-main-grid">
          {/* מפת הקורקינטים */}
          <Box className="map-grid-col">
            <div className="map-paper-frame">
              <ScooterMap scooters={scooters} focusedScooter={focusedScooter} onResetFocus={() => setFocusedScooter(null)} />
            </div>
          </Box>

          {/* רשימת המשימות */}
          <Box className="scrollable-stats-side">
            <Box className="dashboard-section-title">
              <Typography variant="h4" className="page-title-elegant">
                המשימות שלי ({tasks?.length || 0})
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setIsSorted(!isSorted)} 
                className="sort-toggle-btn" 
                sx={{ 
                  borderColor: isSorted ? '#ed6c02' : '#ccc', 
                  color: isSorted ? '#ed6c02' : 'inherit' 
                }}
              >
                {isSorted ? "הצג כרגיל" : "הצג לפי דחיפות"}
              </Button>
            </Box>

            <div className="tasks-scroll-container">
              {displayTasks.length === 0 ? (
                <Typography style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  אין כרגע משימות משויכות עבורך.
                </Typography>
              ) : (
                displayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => task.scooter && setFocusedScooter({ 
                      id: task.scooter.id, 
                      lat: task.scooter.latitude, 
                      lng: task.scooter.longitude 
                    })} 
                    className={`task-card-clean ${focusedScooter?.id === task.scooter?.id ? 'task-card-focused' : ''}`}
                  >
                    <div className="task-card-content">
                      <div className="task-info-block">
                        <span className={`task-type-pill ${task.type === 'CHARGE' ? 'pill-charge' : 'pill-repair'}`}>
                          {task.type === 'CHARGE' ? '🔋 טעינה' : '🛠️ תיקון'}
                        </span>
                        <p className="task-scooter-id">
                          קורקינט: {task.scooter?.id || 'לא ידוע'} | דחיפות: {task.urgency}
                        </p>
                        
                        {/* הגנת רינדור קריטית על קואורדינטות הכתובת */}
                        {task.scooter?.latitude && task.scooter?.longitude ? (
                          <ScooterAddress lat={task.scooter.latitude} lng={task.scooter.longitude} />
                        ) : (
                          <p className="task-scooter-address">מיקום בשטח</p>
                        )}
                      </div>
                      <button className="worker-complete-btn" onClick={(e) => handleComplete(e, task.id)}>
                        סיימתי
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Box>
        </Box>
      </div>

      {/* מודל הצלחה */}
      {showSuccessModal && (
        <div className="success-overlay">
          <div className="dark-order-modal">
            <div className="success-checkmark-wrapper">
              <span className="success-checkmark">✓</span>
            </div>
            <p className="dark-modal-text">המשימה עודכנה בהצלחה.</p>
            <button className="dark-modal-btn" onClick={() => setShowSuccessModal(false)}>
              אישור
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerTasks;