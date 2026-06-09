package com.hostel.controller;

import com.hostel.model.Admin;
import com.hostel.model.Student;
import com.hostel.repository.StudentRepository;
import com.hostel.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminService adminService;
    private final StudentRepository studentRepository;

    public AuthController(AdminService adminService, StudentRepository studentRepository) {
        this.adminService = adminService;
        this.studentRepository = studentRepository;
    }

    @PostMapping("/admin/login")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "");
        String password = body.getOrDefault("password", "");

        Optional<Admin> admin = adminService.authenticateAdmin(username, password);
        if (admin.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid admin credentials."));
        }

        Admin a = admin.get();
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("role", "admin");
        res.put("id", a.getId());
        res.put("name", a.getName());
        res.put("adminRole", a.getRole());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/student/login")
    public ResponseEntity<Map<String, Object>> studentLogin(@RequestBody Map<String, String> body) {
        String loginId = body.getOrDefault("loginId", "");
        String password = body.getOrDefault("password", "");

        Optional<Student> opt = studentRepository.findByLoginId(loginId);
        if (opt.isEmpty() || !opt.get().getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid student credentials."));
        }

        Student s = opt.get();
        if ("blocked".equals(s.getStatus()))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Account blocked. Contact warden."));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true); res.put("role", "student");
        res.put("id", s.getId()); res.put("name", s.getName());
        res.put("roomNo", s.getRoomNo()); res.put("wing", s.getWing());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }
}
