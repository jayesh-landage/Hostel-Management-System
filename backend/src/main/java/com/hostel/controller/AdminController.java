package com.hostel.controller;

import com.hostel.model.Room;
import com.hostel.model.Student;
import com.hostel.service.RoomAllocationService;
import com.hostel.service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final StudentService studentService;
    private final RoomAllocationService roomService;

    public AdminController(StudentService studentService, RoomAllocationService roomService) {
        this.studentService = studentService;
        this.roomService = roomService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("studentStats", studentService.getDashboardStats());
        data.put("roomStats", roomService.getOccupancyStats());
        data.put("recentStudents", studentService.getAllStudents().stream()
                .filter(s -> "active".equals(s.getStatus())).limit(5).toList());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/students")
    public ResponseEntity<List<Student>> getAllStudents(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "wing", required = false) String wing) {
        if (status != null && !status.isBlank()) return ResponseEntity.ok(studentService.getStudentsByStatus(status));
        if (wing   != null && !wing.isBlank())   return ResponseEntity.ok(studentService.getStudentsByWing(wing));
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<Student> getStudent(@PathVariable("id") String id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/students/search")
    public ResponseEntity<List<Student>> searchStudents(@RequestParam("q") String q) {
        return ResponseEntity.ok(studentService.searchStudents(q));
    }

    @PostMapping("/students/register")
    public ResponseEntity<Map<String, Object>> registerStudent(
            @RequestBody StudentService.StudentRegistrationRequest req,
            @RequestParam(name = "wing", required = false) String wing,
            @RequestParam(name = "floor", required = false) String floor,
            @RequestParam(name = "manualRoom", required = false) String manualRoom) {
        try {
            Student student = studentService.registerStudent(req);
            Room room = roomService.allocateRoom(student.getId(), wing, floor, manualRoom);
            return ResponseEntity.ok(Map.of("success", true, "student", student,
                    "allocatedRoom", room, "message", "Student registered. Room " + room.getId() + " allocated."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable("id") String id,
                                                  @RequestBody StudentService.StudentUpdateRequest req) {
        return ResponseEntity.ok(studentService.updateStudent(id, req));
    }

    @PutMapping("/students/{id}/status")
    public ResponseEntity<Student> setStudentStatus(@PathVariable("id") String id,
                                                     @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(studentService.setStudentStatus(id, body.get("status")));
    }

    @PostMapping("/students/{id}/checkout")
    public ResponseEntity<Map<String, Object>> checkoutStudent(@PathVariable("id") String id) {
        try {
            // Check if all fines are paid
            Map<String, Object> refund = studentService.calculateCheckoutRefund(id);
            boolean allFinesPaid = (boolean) refund.getOrDefault("allFinesPaid", false);
            
            if (!allFinesPaid) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, 
                    "message", "Cannot checkout: Student has pending fines",
                    "pendingFines", refund.get("pendingFines")
                ));
            }
            
            // Proceed with checkout
            roomService.vacateRoom(id);
            studentService.setStudentStatus(id, "left");
            return ResponseEntity.ok(Map.of("success", true, "data", refund, 
                "message", "Checkout successful. Room record deleted and refund calculated."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/rooms/vacant")
    public ResponseEntity<List<Room>> getVacantRooms() {
        return ResponseEntity.ok(roomService.getVacantRooms());
    }

    @GetMapping("/rooms/stats")
    public ResponseEntity<Map<String, Object>> getRoomStats() {
        return ResponseEntity.ok(roomService.getOccupancyStats());
    }

    @GetMapping("/rooms/wing/{wing}")
    public ResponseEntity<List<Room>> getRoomsByWing(@PathVariable("wing") String wing) {
        return ResponseEntity.ok(roomService.getRoomsByWing(wing));
    }

    @PostMapping("/rooms/allocate")
    public ResponseEntity<Map<String, Object>> allocateRoom(@RequestBody Map<String, String> body) {
        try {
            Room room = roomService.allocateRoom(
                    body.get("studentId"), body.get("wing"), body.get("floor"), body.get("manualRoom"));
            return ResponseEntity.ok(Map.of("success", true, "room", room,
                    "message", "Room " + room.getId() + " allocated."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/rooms/shift")
    public ResponseEntity<Map<String, Object>> shiftRoom(@RequestBody Map<String, String> body) {
        try {
            Room room = roomService.shiftRoom(body.get("studentId"), body.get("newRoomId"), body.get("reason"));
            return ResponseEntity.ok(Map.of("success", true, "newRoom", room,
                    "message", "Student shifted to room " + room.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/rooms/{roomId}/maintenance")
    public ResponseEntity<Map<String, Object>> setRoomMaintenance(@PathVariable("roomId") String roomId,
                                                                   @RequestBody Map<String, Boolean> body) {
        try {
            boolean maintenance = body.getOrDefault("maintenance", false);
            roomService.setRoomMaintenance(roomId, maintenance);
            return ResponseEntity.ok(Map.of("success", true, 
                "message", "Room " + roomId + " status updated to " + (maintenance ? "maintenance" : "vacant")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/rooms/allocation-list")
    public ResponseEntity<List<Map<String, Object>>> getRoomAllocationList() {
        try {
            List<Room> allRooms = roomService.getAllRooms();
            List<Map<String, Object>> list = allRooms.stream().map(room -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("roomId", room.getId());
                entry.put("wing", room.getWing());
                entry.put("floor", room.getFloor());
                entry.put("status", room.getStatus());
                entry.put("studentId", room.getStudentId());
                
                if (room.getStudentId() != null) {
                    studentService.getStudentById(room.getStudentId()).ifPresent(s -> {
                        entry.put("studentName", s.getName());
                        entry.put("studentRegNo", s.getRegNo());
                    });
                }
                return entry;
            }).toList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/students/{id}/payment")
    public ResponseEntity<Student> addPayment(@PathVariable("id") String id,
                                               @RequestBody Map<String, Double> body) {
        return ResponseEntity.ok(studentService.addPayment(id, body.get("amount")));
    }

    @PostMapping("/students/{id}/fine")
    public ResponseEntity<Student> addFine(@PathVariable("id") String id,
                                            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(studentService.addFine(id,
                (String) body.get("reason"),
                ((Number) body.get("amount")).doubleValue()));
    }

    @PutMapping("/students/{sid}/fine/{fid}/paid")
    public ResponseEntity<Student> markFinePaid(@PathVariable("sid") String sid, @PathVariable("fid") String fid) {
        return ResponseEntity.ok(studentService.markFinePaid(sid, fid));
    }

    @PostMapping("/students/{id}/accessories")
    public ResponseEntity<Student> issueAccessories(@PathVariable("id") String id,
                                                     @RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(studentService.issueAccessories(id, body.get("items")));
    }

    @DeleteMapping("/students/{sid}/accessories/{item}")
    public ResponseEntity<Student> returnAccessory(@PathVariable("sid") String sid, @PathVariable("item") String item) {
        return ResponseEntity.ok(studentService.returnAccessory(sid, item));
    }

    @GetMapping("/students/{id}/deposit")
    public ResponseEntity<Map<String, Object>> getStudentDeposit(@PathVariable("id") String id) {
        return studentService.getStudentById(id).map(s -> {
            Map<String, Object> deposit = new HashMap<>();
            deposit.put("studentId", id);
            deposit.put("studentName", s.getName());
            if (s.getDeposit() != null) {
                deposit.put("total", s.getDeposit().getTotal());
                deposit.put("paid", s.getDeposit().getPaid());
                deposit.put("pending", s.getDeposit().getPending());
                deposit.put("status", s.getDeposit().getPaymentStatus());
            } else {
                deposit.put("total", 15000);
                deposit.put("paid", 0);
                deposit.put("pending", 15000);
                deposit.put("status", "pending");
            }
            return ResponseEntity.ok(deposit);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/deposits")
    public ResponseEntity<List<Map<String, Object>>> getAllDeposits() {
        try {
            List<Map<String, Object>> deposits = studentService.getAllStudents().stream()
                .filter(s -> "active".equals(s.getStatus()))
                .map(s -> {
                    Map<String, Object> dep = new HashMap<>();
                    dep.put("studentId", s.getId());
                    dep.put("studentName", s.getName());
                    dep.put("regNo", s.getRegNo());
                    if (s.getDeposit() != null) {
                        dep.put("total", s.getDeposit().getTotal());
                        dep.put("paid", s.getDeposit().getPaid());
                        dep.put("pending", s.getDeposit().getPending());
                        dep.put("status", s.getDeposit().getPaymentStatus());
                    }
                    return dep;
                }).toList();
            return ResponseEntity.ok(deposits);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/students/{id}/fines")
    public ResponseEntity<List<Map<String, Object>>> getStudentFines(@PathVariable("id") String id) {
        return studentService.getStudentById(id).map(s -> {
            List<Map<String, Object>> fines = s.getFines().stream().map(f -> {
                Map<String, Object> fine = new HashMap<>();
                fine.put("id", f.getId());
                fine.put("reason", f.getReason());
                fine.put("amount", f.getAmount());
                fine.put("date", f.getDate());
                fine.put("status", f.getStatus());
                return fine;
            }).toList();
            return ResponseEntity.ok(fines);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/fines")
    public ResponseEntity<List<Map<String, Object>>> getAllFines() {
        try {
            List<Map<String, Object>> allFines = studentService.getAllStudents().stream()
                .filter(s -> "active".equals(s.getStatus()))
                .flatMap(s -> s.getFines().stream().map(f -> {
                    Map<String, Object> fine = new HashMap<>();
                    fine.put("studentId", s.getId());
                    fine.put("studentName", s.getName());
                    fine.put("regNo", s.getRegNo());
                    fine.put("fineId", f.getId());
                    fine.put("reason", f.getReason());
                    fine.put("amount", f.getAmount());
                    fine.put("date", f.getDate());
                    fine.put("status", f.getStatus());
                    return fine;
                })).toList();
            return ResponseEntity.ok(allFines);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/students/{id}/complaints")
    public ResponseEntity<List<Map<String, Object>>> getStudentComplaints(@PathVariable("id") String id) {
        return studentService.getStudentById(id).map(s -> {
            List<Map<String, Object>> complaints = s.getComplaints().stream().map(c -> {
                Map<String, Object> complaint = new HashMap<>();
                complaint.put("id", c.getId());
                complaint.put("title", c.getTitle());
                complaint.put("description", c.getDescription());
                complaint.put("date", c.getDate());
                complaint.put("status", c.getStatus());
                return complaint;
            }).toList();
            return ResponseEntity.ok(complaints);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/complaints")
    public ResponseEntity<List<Map<String, Object>>> getAllComplaints() {
        try {
            List<Map<String, Object>> allComplaints = studentService.getAllStudents().stream()
                .flatMap(s -> s.getComplaints().stream().map(c -> {
                    Map<String, Object> complaint = new HashMap<>();
                    complaint.put("studentId", s.getId());
                    complaint.put("studentName", s.getName());
                    complaint.put("complaintId", c.getId());
                    complaint.put("title", c.getTitle());
                    complaint.put("description", c.getDescription());
                    complaint.put("date", c.getDate());
                    complaint.put("status", c.getStatus());
                    return complaint;
                })).toList();
            return ResponseEntity.ok(allComplaints);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/notifications/all")
    public ResponseEntity<Map<String, String>> notifyAll(@RequestBody Map<String, String> body) {
        studentService.sendNotificationToAll(body.get("title"), body.get("message"), body.get("type"));
        return ResponseEntity.ok(Map.of("message", "Notification sent to all students."));
    }

    @PostMapping("/notifications/wing/{wing}")
    public ResponseEntity<Map<String, String>> notifyWing(@PathVariable("wing") String wing,
                                                           @RequestBody Map<String, String> body) {
        studentService.sendNotificationToWing(wing, body.get("title"), body.get("message"), body.get("type"));
        return ResponseEntity.ok(Map.of("message", "Notification sent to " + wing + " Wing."));
    }

    @PostMapping("/notifications/student/{id}")
    public ResponseEntity<Student> notifyStudent(@PathVariable("id") String id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(studentService.sendNotification(id, body.get("title"), body.get("message"), body.get("type")));
    }
}
