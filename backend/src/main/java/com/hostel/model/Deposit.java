package com.hostel.model;

public class Deposit {

    private double total;
    private double paid;
    private double pending;
    private String paymentStatus;

    public Deposit() {
    }

    public Deposit(double total, double paid) {
        this.total = total;
        this.paid = paid;
        this.pending = Math.max(0, total - paid);
        this.paymentStatus = (this.pending == 0) ? "paid" : (paid > 0) ? "partial" : "pending";
    }

    public void addPayment(double amount) {
        this.paid += amount;
        this.pending = Math.max(0, this.total - this.paid);
        this.paymentStatus = (this.pending == 0) ? "paid" : "partial";
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public double getPaid() {
        return paid;
    }

    public void setPaid(double paid) {
        this.paid = paid;
    }

    public double getPending() {
        return pending;
    }

    public void setPending(double pending) {
        this.pending = pending;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String s) {
        this.paymentStatus = s;
    }
}