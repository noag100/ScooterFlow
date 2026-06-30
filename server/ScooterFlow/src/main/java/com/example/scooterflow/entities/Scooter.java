package com.example.scooterflow.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Builder
@Entity
@Table(name = "scooters")
public class Scooter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // מזהה ייחודי (ID)

    @Builder.Default
    private int batteryLevel = 100; // אחוז אנרגיה (0-100)

    @Enumerated(EnumType.STRING)
    private ScooterStatus status; // מצב נוכחי (סטטוס)

    private double latitude; // מיקום גאוגרפי (רוחב)

    private double longitude; // מיקום גאוגרפי (אורך)

    private LocalDateTime lastUsed; // זמן שימוש (עדכון אחרון)

    /**
     * Enum המגדיר את המצבים האפשריים של הקורקינט במערכת
     */
    public enum ScooterStatus {
        AVAILABLE,  // זמין לרכיבה
        CHARGING,   // בטעינה פעילה
        IN_REPAIR,  // בתיקון במעבדה
        IN_USE      // בנסיעה כרגע
    }
}