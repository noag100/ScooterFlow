package com.example.scooterflow.service;

import com.example.scooterflow.entities.Scooter;
import com.example.scooterflow.repositories.ScooterRep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ScooterService - ניהול צי הקורקינטים (The Fleet Manager)
 * אחראי על מצב הכלים בשטח, מיקומם ורמת האנרגיה שלהם.
 */
@Service
public class ScooterService {

    @Autowired
    private ScooterRep scooterRep;

    // --- פעולות בסיסיות (CRUD) לשימוש ב-React ---

    /**
     * מחזיר את כל הקורקינטים להצגה על המפה ובטבלה
     */
    public List<Scooter> getAllScooters() {
        return scooterRep.findAll();
    }

    /**
     * הוספת כלי חדש למערכת דרך ממשק המנהל
     */
    public Scooter addScooter(Scooter scooter) {
        // הגדרת סטטוס ברירת מחדל אם לא נשלח
        if (scooter.getStatus() == null) {
            scooter.setStatus(Scooter.ScooterStatus.AVAILABLE);
        }

        // הגדרת סוללה מלאה לכלי חדש אם לא הוגדר אחרת
        if (scooter.getBatteryLevel() == 0) {
            scooter.setBatteryLevel(100);
        }

        // הגדרת מיקום ברירת מחדל (למשל: תל אביב) אם המיקום לא הוזן
        if (scooter.getLatitude() == 0.0 && scooter.getLongitude() == 0.0) {
            scooter.setLatitude(32.0853);  // קו רוחב דיפולטיבי
            scooter.setLongitude(34.7818); // קו אורך דיפולטיבי
        }

        // עדכון זמן פעילות ראשוני
        scooter.setLastUsed(LocalDateTime.now());

        return scooterRep.save(scooter);
    }

    /**
     * מחיקת כלי מהצי (למשל אם הוא יצא משימוש לצמיתות)
     */
    public void deleteScooter(Long id) {
        scooterRep.deleteById(id);
    }

    // --- לוגיקה עסקית (The "Brain" part) ---

    /**
     * מוצא את כל הכלים שזקוקים לטעינה (מתחת ל-20%)
     * פונקציה זו תשמש את ה-TaskService ליצירת משימות אוטומטיות.
     */
    public List<Scooter> getScootersNeedingCharge() {
        return scooterRep.findByBatteryLevelLessThanAndStatusNot(
                20,
                Scooter.ScooterStatus.CHARGING
        );
    }

    /**
     * שליפת סטטיסטיקה מהירה לדאשבורד (כמה זמינים, כמה בתיקון וכו')
     */
    public long countByStatus(Scooter.ScooterStatus status) {
        return scooterRep.findAll().stream()
                .filter(s -> s.getStatus() == status)
                .count();
    }

    /**
     * עדכון מיקום וסוללה (עבור הסימולציה שרצה ברקע)
     * השתמשנו ב-Transactional כדי להבטיח שהעדכון יתבצע בצורה בטוחה.
     */
    @Transactional
    public void updateScooterStatus(Long id, int newBattery, double lat, double lon) {
        scooterRep.findById(id).ifPresent(s -> {
            s.setBatteryLevel(newBattery);
            s.setLatitude(lat);
            s.setLongitude(lon);
            s.setLastUsed(LocalDateTime.now());
            scooterRep.save(s);
        });
    }

    /**
     * שינוי סטטוס כלי (למשל כשעובד מתחיל להטעין אותו)
     */
    public void changeStatus(Long id, Scooter.ScooterStatus newStatus) {
        scooterRep.findById(id).ifPresent(s -> {
            s.setStatus(newStatus);
            scooterRep.save(s);
        });
    }
}