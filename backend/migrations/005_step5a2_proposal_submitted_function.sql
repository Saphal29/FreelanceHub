CREATE OR REPLACE FUNCTION notify_proposal_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM create_notification(
        (SELECT client_id FROM projects WHERE id = NEW.project_id),
        'proposal_received',
        'New Proposal Received',
        'You have received a new proposal for your project',
        NEW.project_id,
        NEW.id,
        NULL
    );
    RETURN NEW;
END;
$$;
