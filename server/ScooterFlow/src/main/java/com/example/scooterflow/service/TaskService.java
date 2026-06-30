package com.example.scooterflow.service;

import com.example.scooterflow.entities.Scooter;
import com.example.scooterflow.entities.Task;
import com.example.scooterflow.entities.Worker;
import com.example.scooterflow.repositories.ScooterRep;
import com.example.scooterflow.repositories.TaskRep;
import com.example.scooterflow.repositories.WorkerRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRep taskRep;

    @Autowired
    private ScooterRep scooterRep;

    @Autowired
    private ScooterService scooterService;

    @Autowired
    private WorkerRep workerRep;

    // --- 1. שליפות מידע ---

    public List<Task> getAllTasks() {
        return taskRep.findAll();
    }

    public List<Task> getTasksByStatus(Task.TaskStatus status) {
        return taskRep.findByStatus(status);
    }

    public List<Task> getTasksByWorker(Long workerId) {
        return taskRep.findByAssignedWorkerIdAndStatusNot(workerId, Task.TaskStatus.COMPLETED);
    }

    public List<Task> getOpenUnassignedTasks() {
        return taskRep.findByStatusAndAssignedWorkerIsNull(Task.TaskStatus.OPEN);
    }

    // --- 2. יצירת משימות אוטומטית (מנגנון מורחב) ---

    /**
     * מבצע סריקה מקיפה של כלל הקורקינטים במערכת ומייצר משימות אוטומטיות
     * עבור כל הסוגים הנתמכים (טעינה, תיקון ולוגיסטיקה) במידה ואינן קיימות.
     */

    @Transactional
    public void autoGenerateAllTasks() {
        // א' - יצירת משימות טעינה (CHARGE)
        List<Scooter> allScooters = scooterRep.findAll();
        for (Scooter s : allScooters) {
            // הסינון הקריטי: רק אם הסוללה נמוכה מ-20%
            if (s.getBatteryLevel() < 20) {
                createTaskIfNotExist(s, Task.TaskType.CHARGE, calculateUrgency(s.getBatteryLevel()));
            }
        }

        // ב' - יצירת משימות תיקון (REPAIR)
        List<Scooter> damagedScooters = scooterRep.findByStatus(Scooter.ScooterStatus.IN_REPAIR);
        for (Scooter s : damagedScooters) {
            createTaskIfNotExist(s, Task.TaskType.REPAIR, 10);
        }

        // ג' - יצירת משימות לוגיסטיקה (LOGISTICS)
        LocalDateTime lostThreshold = LocalDateTime.now().minusDays(3);
        List<Scooter> lostScooters = scooterRep.findByLastUsedBeforeAndStatus(lostThreshold, Scooter.ScooterStatus.AVAILABLE);
        for (Scooter s : lostScooters) {
            createTaskIfNotExist(s, Task.TaskType.RELOCATE, 6);
        }
    }

    /**
     * מייצרת משימה חדשה במערכת עבור קורקינט ספציפי, בתנאי שלא קיימת עבורו
     * משימה פעילה פתוחה או בתהליך מאותו הסוג בדיוק.
     */
    public void createTaskIfNotExist(Scooter scooter, Task.TaskType type, int urgency) {
        // בדיקת קיום משימה פעילה פתוחה או בתהליך מאותו הסוג בדיוק
        boolean exists = taskRep.existsByScooterIdAndTypeAndStatusNot(
                scooter.getId(),
                type,
                Task.TaskStatus.COMPLETED
        );

        if (!exists) {
            Task task = Task.builder()
                    .scooter(scooter)
                    .type(type)
                    .status(Task.TaskStatus.OPEN)
                    .urgency(urgency)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            taskRep.save(task);
            System.out.println("LOG: Automated system created new " + type + " task for scooter ID: " + scooter.getId());
        }
    }

    // --- 3. דיווח על תקלות (Repair) ---

    @Transactional
    public void reportScooterDamage(Long scooterId) {
        scooterRep.findById(scooterId).ifPresentOrElse(s -> {
            // עדכון סטטוס הקורקינט לתיקון
            s.setStatus(Scooter.ScooterStatus.IN_REPAIR);
            scooterRep.save(s);

            // יצירת משימת תיקון (REPAIR) בדחיפות גבוהה
            createTaskIfNotExist(s, Task.TaskType.REPAIR, 10);

            System.out.println("LOG: Scooter " + scooterId + " reported as damaged. Task created.");
        }, () -> {
            throw new RuntimeException("Scooter with ID " + scooterId + " not found");
        });
    }

    // --- 4. לוגיקת שיוך אוטומטי (המודל ההיברידי) ---

    /**
     * מנסה לשייך משימה פתוחה לעובד זמין בעל התפקיד המתאים.
     * הלוגיקה תומכת בחלוקת עומסים דינמית על ידי בחירת העובד בעל מספר המשימות הפעילות הנמוך ביותר,
     * תוך אישור צבירת מספר משימות במקביל במצבי עומס לצורך ניהול וויסות עבודה עתידי על ידי מנהל המערכת.
     *
     * @param task המשימה הנדרשת לשיוך
     */
    @Transactional
    public void attemptAutoAssignment(Task task) {
        Worker.Role requiredRole;

        // קביעת התפקיד המקצועי הנדרש בהתאם לסוג המשימה
        if (task.getType() == Task.TaskType.REPAIR) {
            requiredRole = Worker.Role.TECHNICIAN;
        } else if (task.getType() == Task.TaskType.CHARGE) {
            requiredRole = Worker.Role.CHARGER;
        } else {
            requiredRole = Worker.Role.LOGISTICS;
        }

        // שליפת רשימת העובדים הזמינים המוסמכים לתפקיד המבוקש
        List<Worker> potentialWorkers = workerRep.findByRoleAndIsAvailableTrue(requiredRole);

        // במידה ואין עובדים זמינים התואמים את הדרישה, המשימה נשארת במצב OPEN
        if (potentialWorkers.isEmpty()) {
            return;
        }

        Worker leastBusyWorker = null;
        int minTasks = Integer.MAX_VALUE;

        // סריקת העובדים הפוטנציאליים לאיתור העובד בעל עומס העבודה הנמוך ביותר כרגע
        for (Worker worker : potentialWorkers) {
            // שליפת כמות המשימות הפעילות (שטרם הושלמו) המשויכות לעובד הנוכחי מה-Database
            int currentTasksCount = taskRep.findByAssignedWorkerIdAndStatusNot(worker.getId(), Task.TaskStatus.COMPLETED).size();

            // בדיקה האם עובד זה פחות עמוס מהעובדים שנבדקו עד כה
            if (currentTasksCount < minTasks) {
                minTasks = currentTasksCount;
                leastBusyWorker = worker;
            }
        }

        // ביצוע השיוך האוטומטי לעובד שנבחר ועדכון סטטוס המשימה ל-IN_PROGRESS
        if (leastBusyWorker != null) {
            task.setAssignedWorker(leastBusyWorker);
            task.setStatus(Task.TaskStatus.IN_PROGRESS);
            task.setUpdatedAt(LocalDateTime.now());
            taskRep.save(task);

            // רישום לוג מערכת מובנה למעקב וניטור פעולות האוטומציה
            System.out.println("AUTO-LOG: Automated system assigned task " + task.getId() + " to " + leastBusyWorker.getName() + " (Current total tasks: " + (minTasks + 1) + ")");
        }
    }

    // --- 5. ניהול סבב עבודה (מנהל או עובד שלוקח לעצמו) ---

    @Transactional
    public Task assignTask(Long taskId, Worker worker) {
        return taskRep.findById(taskId).map(task -> {
            if (task.getStatus() != Task.TaskStatus.OPEN) {
                throw new RuntimeException("Task is already taken or completed");
            }
            task.setAssignedWorker(worker);
            task.setStatus(Task.TaskStatus.IN_PROGRESS);
            task.setUpdatedAt(LocalDateTime.now());
            if (task.getType() == Task.TaskType.CHARGE) {
                task.getScooter().setStatus(Scooter.ScooterStatus.CHARGING);
            }
            return taskRep.save(task);
        }).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    @Transactional
    public void completeTask(Long taskId) {
        taskRep.findById(taskId).ifPresentOrElse(task -> {
            task.setStatus(Task.TaskStatus.COMPLETED);
            task.setUpdatedAt(LocalDateTime.now());
            Scooter scooter = task.getScooter();
            if (task.getType() == Task.TaskType.CHARGE || task.getType() == Task.TaskType.REPAIR) {
                scooter.setBatteryLevel(100);
                scooter.setStatus(Scooter.ScooterStatus.AVAILABLE);
            }
            scooterRep.save(scooter);
            taskRep.save(task);
            System.out.println("LOG: Task " + taskId + " marked as COMPLETED.");
        }, () -> { throw new RuntimeException("Task not found"); });
    }

    private int calculateUrgency(int battery) {
        return battery < 10 ? 10 : (battery < 15 ? 7 : 5);
    }
}