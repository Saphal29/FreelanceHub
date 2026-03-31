CREATE OR REPLACE FUNCTION notify_proposal_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        PERFORM create_notification(
            NEW.freelancer_id,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'proposal_accepted'
                WHEN NEW.status = 'rejected' THEN 'proposal_rejected'
                ELSE 'proposal_updated'
            END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Proposal Accepted!'
                WHEN NEW.status = 'rejected' THEN 'Proposal Rejected'
                ELSE 'Proposal Updated'
            END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Congratulations! Your proposal has been accepted.'
                WHEN NEW.status = 'rejected' THEN 'Your proposal was not selected this time.'
                ELSE 'Your proposal status has been updated.'
            END,
            NEW.project_id,
            NEW.id,
            NULL
        );
    END IF;
    RETURN NEW;
END;
$$;
