-- Step 5b: Create all triggers (run AFTER step 5a)

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notify_proposal_submitted
    AFTER INSERT ON project_proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_submitted();

CREATE TRIGGER trigger_notify_proposal_status_changed
    AFTER UPDATE ON project_proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_status_changed();

CREATE TRIGGER trigger_notify_contract_created
    AFTER INSERT ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION notify_contract_created();
