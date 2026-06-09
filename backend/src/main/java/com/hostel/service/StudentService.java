package com.hostel.service;

import com.hostel.model.*;
import com.hostel.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private static final String ID_PREFIX = "KBH";

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    // ---- Generate next student ID ----
    private synchronized String generateNextId() {
        List<Student> all = studentRepository.findAll();
        int max = all.stream()
                .mapToInt(s -> {
                    try {
                        return Integer.parseInt(s.getId().replace(ID_PREFIX, ""));
                    } catch (Exception e) {
                        return 20240000;
                    }
                })
                .max().orElse(20240000);
        return ID_PREFIX + (max + 1);
    }

    //  REGISTRATION
    public Student registerStudent(StudentRegistrationRequest req) {
        // Check duplicate regNo
        if (studentRepository.findByRegNo(req.getRegNo()).isPresent()) {
            throw new RuntimeException("Registration number already exists: " + req.getRegNo());
        }

        String newId = generateNextId();
        Student student = new Student(newId, req.getName(), req.getRegNo());
        student.setLoginId(newId);
        student.setPassword(req.getPassword() != null ? req.getPassword() : "stu@123");
        student.setCourse(req.getCourse());
        student.setBranch(req.getBranch());
        student.setYear(req.getYear());
        student.setMobile(req.getMobile());
        student.setParentName(req.getParentName());
        student.setParentMobile(req.getParentMobile());
        student.setEmergencyContact(req.getEmergencyContact());
        student.setAddress(req.getAddress());
        student.setAadhaar(req.getAadhaar());
        student.setAdmissionDate(req.getAdmissionDate() != null ? req.getAdmissionDate() : LocalDate.now());
        student.setCheckinDate(req.getCheckinDate() != null ? req.getCheckinDate() : LocalDate.now());
        student.setStatus("active");

        double total = req.getDepositTotal() > 0 ? req.getDepositTotal() : 15000;
        student.setDeposit(new Deposit(total, req.getDepositPaid()));

        student.getNotifications().add(new Notification(
                "n" + System.currentTimeMillis(),
                "Welcome to Karmveer Boys Hostel!",
                "Your account has been created. Login ID: " + newId,
                "general"
        ));

        return studentRepository.save(student);
    }

    //  QUERIES
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(String id) {
        return studentRepository.findById(id);
    }

    public List<Student> searchStudents(String query) {
        return studentRepository.searchStudents(query);
    }

    public List<Student> getStudentsByWing(String wing) {
        return studentRepository.findByWing(wing);
    }

    public List<Student> getStudentsByStatus(String status) {
        return studentRepository.findByStatus(status);
    }

    //  UPDATE
    public Student updateStudent(String id, StudentUpdateRequest req) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
        if (req.getName() != null) {
            s.setName(req.getName());
        }
        if (req.getMobile() != null) {
            s.setMobile(req.getMobile());
        }
        if (req.getParentName() != null) {
            s.setParentName(req.getParentName());
        }
        if (req.getParentMobile() != null) {
            s.setParentMobile(req.getParentMobile());
        }
        if (req.getAddress() != null) {
            s.setAddress(req.getAddress());
        }
        if (req.getBranch() != null) {
            s.setBranch(req.getBranch());
        }
        if (req.getYear() != null) {
            s.setYear(req.getYear());
        }
        if (req.getEmergencyContact() != null) {
            s.setEmergencyContact(req.getEmergencyContact());
        }
        return studentRepository.save(s);
    }

    public Student changePassword(String id, String oldPassword, String newPassword) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
        if (!s.getPassword().equals(oldPassword)) {
            throw new RuntimeException("Current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }
        s.setPassword(newPassword);
        return studentRepository.save(s);
    }

    public Student setStudentStatus(String id, String status) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
        s.setStatus(status);
        return studentRepository.save(s);
    }

    //  DEPOSIT & PAYMENT
    public Student addPayment(String studentId, double amount) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        if (s.getDeposit() == null) {
            s.setDeposit(new Deposit(15000, 0));
        }
        s.getDeposit().addPayment(amount);
        s.getNotifications().add(0, new Notification(
                "n" + System.currentTimeMillis(), "Payment Received",
                "₹" + (int) amount + " payment recorded successfully.", "fee"));
        return studentRepository.save(s);
    }

    //  FINES
    public Student addFine(String studentId, String reason, double amount) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getFines().add(new Fine("f" + System.currentTimeMillis(), reason, amount, LocalDate.now()));
        if (s.getDeposit() != null) {
            s.getDeposit().setPending(s.getDeposit().getPending() + amount);
        }
        s.getNotifications().add(0, new Notification(
                "n" + System.currentTimeMillis(), "Fine Added",
                "A fine of ₹" + (int) amount + " added. Reason: " + reason, "fine"));
        return studentRepository.save(s);
    }

    public Student markFinePaid(String studentId, String fineId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getFines().stream().filter(f -> f.getId().equals(fineId)).findFirst()
                .ifPresent(f -> f.setStatus("paid"));
        return studentRepository.save(s);
    }

    public List<Fine> getPendingFines(String studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        return s.getFines().stream()
                .filter(f -> "pending".equals(f.getStatus()))
                .collect(Collectors.toList());
    }

    //  ACCESSORIES
    public Student issueAccessories(String studentId, List<String> items) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        Set<String> current = new HashSet<>(s.getAccessories());
        current.addAll(items);
        s.setAccessories(new ArrayList<>(current));
        return studentRepository.save(s);
    }

    public Student returnAccessory(String studentId, String item) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getAccessories().remove(item);
        return studentRepository.save(s);
    }

    //  COMPLAINTS
    public Student fileComplaint(String studentId, String title, String description) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getComplaints().add(new Complaint("c" + System.currentTimeMillis(), title, description));
        return studentRepository.save(s);
    }

    public Student resolveComplaint(String studentId, String complaintId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getComplaints().stream().filter(c -> c.getId().equals(complaintId)).findFirst()
                .ifPresent(c -> c.setStatus("resolved"));
        s.getNotifications().add(0, new Notification(
                "n" + System.currentTimeMillis(), "Complaint Resolved",
                "Your complaint has been resolved by the hostel administration.", "maintenance"));
        return studentRepository.save(s);
    }

    //  NOTIFICATIONS
    public Student sendNotification(String studentId, String title, String message, String type) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getNotifications().add(0, new Notification("n" + System.currentTimeMillis(), title, message, type));
        return studentRepository.save(s);
    }

    public void sendNotificationToAll(String title, String message, String type) {
        studentRepository.findByStatus("active").forEach(s -> {
            s.getNotifications().add(0, new Notification(
                    "n" + System.currentTimeMillis() + s.getId(), title, message, type));
            studentRepository.save(s);
        });
    }

    public void sendNotificationToWing(String wing, String title, String message, String type) {
        studentRepository.findByWing(wing).stream()
                .filter(s -> "active".equals(s.getStatus()))
                .forEach(s -> {
                    s.getNotifications().add(0, new Notification(
                            "n" + System.currentTimeMillis() + s.getId(), title, message, type));
                    studentRepository.save(s);
                });
    }

    public Student markNotificationRead(String studentId, String notifId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        s.getNotifications().stream().filter(n -> n.getId().equals(notifId)).findFirst()
                .ifPresent(n -> n.setRead(true));
        return studentRepository.save(s);
    }

    //  CHECKOUT REFUND
    public boolean hasAllFinesPaid(String studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        return s.getFines().stream()
                .allMatch(f -> "paid".equals(f.getStatus()));
    }

    public Map<String, Object> calculateCheckoutRefund(String studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        Deposit dep = s.getDeposit();
        double totalPaid = dep != null ? dep.getPaid() : 0;
        double pendingFines = s.getFines().stream()
                .filter(f -> "pending".equals(f.getStatus()))
                .mapToDouble(Fine::getAmount).sum();
        double refund = Math.max(0, totalPaid - pendingFines);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", studentId);
        result.put("studentName", s.getName());
        result.put("totalDeposit", dep != null ? dep.getTotal() : 0);
        result.put("totalPaid", totalPaid);
        result.put("pendingFines", pendingFines);
        result.put("refundableAmount", refund);
        result.put("allFinesPaid", pendingFines == 0);
        return result;
    }

    //  DASHBOARD STATS
    public Map<String, Object> getDashboardStats() {
        List<Student> all = studentRepository.findAll();
        long active = all.stream().filter(s -> "active".equals(s.getStatus())).count();
        double totalPending = all.stream()
                .mapToDouble(s -> s.getDeposit() != null ? s.getDeposit().getPending() : 0).sum();
        long openComplaints = all.stream()
                .flatMap(s -> s.getComplaints().stream())
                .filter(c -> "open".equals(c.getStatus())).count();
        return Map.of(
                "totalStudents", all.size(), "activeStudents", active,
                "totalPendingFees", totalPending, "openComplaints", openComplaints);
    }

    //  DTOs
    public static class StudentRegistrationRequest {

        private String name, regNo, course, branch, year, mobile;
        private String parentName, parentMobile, emergencyContact;
        private String address, aadhaar, password;
        private LocalDate admissionDate, checkinDate;
        private double depositTotal, depositPaid;

        public String getName() {
            return name;
        }

        public void setName(String n) {
            this.name = n;
        }

        public String getRegNo() {
            return regNo;
        }

        public void setRegNo(String r) {
            this.regNo = r;
        }

        public String getCourse() {
            return course;
        }

        public void setCourse(String c) {
            this.course = c;
        }

        public String getBranch() {
            return branch;
        }

        public void setBranch(String b) {
            this.branch = b;
        }

        public String getYear() {
            return year;
        }

        public void setYear(String y) {
            this.year = y;
        }

        public String getMobile() {
            return mobile;
        }

        public void setMobile(String m) {
            this.mobile = m;
        }

        public String getParentName() {
            return parentName;
        }

        public void setParentName(String p) {
            this.parentName = p;
        }

        public String getParentMobile() {
            return parentMobile;
        }

        public void setParentMobile(String p) {
            this.parentMobile = p;
        }

        public String getEmergencyContact() {
            return emergencyContact;
        }

        public void setEmergencyContact(String e) {
            this.emergencyContact = e;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String a) {
            this.address = a;
        }

        public String getAadhaar() {
            return aadhaar;
        }

        public void setAadhaar(String a) {
            this.aadhaar = a;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String p) {
            this.password = p;
        }

        public LocalDate getAdmissionDate() {
            return admissionDate;
        }

        public void setAdmissionDate(LocalDate d) {
            this.admissionDate = d;
        }

        public LocalDate getCheckinDate() {
            return checkinDate;
        }

        public void setCheckinDate(LocalDate d) {
            this.checkinDate = d;
        }

        public double getDepositTotal() {
            return depositTotal;
        }

        public void setDepositTotal(double d) {
            this.depositTotal = d;
        }

        public double getDepositPaid() {
            return depositPaid;
        }

        public void setDepositPaid(double d) {
            this.depositPaid = d;
        }
    }

    public static class StudentUpdateRequest {

        private String name, mobile, parentName, parentMobile, address, branch, year, emergencyContact;

        public String getName() {
            return name;
        }

        public void setName(String n) {
            this.name = n;
        }

        public String getMobile() {
            return mobile;
        }

        public void setMobile(String m) {
            this.mobile = m;
        }

        public String getParentName() {
            return parentName;
        }

        public void setParentName(String p) {
            this.parentName = p;
        }

        public String getParentMobile() {
            return parentMobile;
        }

        public void setParentMobile(String p) {
            this.parentMobile = p;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String a) {
            this.address = a;
        }

        public String getBranch() {
            return branch;
        }

        public void setBranch(String b) {
            this.branch = b;
        }

        public String getYear() {
            return year;
        }

        public void setYear(String y) {
            this.year = y;
        }

        public String getEmergencyContact() {
            return emergencyContact;
        }

        public void setEmergencyContact(String e) {
            this.emergencyContact = e;
        }
    }
}