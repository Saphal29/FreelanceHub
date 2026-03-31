CREATE OR REPLACE FUNCTION notify_contract_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM create_notification(
        NEW.client_id,
        'contract_created',
        'Contract Created',
        'A new contract has been created for your project',
        NEW.project_id,
        NEW.proposal_id,
        NEW.id
    );
    PERFORM create_notification(
        NEW.freelancer_id,
        'contract_created',
        'Contract Ready for Signature',
        'Please review and sign the contract to start working',
        NEW.project_id,
        NEW.proposal_id,
        NEW.id
    );
    RETURN NEW;
END;
$$;
