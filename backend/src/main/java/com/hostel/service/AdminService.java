package com.hostel.service;

import com.hostel.model.Admin;
import com.hostel.repository.AdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    public Admin createAdmin(String username, String password, String name, String role) {
        if (adminRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Admin with username '" + username + "' already exists.");
        }
        Admin admin = new Admin(username, password, name, role);
        return adminRepository.save(admin);
    }

    public Optional<Admin> getAdminById(String id) {
        return adminRepository.findById(id);
    }

    public Optional<Admin> findByUsername(String username) {
        return adminRepository.findByUsername(username);
    }

    public Optional<Admin> authenticateAdmin(String username, String password) {
        return adminRepository.findByUsernameAndPassword(username, password);
    }

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    public Admin updateAdmin(String id, Admin adminData) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found: " + id));
        if (adminData.getName() != null) admin.setName(adminData.getName());
        if (adminData.getEmail() != null) admin.setEmail(adminData.getEmail());
        if (adminData.getMobile() != null) admin.setMobile(adminData.getMobile());
        if (adminData.getRole() != null) admin.setRole(adminData.getRole());
        return adminRepository.save(admin);
    }

    public void deleteAdmin(String id) {
        adminRepository.deleteById(id);
    }

    // Initialize default admins if none exist
    public void initializeDefaultAdmins() {
        if (adminRepository.count() == 0) {
            createAdmin("admin1", "admin@123", "Mr. J.B.Jadhav", "Warden");
            createAdmin("admin2", "hostel@456", "A.m.Ranade", "Assistant Warden");
        }
    }
}