package com.example.scooterflow.service;

import com.example.scooterflow.entities.Task;
import com.example.scooterflow.entities.Worker;
import com.example.scooterflow.repositories.TaskRep;
import com.example.scooterflow.repositories.WorkerRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkerService {

    @Autowired
    private WorkerRep workerRep;
    @Autowired
    private TaskRep taskRep;
    // --- 1. ניהול כניסה (Login) ---

    /**
     * לוגין: מחזיר את העובד רק אם הסיסמה תואמת.
     * הקונטרולר ישתמש באובייקט שיחזור כאן כדי לייצר את ה-JWT.
     */
    public Worker login(String username, String password) {
        return workerRep.findByUsername(username)
                .filter(w -> w.getPassword().equals(password))
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
    }

    /**
     * בדיקה האם עובד הוא מנהל.
     */
    public boolean isAdmin(Long workerId) {
        return workerRep.findById(workerId)
                .map(w -> w.getRole() == Worker.Role.ADMIN)
                .orElse(false);
    }

    // --- 2. ניהול צוות (Admin Panel) ---

    public List<Worker> getAllWorkers() {
        return workerRep.findAll();
    }

    /**
     * הוספה או עדכון עובד.
     * כולל לוגיקה חכמה לשמירה על סטטוס זמינות בעת עדכון.
     */
    public Worker addWorker(Worker worker) {
        if (worker.getId() == null) {
            // עובד חדש - ברירת מחדל זמין
            worker.setAvailable(true);
        } else {
            // עדכון עובד קיים - שומרים על סטטוס הזמינות הנוכחי שלו מה-DB
            workerRep.findById(worker.getId()).ifPresent(existing -> {
                worker.setAvailable(existing.isAvailable());
            });
        }
        return workerRep.save(worker);
    }

    /**
     * עדכון סטטוס זמינות (Toggle)
     */
    public void toggleAvailability(Long workerId) {
        workerRep.findById(workerId).ifPresent(w -> {
            w.setAvailable(!w.isAvailable());
            workerRep.save(w);
        });
    }

    /**
     * מחיקת עובד מהמערכת.
     */
    public void deleteWorker(Long id) {
        // 1. בדיקה שהעובד קיים
        if (!workerRep.existsById(id)) {
            throw new RuntimeException("Worker not found");
        }

        // 2. בדיקה: האם קיימות משימות שאינן מושלמות (StatusNot COMPLETED)?
        if (taskRep.existsByAssignedWorkerIdAndStatusNot(id, Task.TaskStatus.COMPLETED)) {
            throw new IllegalStateException("לא ניתן למחוק עובד שיש לו משימות פעילות במערכת.");
        }

        // 3. אם אין משימות פעילות - מחיקה בטוחה
        workerRep.deleteById(id);
    }

    // --- 3. לוגיקה לשיבוץ חכם ---

    /**
     * מחזיר רשימת עובדים פנויים לפי תפקיד.
     */
    public List<Worker> getAvailableWorkersByRole(Worker.Role role) {
        return workerRep.findByRoleAndIsAvailableTrue(role);
    }
}