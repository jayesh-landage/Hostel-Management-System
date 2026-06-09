package com.hostel.model;

import java.time.LocalDate;

public class Fine {

    private String id;
    private String reason;
    private double amount;
    private LocalDate date;
    private String status;

    public Fine() {
    }

    public Fine(String id, String reason, double amount, LocalDate date) {
        this.id = id;
        this.reason = reason;
        this.amount = amount;
        this.date = date;
        this.status = "pending";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
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