package com.example.scooterflow.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * מחלקת המשימה - ה"לב" של הלוגיקה המקשרת בין עובד לקורקינט.
 * @DynamicUpdate מעדכן ב-DB רק את השדות שהשתנו (חוסך משאבים).
 */
@Entity
@Table(name = "tasks")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@ToString
@DynamicUpdate
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // מזהה ייחודי אוטומטי

    /**
     * @ManyToOne - משימה אחת קשורה לקורקינט אחד.
     * @JoinColumn - יוצר עמודת מפתח זר (Foreign Key) בטבלה.
     * nullable = false - מבטיח שלא תהיה משימה בלי קורקינט.
     */
    @ManyToOne
    @JoinColumn(name = "scooter_id", nullable = false)
    private Scooter scooter;

    /**
     * העובד שמשויך למשימה.
     * יכול להיות Null אם המשימה טרם שובצה לעובד מסוים.
     */
    @ManyToOne
    @JoinColumn(name = "worker_id")
    private Worker assignedWorker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskType type; // סוג: טעינה, תיקון או הזזה

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status; // סטטוס: פתוח, בביצוע, הושלם

    private int urgency; // דחיפות (1-10) לצורך מיון ב-UI

    /**
     * @CreationTimestamp - Hibernate מזריק אוטומטית את זמן היצירה.
     * לא צריך להגדיר ידנית בקוד!
     */
    @CreationTimestamp
    @Column(updatable = false) // זמן היצירה לעולם לא משתנה
    private LocalDateTime createdAt;

    /**
     * @UpdateTimestamp - מתעדכן אוטומטית בכל פעם שמעדכנים את השורה (למשל שינוי סטטוס).
     */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // --- Enums לניהול סוגי וסטטוסי המשימות ---

    public enum TaskType {
        CHARGE,    // טעינת סוללה
        REPAIR,    // תיקון תקלה
        RELOCATE   // הזזה לאזור ביקוש
    }

    public enum TaskStatus {
        OPEN,        // ממתינה בתור
        IN_PROGRESS, // עובד התחיל לטפל
        COMPLETED    // המשימה בוצעה והקורקינט חזר לשטח
    }
}