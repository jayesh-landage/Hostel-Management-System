package com.hostel.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.hostel.model.Room;
import com.hostel.model.Student;
import com.hostel.repository.RoomRepository;
import com.hostel.repository.StudentRepository;

@Service
public class RoomAllocationService {

    private final RoomRepository roomRepository;
    private final StudentRepository studentRepository;

    public static final String[] WINGS = {"A", "B", "C", "D"};
    public static final int[] FLOOR_PREFIXES = {1, 2, 3, 4};
    public static final String[] FLOOR_LABELS = {
        "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"
    };
    public static final Map<String, Integer> ROOMS_PER_FLOOR = Map.of(
            "A", 12, "B", 11, "C", 11, "D", 12
    );

    public RoomAllocationService(RoomRepository roomRepository,
            StudentRepository studentRepository) {
        this.roomRepository = roomRepository;
        this.studentRepository = studentRepository;
    }

    // ---- Generate all 184 rooms ----
    public List<Room> generateAllRooms() {
        List<Room> rooms = new ArrayList<>();
        for (String wing : WINGS) {
            int count = ROOMS_PER_FLOOR.get(wing);
            for (int fp = 0; fp < FLOOR_PREFIXES.length; fp++) {
                for (int r = 1; r <= count; r++) {
                    rooms.add(new Room(wing, FLOOR_LABELS[fp], FLOOR_PREFIXES[fp], r));
                }
            }
        }
        return rooms;
    }

    // ---- Smart Allocation ----
    public Room allocateRoom(String studentId, String wingPref, String floorPref, String manualRoom) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        if (student.getRoomNo() != null && !student.getRoomNo().isEmpty()) {
            throw new RuntimeException("Student already has room: " + student.getRoomNo());
        }

        Room targetRoom;

        if (manualRoom != null && !manualRoom.isBlank()) {
            targetRoom = roomRepository.findById(manualRoom.toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Room not found: " + manualRoom));
            if (!targetRoom.isVacant()) {
                throw new RuntimeException("Room " + manualRoom + " is not available.");
            }
        } else {
            targetRoom = findBestVacantRoom(wingPref, floorPref);
            if (targetRoom == null) {
                throw new RuntimeException("No vacant rooms available"
                        + (wingPref != null ? " in " + wingPref + " wing" : "") + ".");
            }
        }

        targetRoom.setStatus("occupied");
        targetRoom.setStudentId(studentId);
        roomRepository.save(targetRoom);

        student.setRoomNo(targetRoom.getId());
        student.setWing(targetRoom.getWing());
        student.setFloor(targetRoom.getFloor());
        studentRepository.save(student);

        return targetRoom;
    }

    private Room findBestVacantRoom(String wingPref, String floorPref) {
        List<Room> vacant = roomRepository.findByStatus("vacant");
        if (vacant.isEmpty()) {
            return null;
        }

        // Priority 1: Wing + Floor
        if (wingPref != null && floorPref != null) {
            Optional<Room> exact = vacant.stream()
                    .filter(r -> r.getWing().equals(wingPref) && r.getFloor().equals(floorPref))
                    .findFirst();
            if (exact.isPresent()) {
                return exact.get();
            }
        }
        // Priority 2: Wing only
        if (wingPref != null) {
            Optional<Room> wingMatch = vacant.stream()
                    .filter(r -> r.getWing().equals(wingPref)).findFirst();
            if (wingMatch.isPresent()) {
                return wingMatch.get();
            }
        }
        // Priority 3: Floor only
        if (floorPref != null) {
            Optional<Room> floorMatch = vacant.stream()
                    .filter(r -> r.getFloor().equals(floorPref)).findFirst();
            if (floorMatch.isPresent()) {
                return floorMatch.get();
            }
        }
        // Fallback: first available
        return vacant.get(0);
    }

    // ---- Shift Room ----
    public Room shiftRoom(String studentId, String newRoomId, String reason) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        // Vacate old room
        if (student.getRoomNo() != null) {
            roomRepository.findById(student.getRoomNo()).ifPresent(old -> {
                old.setStatus("vacant");
                old.setStudentId(null);
                roomRepository.save(old);
            });
        }

        Room newRoom = roomRepository.findById(newRoomId.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Room not found: " + newRoomId));
        if (!newRoom.isVacant()) {
            throw new RuntimeException("Room " + newRoomId + " is not available.");
        }

        newRoom.setStatus("occupied");
        newRoom.setStudentId(studentId);
        roomRepository.save(newRoom);

        student.setRoomNo(newRoom.getId());
        student.setWing(newRoom.getWing());
        student.setFloor(newRoom.getFloor());
        studentRepository.save(student);

        return newRoom;
    }

    // ---- Vacate Room ----
    public void vacateRoom(String studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        if (student.getRoomNo() == null) {
            return;
        }
        roomRepository.findById(student.getRoomNo()).ifPresent(r -> {
            r.setStatus("vacant");
            r.setStudentId(null);
            roomRepository.save(r);
        });
        student.setRoomNo(null);
        student.setStatus("left");
        studentRepository.save(student);
    }

    // ---- Queries ----
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public List<Room> getVacantRooms() {
        return roomRepository.findByStatus("vacant");
    }

    public List<Room> getOccupiedRooms() {
        return roomRepository.findByStatus("occupied");
    }

    public List<Room> getRoomsByWing(String wing) {
        return roomRepository.findByWing(wing);
    }

    public void setRoomMaintenance(String roomId, boolean underMaintenance) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
        if (underMaintenance && room.isOccupied()) {
            throw new RuntimeException("Cannot set occupied room to maintenance.");
        }
        room.setStatus(underMaintenance ? "maintenance" : "vacant");
        roomRepository.save(room);
    }

    public Map<String, Object> getOccupancyStats() {
        List<Room> all = roomRepository.findAll();
        long total = all.size();
        long occupied = all.stream().filter(Room::isOccupied).count();
        long vacant = all.stream().filter(Room::isVacant).count();
        long maintenance = all.stream().filter(Room::isUnderMaintenance).count();
        double pct = total > 0 ? (double) occupied / total * 100 : 0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("occupied", occupied);
        stats.put("vacant", vacant);
        stats.put("maintenance", maintenance);
        stats.put("occupancyPercentage", Math.round(pct * 10.0) / 10.0);

        Map<String, Map<String, Long>> byWing = new LinkedHashMap<>();
        for (String wing : WINGS) {
            long wTotal = all.stream().filter(r -> r.getWing().equals(wing)).count();
            long wOcc = all.stream().filter(r -> r.getWing().equals(wing) && r.isOccupied()).count();
            byWing.put(wing, Map.of("total", wTotal, "occupied", wOcc, "vacant", wTotal - wOcc));
        }
        stats.put("byWing", byWing);
        return stats;
    }
}