CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_project_id UUID DEFAULT NULL,
    p_proposal_id UUID DEFAULT NULL,
    p_contract_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, project_id, proposal_id, contract_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_project_id, p_proposal_id, p_contract_id)
    RETURNING id INTO notification_id;
    RETURN notification_id;
END;
$$;
