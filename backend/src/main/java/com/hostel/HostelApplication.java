package com.hostel;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.hostel.model.Notice;
import com.hostel.model.Room;
import com.hostel.model.Student;
import com.hostel.repository.NoticeRepository;
import com.hostel.repository.RoomRepository;
import com.hostel.repository.StudentRepository;
import com.hostel.service.AdminService;
import com.hostel.service.RoomAllocationService;
import com.hostel.service.StudentService;
import com.hostel.service.StudentService.StudentRegistrationRequest;

@SpringBootApplication
public class HostelApplication {

    public static void main(String[] args) {
        SpringApplication.run(HostelApplication.class, args);
    }

    // ---- CORS: allow frontend to call backend ----
    @Bean
    WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }

    // ---- Seed MongoDB on startup (only if empty) ----
    @Bean
    CommandLineRunner seedData(StudentRepository studentRepo,
            RoomRepository roomRepo,
            NoticeRepository noticeRepo,
            AdminService adminService,
            RoomAllocationService roomService,
            StudentService studentService) {
        return args -> {
            System.out.println("  Karmveer Boys Hostel - MongoDB Backend");

            // Initialize default admins
            System.out.println("[INIT] Initializing default admins...");
            adminService.initializeDefaultAdmins();
            System.out.println("[INIT] Admins initialized/loaded: ready for login");

            // Seed rooms only if collection is empty
            if (roomRepo.count() == 0) {
                System.out.println("[INIT] Seeding " + 184 + " rooms into MongoDB...");
                List<Room> rooms = roomService.generateAllRooms();
                roomRepo.saveAll(rooms);
                System.out.println("[INIT] Rooms saved: " + roomRepo.count());
            } else {
                System.out.println("[INIT] Rooms already exist: " + roomRepo.count());
            }

            // Seed students only if collection is empty
            if (studentRepo.count() == 0) {
                System.out.println("[SEED] Seeding sample students...");
                seedStudents(studentService, roomService);
            } else {
                System.out.println("[SEED] Students already exist: " + studentRepo.count());
            }

            // Seed notices only if empty
            if (noticeRepo.count() == 0) {
                System.out.println("[SEED] Seeding notices...");
                noticeRepo.saveAll(List.of(
                        new Notice("ann1", "Hostel Fee Deadline",
                                "All students must pay monthly hostel fee by 10th of every month. Late payment fine: Rs.100/day.",
                                "high", "Dr. Ramesh Patil"),
                        new Notice("ann2", "Water Supply Interruption",
                                "Water supply will be interrupted on 5th Nov from 6 AM to 8 AM. Please store water.",
                                "medium", "Mr. Suresh Kumar"),
                        new Notice("ann3", "Annual Hostel Inspection",
                                "Annual room inspection on 15th November. Maintain cleanliness.",
                                "high", "Dr. Ramesh Patil"),
                        new Notice("ann4", "Diwali Vacation Schedule",
                                "Hostel remains open during Diwali. Students going home must inform warden by 10th Nov.",
                                "low", "Mr. Suresh Kumar")
                ));
            }

            System.out.println("[READY] Backend running at https://karmveer-boys-hostel-s1t1.onrender.com");
            System.out.println("[DB]    MongoDB: karmveer_hostel");
            System.out.println("[API]   Students: " + studentRepo.count());
            System.out.println("[API]   Rooms:    " + roomRepo.count());
        };
    }

    private void seedStudents(StudentService studentService, RoomAllocationService roomService) {
        Object[][] data = {
            {"Arjun Sharma", "2024BCE001", "Computer Engineering", "2nd Year", "9876543210", "Rajesh Sharma", "9876543200", "stu@123", "A", "Ground Floor", 15000, 15000},
            {"Rahul Deshmukh", "2024BME002", "Mechanical Engineering", "1st Year", "9823456789", "Vijay Deshmukh", "9823456700", "stu@456", "B", "1st Floor", 15000, 10000},
            {"Vikram Yadav", "2024BCE003", "Civil Engineering", "3rd Year", "9765432100", "Mohan Yadav", "9765432000", "stu@789", "C", "2nd Floor", 15000, 15000},
            {"Amit Kulkarni", "2024BEE004", "Electrical Engineering", "4th Year", "9654321098", "Sunil Kulkarni", "9654321000", "stu@321", "D", "3rd Floor", 15000, 15000}
        };

        for (Object[] d : data) {
            try {
                StudentRegistrationRequest req = new StudentRegistrationRequest();
                req.setName((String) d[0]);
                req.setRegNo((String) d[1]);
                req.setCourse("B.Tech");
                req.setBranch((String) d[2]);
                req.setYear((String) d[3]);
                req.setMobile((String) d[4]);
                req.setParentName((String) d[5]);
                req.setParentMobile((String) d[6]);
                req.setPassword((String) d[7]);
                req.setAdmissionDate(LocalDate.now());
                req.setCheckinDate(LocalDate.now());
                req.setDepositTotal(((Number) d[10]).doubleValue());
                req.setDepositPaid(((Number) d[11]).doubleValue());

                Student s = studentService.registerStudent(req);
                roomService.allocateRoom(s.getId(), (String) d[8], (String) d[9], null);
                System.out.println("  Registered: " + s.getName() + " → " + s.getId());
            } catch (Exception e) {
                System.out.println("  Seed skip: " + d[0] + " — " + e.getMessage());
            }
        }
    }
}
