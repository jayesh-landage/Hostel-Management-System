package com.hostel.controller;

import com.hostel.model.Notice;
import com.hostel.repository.NoticeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeRepository noticeRepository;

    public NoticeController(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notice>> getAllNotices() {
        return ResponseEntity.ok(noticeRepository.findAllByOrderByDateDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notice> getNotice(@PathVariable String id) {
        Optional<Notice> notice = noticeRepository.findById(id);
        return notice.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Notice>> getNoticesByPriority(@PathVariable String priority) {
        return ResponseEntity.ok(noticeRepository.findByPriority(priority));
    }

    @PostMapping
    public ResponseEntity<Notice> createNotice(@RequestBody Map<String, String> body) {
        Notice notice = new Notice(
                "ann" + System.currentTimeMillis(),
                body.get("title"), body.get("content"),
                body.getOrDefault("priority", "medium"),
                body.getOrDefault("author", "Admin")
        );
        notice.setDate(LocalDate.now());
        return ResponseEntity.ok(noticeRepository.save(notice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notice> updateNotice(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<Notice> optNotice = noticeRepository.findById(id);
        if (optNotice.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Notice notice = optNotice.get();
        if (body.get("title") != null) notice.setTitle(body.get("title"));
        if (body.get("content") != null) notice.setContent(body.get("content"));
        if (body.get("priority") != null) notice.setPriority(body.get("priority"));
        if (body.get("author") != null) notice.setAuthor(body.get("author"));
        return ResponseEntity.ok(noticeRepository.save(notice));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotice(@PathVariable String id) {
        noticeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Notice deleted."));
    }
}
