package com.example.scooterflow.service;

import com.example.scooterflow.entities.Scooter;
import com.example.scooterflow.repositories.ScooterRep; // נתיב ושם מדויקים לפי מבנה הפרויקט
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class SimulationService {

    private final ScooterService scooterService;
    private final TaskService taskService;
    private final ScooterRep scooterRep; // שימוש ישיר ב-Repository שלך לשמירה מרוכזת
    private final Random random = new Random();

    /**
     * בנאי (Constructor) להזרקת כלל התלויות הנדרשות.
     * שיטה זו מונעת לחלוטין אזהרות מסוג Field injection is not recommended ב-IDE.
     */
    public SimulationService(ScooterService scooterService, TaskService taskService, ScooterRep scooterRep) {
        this.scooterService = scooterService;
        this.taskService = taskService;
        this.scooterRep = scooterRep;
    }

    /**
     * מריץ סימולציה מחזורית של פריקת סוללה ושינוי מיקום עבור קורקינטים בצי.
     * התדירות: כל 10 שניות (fixedRate = 10000).
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void simulateBatteryDrain() {
        List<Scooter> scooters = scooterService.getAllScooters();
        boolean hasChanges = false;

        for (Scooter s : scooters) {
            // לוגיקה לקורקינטים בנסיעה פעילה (IN_USE)
            if (s.getStatus() == Scooter.ScooterStatus.IN_USE) {
                // 1. פריקת סוללה אקראית בזמן נסיעה (1-3 אחוזים)
                int drain = random.nextInt(3) + 1;
                s.setBatteryLevel(Math.max(0, s.getBatteryLevel() - drain));

                // 2. עדכון מיקום גיאוגרפי רק בזמן נסיעה (סימולציית תנועה במפה)
                s.setLatitude(s.getLatitude() + (random.nextDouble() - 0.5) * 0.002);
                s.setLongitude(s.getLongitude() + (random.nextDouble() - 0.5) * 0.002);
                hasChanges = true;
            }

            // לוגיקה לקורקינטים חונים/זמינים (AVAILABLE)
            else if (s.getStatus() == Scooter.ScooterStatus.AVAILABLE) {
                // קורקינט חונה מאבד סוללה לאט מאוד בהמתנה (0-1 אחוזים) ומיקומו נותר קבוע ברחוב
                int drain = random.nextInt(2);
                s.setBatteryLevel(Math.max(0, s.getBatteryLevel() - drain));
                hasChanges = true;
            }

            // במידה וכלי זמין או בנסיעה הגיע לרמת סוללה קריטית (מתחת ל-20%)
            // נאלץ שינוי סטטוס אוטומטי ל-CHARGING כדי שלא יופיע כזמין לרכיבה במסך
            if (s.getBatteryLevel() < 20 &&
                    (s.getStatus() == Scooter.ScooterStatus.AVAILABLE || s.getStatus() == Scooter.ScooterStatus.IN_USE)) {
                s.setStatus(Scooter.ScooterStatus.CHARGING);
                hasChanges = true;
            }
        }

        // ביצוע עדכון מרוכז ויעיל (Bulk Update) אחד מול ה-DB במידה והיו שינויים בצי
        if (hasChanges) {
            scooterRep.saveAll(scooters);
            System.out.println("Simulation LOG: Battery and locations calculated and batch-saved directly via ScooterRep.");
        }
    }

    /**
     * מריץ סריקה תקופתית ליצירת כלל סוגי המשימות באופן אוטומטי (טעינה, תיקון ולוגיסטיקה).
     * התדירות: כל 15 שניות (fixedRate = 15000).
     */
    @Scheduled(fixedRate = 15000)
    @Transactional
    public void runAutoTaskGeneration() {
        taskService.autoGenerateAllTasks();
        System.out.println("Simulation LOG: Comprehensive automated task generation check completed.");
    }

    /**
     * מריץ סימולציה אקראית של תקלה טכנית ברכיבי הצי.
     * התדירות: פעם בדקה (fixedRate = 60000).
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void simulateRandomBreakdown() {
        List<Scooter> scooters = scooterService.getAllScooters();
        if (!scooters.isEmpty()) {
            Scooter randomScooter = scooters.get(random.nextInt(scooters.size()));

            // מדווחים על תקלה ומעבירים לתיקון רק אם הכלי היה פנוי וזמין ברחוב
            if (randomScooter.getStatus() == Scooter.ScooterStatus.AVAILABLE) {
                // 1. שינוי סטטוס הכלי ל"בתיקון" והסרתו המיידית מהמפה הציבורית
                randomScooter.setStatus(Scooter.ScooterStatus.IN_REPAIR);
                scooterRep.save(randomScooter); // שמירה ישירה של הישות המעודכנת ל-DB

                // 2. פתיחת משימת תיקון לוגיסטית במערכת המשימות עבור מערך הטכנאים
                taskService.reportScooterDamage(randomScooter.getId());

                System.out.println("Simulation LOG: Scooter ID #" + randomScooter.getId() + " flagged as IN_REPAIR due to random failure simulation.");
            }
        }
    }
}