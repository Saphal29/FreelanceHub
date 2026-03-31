-- ============================================
-- WebRTC Video Calls System
-- ============================================

DROP TABLE IF EXISTS scheduled_call_participants CASCADE;
DROP TABLE IF EXISTS scheduled_calls CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS call_participants CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS call_rooms CASCADE;

-- ============================================
-- CALL ROOMS TABLE
-- (must be created before calls due to FK)
-- ============================================
CREATE TABLE call_rooms (
    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_name VARCHAR(255),
    max_participants INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    CONSTRAINT chk_call_rooms_max_participants CHECK (max_participants >= 2 AND max_participants <= 4)
);

-- ============================================
-- CALLS TABLE
-- ============================================
CREATE TABLE calls (
    call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_id UUID REFERENCES call_rooms(room_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'initiated',
    call_type VARCHAR(10) NOT NULL DEFAULT 'video',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_calls_status CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'rejected', 'cancelled', 'failed', 'missed')),
    CONSTRAINT chk_calls_call_type CHECK (call_type IN ('video', 'audio'))
);

-- ============================================
-- CALL PARTICIPANTS TABLE
-- ============================================
CREATE TABLE call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(call_id) ON DELETE CASCADE,
    room_id UUID REFERENCES call_rooms(room_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    is_video_off BOOLEAN DEFAULT FALSE
);

-- ============================================
-- CALL LOGS TABLE
-- ============================================
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(call_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SCHEDULED CALLS TABLE
-- ============================================
CREATE TABLE scheduled_calls (
    meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    duration_mins INTEGER DEFAULT 60,
    meeting_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_scheduled_calls_future CHECK (scheduled_at > NOW()),
    CONSTRAINT uq_scheduled_calls_meeting_url UNIQUE (meeting_url)
);

-- ============================================
-- SCHEDULED CALL PARTICIPANTS TABLE
-- ============================================
CREATE TABLE scheduled_call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES scheduled_calls(meeting_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_scheduled_call_participants UNIQUE (meeting_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_calls_caller_id ON calls(caller_id);
CREATE INDEX idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX idx_calls_room_id ON calls(room_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at);
CREATE INDEX idx_call_rooms_host_id ON call_rooms(host_id);
CREATE INDEX idx_call_rooms_status ON call_rooms(status);
CREATE INDEX idx_call_participants_call_id ON call_participants(call_id);
CREATE INDEX idx_call_participants_room_id ON call_participants(room_id);
CREATE INDEX idx_call_participants_user_id ON call_participants(user_id);
CREATE INDEX idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_scheduled_calls_host_id ON scheduled_calls(host_id);
CREATE INDEX idx_scheduled_calls_scheduled_at ON scheduled_calls(scheduled_at);
CREATE INDEX idx_scheduled_call_participants_meeting_id ON scheduled_call_participants(meeting_id);
CREATE INDEX idx_scheduled_call_participants_user_id ON scheduled_call_participants(user_id);

-- ============================================
-- TRIGGERS (updated_at for tables that have it)
-- ============================================
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
