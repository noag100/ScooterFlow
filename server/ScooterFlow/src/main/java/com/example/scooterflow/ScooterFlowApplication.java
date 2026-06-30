package com.example.scooterflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // 2. הפעלת מנגנון התזמון בפרויקט
public class ScooterFlowApplication {
	public static void main(String[] args) {
		SpringApplication.run(ScooterFlowApplication.class, args);
	}
}