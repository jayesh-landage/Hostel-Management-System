package com.hostel.repository;

import com.hostel.model.Notice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends MongoRepository<Notice, String> {
    List<Notice> findAllByOrderByDateDesc();
    List<Notice> findByPriority(String priority);
}
