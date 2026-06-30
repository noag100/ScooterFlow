package com.example.scooterflow.repositories;

import com.example.scooterflow.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRep extends JpaRepository<Task, Long> {

    /**
     * שליפת רשימת משימות בהתאם לסטטוס המבוקש.
     * משמש בעיקר להצגת נתונים מפולטרים בממשק הניהול.
     */
    List<Task> findByStatus(Task.TaskStatus status);

    // בודקת אם קיימת משימה של העובד בסטטוס שהוא לא COMPLETED
    boolean existsByAssignedWorkerIdAndStatusNot(Long workerId, Task.TaskStatus status);

    /**
     * שליפת משימות המשויכות לעובד ספציפי אשר נמצאות בסטטוס השונה מהסטטוס הנתון.
     * מיועד לניטור משימות פעילות (שטרם הוגדרו כ-COMPLETED) עבור עובד.
     */
    List<Task> findByAssignedWorkerIdAndStatusNot(Long workerId, Task.TaskStatus status);

    /**
     * בדיקת קיום משימה פעילה עבור קורקינט ספציפי בהתאם לסוג המשימה והסטטוס שלה.
     * משמש את מנגנון האוטומציה למניעת יצירת משימות כפולות מאותו הסוג על אותו הרכיב.
     */
    boolean existsByScooterIdAndTypeAndStatusNot(Long scooterId, Task.TaskType type, Task.TaskStatus status);

    /**
     * שליפת משימות פתוחות (OPEN) אשר טרם שויכו לגורם מבצע (Assigned Worker אינו מוגדר).
     * משמש את מנגנון השיוך האוטומטי במחזור האוטומציה.
     */
    List<Task> findByStatusAndAssignedWorkerIsNull(Task.TaskStatus status);

    /**
     * בדיקה האם לעובד ספציפי קיימת משימה פעילה בסטטוס מוגדר (לדוגמה: IN_PROGRESS).
     */
    boolean existsByAssignedWorkerIdAndStatus(Long workerId, Task.TaskStatus status);

    /**
     * סכימת כמות המשימות הכוללת במערכת לפי סטטוס נתון.
     * מיועד להפקת מדדי ביצוע מרכזיים (KPIs) וסטטיסטיקות עבור ממשק המשתמש.
     */
    long countByStatus(Task.TaskStatus status);
}