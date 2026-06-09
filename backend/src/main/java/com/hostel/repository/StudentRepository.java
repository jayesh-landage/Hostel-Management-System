package com.hostel.repository;

import com.hostel.model.Student;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {

    Optional<Student> findByLoginId(String loginId);

    List<Student> findByStatus(String status);

    List<Student> findByWing(String wing);

    Optional<Student> findByRegNo(String regNo);

    // Search by name, id, regNo, roomNo (case-insensitive)
    @Query("{ '$or': [ " +
           "{ 'name': { '$regex': ?0, '$options': 'i' } }, " +
           "{ '_id': { '$regex': ?0, '$options': 'i' } }, " +
           "{ 'regNo': { '$regex': ?0, '$options': 'i' } }, " +
           "{ 'roomNo': { '$regex': ?0, '$options': 'i' } }, " +
           "{ 'wing': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    List<Student> searchStudents(String query);
}
