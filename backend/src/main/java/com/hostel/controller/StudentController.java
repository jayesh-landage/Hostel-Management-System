package com.hostel.controller;

import com.hostel.model.Student;
import com.hostel.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Student> getProfile(@PathVariable("id") String id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, String>> changePassword(@PathVariable("id") String id,
                                                               @RequestBody Map<String, String> body) {
        try {
            studentService.changePassword(id, body.get("oldPassword"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/complaint")
    public ResponseEntity<Student> fileComplaint(@PathVariable("id") String id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(studentService.fileComplaint(id, body.get("title"), body.get("description")));
    }

    @PutMapping("/{id}/notifications/{notifId}/read")
    public ResponseEntity<Student> markNotifRead(@PathVariable("id") String id, @PathVariable("notifId") String notifId) {
        return ResponseEntity.ok(studentService.markNotificationRead(id, notifId));
    }

    @GetMapping("/{id}/fines")
    public ResponseEntity<Object> getFines(@PathVariable("id") String id) {
        return ResponseEntity.ok(studentService.getPendingFines(id));
    }
}
