-- Check for active timers
SELECT 
  te.id,
  te.freelancer_id,
  u.full_name,
  u.email,
  p.title as project_title,
  te.description,
  te.start_time,
  EXTRACT(EPOCH FROM (NOW() - te.start_time))/60 as duration_minutes
FROM time_entries te
JOIN users u ON te.freelancer_id = u.id
JOIN projects p ON te.project_id = p.id
WHERE te.end_time IS NULL AND te.is_manual = FALSE
ORDER BY te.start_time DESC;

-- To stop all active timers, uncomment and run this:
-- UPDATE time_entries
-- SET end_time = CURRENT_TIMESTAMP
-- WHERE end_time IS NULL AND is_manual = FALSE;
