package com.example.scooterflow.controller;

import com.example.scooterflow.entities.Task;
import com.example.scooterflow.entities.Worker;
import com.example.scooterflow.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    // שליפת כל המשימות - למנהל
    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    // שליפת משימות המשויכות לעובד ספציפי - חשוב למסך המשימות של העובד
    @GetMapping("/worker/{workerId}")
    public List<Task> getTasksByWorker(@PathVariable Long workerId) {
        return taskService.getTasksByWorker(workerId); // וודאי שמתודה זו קיימת ב-Service
    }

    // שליפת משימות לפי סטטוס (למשל רק OPEN)
    @GetMapping("/status/{status}")
    public List<Task> getByStatus(@PathVariable Task.TaskStatus status) {
        return taskService.getTasksByStatus(status);
    }

    // עובד משייך לעצמו משימה פנויה
    @PutMapping("/{taskId}/assign")
    public Task assignTask(@PathVariable Long taskId, @RequestBody Worker worker) {
        return taskService.assignTask(taskId, worker);
    }

    // עובד מסיים משימה - שיניתי ל-POST שיתאים ל-API ב-React
    @PostMapping("/{taskId}/complete")
    public ResponseEntity<?> completeTask(@PathVariable Long taskId) {
        taskService.completeTask(taskId);
        return ResponseEntity.ok().build();
    }

    // דיווח על תקלה בציוד
    @PostMapping("/report-damage/{scooterId}")
    public void reportDamage(@PathVariable Long scooterId) {
        taskService.reportScooterDamage(scooterId);
    }
}