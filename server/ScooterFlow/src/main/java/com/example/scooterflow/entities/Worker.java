package com.example.scooterflow.entities;

import jakarta.persistence.*;
import lombok.*;

/**
 * ייצוג עובד במערכת ScooterFlow.
 * כולל פרטי התחותי שיוכל לעזברות ותפקיד לניהול הרשאות בסיסי.
 */
@Entity
@Table(name = "workers")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@ToString(exclude = "password") // אבטחה בסיסית: לא להדפיס סיסמה בלוגים
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // שם מלא לתצוגה

    @Column(unique = true, nullable = false)
    private String username; // שם המשתמש ללוגין

    @Column(nullable = false)
    private String password; // סיסמה

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    private boolean isAvailable = true; // האם העובד פנוי למשימה חדשה?

    // הגדרת התפקידים כ-Enum בתוך המחלקה או באותו הקובץ
    public enum Role {
        TECHNICIAN, // טכנאי
        CHARGER,    // טוען סוללות
        LOGISTICS,  // לוגיסטיקה/הזזה
        ADMIN       // מנהל מערכת
    }
}