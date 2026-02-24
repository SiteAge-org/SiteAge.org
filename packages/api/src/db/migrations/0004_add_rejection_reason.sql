-- Migration: 0004_add_rejection_reason
-- Add rejection_reason column to evidence table for admin feedback

ALTER TABLE evidence ADD COLUMN rejection_reason TEXT;
