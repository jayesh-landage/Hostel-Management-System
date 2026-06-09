package com.hostel.model;

import java.time.LocalDate;

public class Complaint {

    private String id;
    private String title;
    private String description;
    private LocalDate date;
    private String status;

    public Complaint() {
    }

    public Complaint(String id, String title, String description) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.date = LocalDate.now();
        this.status = "open";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}