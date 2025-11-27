-- ZepTable System Overhaul - Migration SQL v2
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Create participants table for pre-registered users
-- ==========================================
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    joined BOOLEAN DEFAULT false,
    voted_keywords BOOLEAN DEFAULT false,
    voted_restaurant BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, name)
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(session_id, name);

-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON participants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON participants FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON participants FOR DELETE USING (true);

-- ==========================================
-- 2. Create session_keywords table for custom keywords per session
-- ==========================================
CREATE TABLE IF NOT EXISTS session_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_session_keywords_session ON session_keywords(session_id);

-- Enable RLS
ALTER TABLE session_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON session_keywords FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON session_keywords FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON session_keywords FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON session_keywords FOR DELETE USING (true);

-- ==========================================
-- 3. Update keyword_votes to reference session_keywords
-- ==========================================
-- The existing keyword_votes table already has UNIQUE(user_id, session_id, keyword)
-- which prevents duplicate votes - perfect for our needs!

-- ==========================================
-- 4. Update sessions table with new status fields
-- ==========================================
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS keyword_voting_active BOOLEAN DEFAULT true;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS restaurant_voting_active BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;

-- ==========================================
-- 5. Add restaurant-specific fields to places table (already exists from previous migration)
-- ==========================================
-- link, price_range, is_suggestion, suggested_by already added in previous migration

-- ==========================================
-- 6. Ensure votes table has proper constraints for 1-person-1-vote on restaurants
-- ==========================================
-- Add unique constraint to ensure one user can only vote for one restaurant per session
-- First, we need to add session_id tracking capability

-- Check if we need to add any additional constraints
-- The current votes table structure should be sufficient with proper application logic

-- ==========================================
-- 7. Create helper function to count keyword votes
-- ==========================================
CREATE OR REPLACE FUNCTION get_keyword_vote_count(p_session_id UUID, p_keyword TEXT)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM keyword_votes
    WHERE session_id = p_session_id AND keyword = p_keyword;
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- 8. Create helper function to count restaurant votes
-- ==========================================
CREATE OR REPLACE FUNCTION get_restaurant_vote_count(p_place_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM votes
    WHERE place_id = p_place_id;
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- 9. Create helper function to check if user has voted for any restaurant
-- ==========================================
CREATE OR REPLACE FUNCTION user_has_voted_restaurant(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1
        FROM votes v
        JOIN places p ON v.place_id = p.id
        WHERE v.user_id = p_user_id AND p.session_id = p_session_id
    );
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- 10. Create helper function to get participant by name
-- ==========================================
CREATE OR REPLACE FUNCTION get_participant_by_name(p_session_id UUID, p_name TEXT)
RETURNS TABLE (
    id UUID,
    session_id UUID,
    name TEXT,
    joined BOOLEAN,
    voted_keywords BOOLEAN,
    voted_restaurant BOOLEAN
) AS $$
    SELECT id, session_id, name, joined, voted_keywords, voted_restaurant
    FROM participants
    WHERE participants.session_id = p_session_id
    AND LOWER(TRIM(participants.name)) = LOWER(TRIM(p_name));
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- 11. Add tags column to places if not exists (for keyword matching)
-- ==========================================
ALTER TABLE places ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ==========================================
-- 12. Create view for real-time keyword results
-- ==========================================
CREATE OR REPLACE VIEW keyword_results AS
SELECT
    kv.session_id,
    kv.keyword,
    COUNT(*) as vote_count,
    ARRAY_AGG(u.name ORDER BY kv.created_at) as voters
FROM keyword_votes kv
JOIN users u ON kv.user_id = u.id
GROUP BY kv.session_id, kv.keyword;

-- ==========================================
-- 13. Create view for real-time restaurant results
-- ==========================================
CREATE OR REPLACE VIEW restaurant_results AS
SELECT
    p.id as place_id,
    p.session_id,
    p.name as restaurant_name,
    p.category,
    p.tags,
    p.link,
    p.price_range,
    p.is_suggestion,
    COUNT(v.id) as vote_count,
    ARRAY_AGG(u.name ORDER BY v.created_at) as voters
FROM places p
LEFT JOIN votes v ON p.id = v.place_id
LEFT JOIN users u ON v.user_id = u.id
GROUP BY p.id, p.session_id, p.name, p.category, p.tags, p.link, p.price_range, p.is_suggestion;

-- ==========================================
-- 14. Grant permissions on views
-- ==========================================
GRANT SELECT ON keyword_results TO anon, authenticated;
GRANT SELECT ON restaurant_results TO anon, authenticated;
