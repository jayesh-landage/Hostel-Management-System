package com.hostel.repository;

import com.hostel.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {

    List<Room> findByStatus(String status);

    List<Room> findByWing(String wing);

    List<Room> findByWingAndStatus(String wing, String status);

    List<Room> findByWingAndFloor(String wing, String floor);

    List<Room> findByWingAndStatusAndFloor(String wing, String status, String floor);

    long countByStatus(String status);

    long countByWing(String wing);
}
