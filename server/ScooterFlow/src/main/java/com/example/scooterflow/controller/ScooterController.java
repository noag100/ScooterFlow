package com.example.scooterflow.controller;

import com.example.scooterflow.entities.Scooter;
import com.example.scooterflow.entities.Task;
import com.example.scooterflow.entities.Worker;
import com.example.scooterflow.repositories.ScooterRep;
import com.example.scooterflow.repositories.TaskRep;
import com.example.scooterflow.repositories.WorkerRep;
import com.example.scooterflow.service.ScooterService;
import com.example.scooterflow.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * בקר (Controller) לניהול מערך הקורקינטים והפקת נתונים סטטיסטיים ללוח הבקרה.
 * מאפשר פעולות CRUD בסיסיות וכן ריכוז נתונים תפעוליים בזמן אמת.
 */
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/scooters")
public class ScooterController {

    @Autowired
    private ScooterService scooterService;

    @Autowired
    private ScooterRep scooterRep;

    @Autowired
    private TaskRep taskRep;

    @Autowired
    private WorkerRep workerRep;

    @Autowired
    private TaskService taskService;

    // --- 1. ניהול נתונים בסיסי (CRUD) ---

    /**
     * שליפת כל הקורקינטים הקיימים במערכת.
     * משמש להצגת מיקומי הצי בזמן אמת על גבי רכיב המפה בלוח הבקרה.
     */
    @GetMapping
    public List<Scooter> getAll() {
        return scooterService.getAllScooters();
    }

    /**
     * הוספת קורקינט חדש לצי המערכת.
     */
    @PostMapping
    public Scooter add(@RequestBody Scooter scooter) {
        return scooterService.addScooter(scooter);
    }

    /**
     * עדכון פרטי קורקינט קיים (סטטוס, סוללה או מיקום) על פי מזהה.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Scooter> update(@PathVariable Long id, @RequestBody Scooter updatedScooter) {
        return scooterRep.findById(id).map(scooter -> {
            scooter.setBatteryLevel(updatedScooter.getBatteryLevel());
            scooter.setStatus(updatedScooter.getStatus());
            scooter.setLatitude(updatedScooter.getLatitude());
            scooter.setLongitude(updatedScooter.getLongitude());
            if (updatedScooter.getLastUsed() != null) {
                scooter.setLastUsed(updatedScooter.getLastUsed());
            }
            Scooter saved = scooterRep.save(scooter);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * מחיקת קורקינט מהמערכת על פי מזהה ייחודי.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        scooterService.deleteScooter(id);
    }

    // --- 2. לוגיקת בקרה וסטטיסטיקה (Dashboard API) ---

    /**
     * נקודת קצה (Endpoint) המרכזת את כל מדדי הביצוע (KPIs) והנתונים עבור לוח הבקרה.
     * הפונקציה מחזירה אובייקט בודד המכיל נתונים מובנים לגרפים, ובכך חוסכת
     * מהרכיב הקדמי (Frontend) לבצע מספר רב של פניות נפרדות לשרת.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // שליפת נתונים גולמיים ממאגר הנתונים
        List<Scooter> allScooters = scooterRep.findAll();
        long openTasksCount = taskRep.findAll().stream()
                .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED)
                .count();
        // חישוב מדדי ביצוע מרכזיים (KPIs)
        int total = allScooters.size();

        // הגדרת מצב קריטי עבור קורקינטים עם 10 אחוזי סוללה ומטה
        long critical = allScooters.stream().filter(s -> s.getBatteryLevel() <= 10).count();

        double avgBattery = allScooters.stream().mapToInt(Scooter::getBatteryLevel).average().orElse(0);
        long inUseCount = allScooters.stream().filter(s -> s.getStatus() == Scooter.ScooterStatus.IN_USE).count();

        stats.put("totalScooters", total);
        stats.put("criticalCount", critical);
        stats.put("avgBattery", Math.round(avgBattery));
        stats.put("openTasks", openTasksCount);
        stats.put("utilizationPct", total > 0 ? Math.round((double) inUseCount / total * 100) : 0);

        // עיבוד נתונים עבור גרף התפלגות רמות הסוללה בצי (Battery Area Chart)
        List<Map<String, Object>> batteryChart = List.of(
                createChartData("0-20%", allScooters.stream().filter(s -> s.getBatteryLevel() <= 20).count()),
                createChartData("21-40%", allScooters.stream().filter(s -> s.getBatteryLevel() > 20 && s.getBatteryLevel() <= 40).count()),
                createChartData("41-60%", allScooters.stream().filter(s -> s.getBatteryLevel() > 40 && s.getBatteryLevel() <= 60).count()),
                createChartData("61-80%", allScooters.stream().filter(s -> s.getBatteryLevel() > 60 && s.getBatteryLevel() <= 80).count()),
                createChartData("81-100%", allScooters.stream().filter(s -> s.getBatteryLevel() > 80).count())
        );
        stats.put("batteryChart", batteryChart);

        // עיבוד נתונים עבור גרף עומס משימות פעילות לפי עובד
        // הסינון כולל משימות שסטטוס הביצוע שלהן טרם הושלם
        List<Task> activeTasks = taskRep.findAll().stream()
                .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED)
                .toList();

        // מיפוי וספירה של כמות המשימות המשויכות לכל עובד
        Map<String, Long> workerTaskCounts = new HashMap<>();
        List<Worker> allWorkers = workerRep.findAll();
        for (Worker worker : allWorkers) {
            workerTaskCounts.put(worker.getName(), 0L);
        }
        for (Task task : activeTasks) {
            if (task.getAssignedWorker() != null) {
                String workerName = task.getAssignedWorker().getName();
                workerTaskCounts.put(workerName, workerTaskCounts.getOrDefault(workerName, 0L) + 1);
            }
        }
        List<Map<String, Object>> workerLoadChart = workerTaskCounts.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("name", entry.getKey());
                    data.put("tasksCount", entry.getValue());
                    return data;
                }).toList();
        stats.put("workerLoadChart", workerLoadChart);
        return ResponseEntity.ok(stats);
    }

    /**
     * שליפת כמות הקורקינטים הנמצאים תחת סטטוס תפעולי מסוים.
     */
    @GetMapping("/count")
    public long getCountByStatus(@RequestParam Scooter.ScooterStatus status) {
        return scooterService.countByStatus(status);
    }

    /**
     * מתודת עזר פנימית לבניית מבנה הנתונים הנדרש עבור רכיבי הגרפים.
     */
    private Map<String, Object> createChartData(String name, long value) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", name);
        data.put("value", value);
        return data;
    }

    /**
     * שליפת הקורקינטים המשויכים אך ורק למשימות הפעילות של עובד ספציפי.
     * מונע הצפת המפה בקורקינטים לא רלוונטיים של עובדים אחרים.
     */
    @GetMapping("/worker/{workerId}")
    public List<Scooter> getScootersByWorker(@PathVariable Long workerId) {
        return taskService.getTasksByWorker(workerId).stream()
                .map(Task::getScooter)
                .filter(scooter -> scooter != null)
                .distinct() // מונע כפילויות אם במקרה יש שתי משימות לאותו קורקינט
                .toList();
    }
}