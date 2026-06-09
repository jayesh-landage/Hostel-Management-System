package com.hostel.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "rooms")
public class Room {

    @Id
    private String id;       // e.g. A-101

    @Indexed
    private String wing;     // A | B | C | D

    private String floor;    // Ground Floor | 1st Floor | 2nd Floor | 3rd Floor
    private int floorPrefix; // 1 | 2 | 3 | 4
    private int roomNumber;  // 1..12 or 1..11

    @Indexed
    private String status;   // vacant | occupied | maintenance

    private String studentId;

    public Room() {
    }

    public Room(String wing, String floor, int floorPrefix, int roomNumber) {
        this.wing = wing;
        this.floor = floor;
        this.floorPrefix = floorPrefix;
        this.roomNumber = roomNumber;
        this.id = wing + "-" + floorPrefix + String.format("%02d", roomNumber);
        this.status = "vacant";
        this.studentId = null;
    }

    public boolean isVacant() {
        return "vacant".equals(this.status);
    }

    public boolean isOccupied() {
        return "occupied".equals(this.status);
    }

    public boolean isUnderMaintenance() {
        return "maintenance".equals(this.status);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getWing() {
        return wing;
    }

    public void setWing(String wing) {
        this.wing = wing;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public int getFloorPrefix() {
        return floorPrefix;
    }

    public void setFloorPrefix(int floorPrefix) {
        this.floorPrefix = floorPrefix;
    }

    public int getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(int roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }
}