package com.example.scooterflow.service;

import com.example.scooterflow.entities.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskAutomationService {

    @Autowired
    private TaskService taskService;

    /**
     * מחזור אוטומציה תקופתי המופעל באופן מתוזמן.
     * המנגנון סורק את מצב הצי, יוצר משימות עבור כלל הסוגים הנדרשים (טעינה, תיקון, לוגיסטיקה),
     * ומבצע שיוך דינמי של משימות פתוחות לעובדים הרלוונטיים בהתאם לרמת העומס.
     */
    @Scheduled(fixedRate = 60000)
    public void runAutomationCycle() {
        System.out.println("SYSTEM: Starting comprehensive automation scan...");

        // 1. הפעלת סריקה מאוחדת ליצירת כלל סוגי המשימות (טעינה, תיקון ולוגיסטיקה)
        taskService.autoGenerateAllTasks();

        // 2. שליפת משימות פתוחות שטרם שויכו לעובד כלשהו
        List<Task> openTasks = taskService.getOpenUnassignedTasks();

        // 3. הרצת לוגיקת השיוך האוטומטי (המודל ההיברידי) עבור כל משימה פתוחה
        for (Task task : openTasks) {
            taskService.attemptAutoAssignment(task);
        }
    }
}