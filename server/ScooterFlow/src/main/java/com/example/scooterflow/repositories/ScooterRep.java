package com.example.scooterflow.repositories;

import com.example.scooterflow.entities.Scooter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScooterRep extends JpaRepository<Scooter, Long> {

    // מוצא כלים שצריכים טעינה (מתחת לאחוז מסוים) ושאינם בטעינה כרגע
    List<Scooter> findByBatteryLevelLessThanAndStatusNot(int level, Scooter.ScooterStatus status);

    // מוצא כלים שלא השתמשו בהם מאז תאריך מסוים (למשימות הזזה)
    List<Scooter> findByLastUsedBefore(LocalDateTime dateTime);

    @Query("SELECT COUNT(s) FROM Scooter s WHERE s.batteryLevel < 20")
    long countCriticalBattery();

    @Query("SELECT s.status, COUNT(s) FROM Scooter s GROUP BY s.status")
    List<Object[]> getStatusCounts();

    List<Scooter> findByStatus(Scooter.ScooterStatus status);

    List<Scooter> findByLastUsedBeforeAndStatus(java.time.LocalDateTime dateTime, Scooter.ScooterStatus status);}