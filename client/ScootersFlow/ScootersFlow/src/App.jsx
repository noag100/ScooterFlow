import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import MapPage from './components/Dashboard/MapPage';
import AddScooterForm from './components/Management/ScooterManagement';
import WorkerManagement from './components/Management/WorkerManagement';
import WorkerTasks from "./components/WorkerTasks/WorkerTasks";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // טעינת הנתונים מ-localStorage (במקום sessionStorage)
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('name');

    if (savedToken && savedRole) {
      setUser(savedName);
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData.name);
    setRole(userData.role);
  };

  const handleLogout = () => {
    // ניקוי מלא של ה-localStorage בלוגאוט
    localStorage.clear(); 
    setUser(null);
    setRole(null);
  };

  const getHomePath = (userRole) => {
    if (userRole === 'ADMIN') return "/dashboard";
    if (['TECHNICIAN', 'CHARGER', 'LOGISTICS', 'FIELD_WORKER'].includes(userRole)) {
      return "/my-tasks";
    }
    return "/login";
  };

  if (loading) return null;

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* דף לוגין - אם המשתמש מחובר, הוא יופנה אוטומטית ליעד שלו */}
          <Route
            path="/login"
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={getHomePath(role)} />}
          />

          {/* דף משימות אישי לעובד */}
          <Route
            path="/my-tasks"
            element={
              user && role !== 'ADMIN'
                ? <WorkerTasks user={user} role={role} onLogout={handleLogout} />
                : <Navigate to="/login" />
            }
          />

          {/* דפים למנהל בלבד */}
          <Route
            path="/dashboard"
            element={user && role === 'ADMIN' ? <MapPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/add-scooter"
            element={user && role === 'ADMIN' ? <AddScooterForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/workers"
            element={user && role === 'ADMIN' ? <WorkerManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />

          {/* ניתוב ברירת מחדל */}
          <Route path="*" element={<Navigate to={user ? getHomePath(role) : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;