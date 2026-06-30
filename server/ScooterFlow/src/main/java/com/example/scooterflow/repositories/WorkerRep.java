package com.example.scooterflow.repositories;

import com.example.scooterflow.entities.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerRep extends JpaRepository<Worker, Long> {

    Optional<Worker> findByUsername(String username);

    // מוצא עובדים פנויים לפי התפקיד שמוגדר בתוך ה-Entity
    List<Worker> findByRoleAndIsAvailableTrue(Worker.Role role);
}