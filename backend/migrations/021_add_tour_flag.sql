-- Migration 021: Add onboarding tour completion flag to users table
-- Allows the frontend to know whether to auto-start the walkthrough on first login

ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN NOT NULL DEFAULT FALSE;
