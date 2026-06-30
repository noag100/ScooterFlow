package com.example.scooterflow.controller;

import com.example.scooterflow.entities.Worker;
import com.example.scooterflow.security.JwtUtils;
import com.example.scooterflow.service.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workers")
public class WorkerController {

    @Autowired
    private WorkerService workerService;

    @Autowired
    private JwtUtils jwtUtils;

    // לוגין: מאמת משתמש, מייצר טוקן ומחזיר פרטים ל-React
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        // אימות המשתמש
        Worker worker = workerService.login(credentials.get("username"), credentials.get("password"));

        // יצירת טוקן JWT
        String token = jwtUtils.generateToken(worker.getUsername(), worker.getRole().name());

        // בניית תשובה מלאה ללקוח
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", worker.getUsername());
        response.put("role", worker.getRole());
        response.put("name", worker.getName());
        response.put("id", worker.getId());

        return ResponseEntity.ok(response);
    }

    // שליפת כל העובדים (למנהל)
    @GetMapping
    public List<Worker> getAll() {
        return workerService.getAllWorkers();
    }

    // הוספת עובד חדש
    @PostMapping
    public Worker add(@RequestBody Worker worker) {
        return workerService.addWorker(worker);
    }

    // עדכון פרטי עובד קיים
    @PutMapping("/{id}")
    public Worker update(@PathVariable Long id, @RequestBody Worker worker) {
        worker.setId(id);
        return workerService.addWorker(worker);
    }

    // מחיקת עובד מהמערכת
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            workerService.deleteWorker(id);
            return ResponseEntity.ok("Worker deleted successfully");
        } catch (IllegalStateException e) {
            // אם העובד לא ניתן למחיקה כי יש לו משימות, נחזיר שגיאה 400 עם ההודעה
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            // לכל שגיאה אחרת שלא צפינו
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred");
        }    }

    // שינוי זמינות (Toggle)
    @PatchMapping("/{id}/availability")
    public void toggleAvailability(@PathVariable Long id) {
        workerService.toggleAvailability(id);
    }
}