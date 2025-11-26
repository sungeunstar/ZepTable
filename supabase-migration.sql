-- ZepTable System Renovation - Migration SQL
-- Run this in Supabase SQL Editor to update existing database

-- Add keyword_votes table for 1st round voting
CREATE TABLE IF NOT EXISTS keyword_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, session_id, keyword)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_keyword_votes_session ON keyword_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_keyword_votes_user ON keyword_votes(user_id);

-- Add voting_phase to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS voting_phase TEXT DEFAULT 'keyword_voting';
-- voting_phase: 'keyword_voting', 'place_registration', 'place_voting', 'completed'

-- Add session_creator_id to track who created the session
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- Add fields to places table for suggestions
ALTER TABLE places ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS is_suggestion BOOLEAN DEFAULT false;
ALTER TABLE places ADD COLUMN IF NOT EXISTS suggested_by UUID REFERENCES users(id);

-- Clear old keywords and insert new expanded keyword set
TRUNCATE keywords CASCADE;

-- Insert expanded keyword set (5 categories, 50+ keywords)
INSERT INTO keywords (label, category) VALUES
    -- 1) 분위기 / 무드
    ('조용한', 'mood'),
    ('편안한', 'mood'),
    ('활기찬', 'mood'),
    ('분위기 좋은', 'mood'),
    ('감성적인', 'mood'),
    ('즉석/캐주얼', 'mood'),
    ('단체 가능', 'mood'),
    ('프라이빗', 'mood'),
    ('깔끔함', 'mood'),
    ('회식 느낌', 'mood'),

    -- 2) 맛 스타일
    ('담백한', 'taste'),
    ('매콤한', 'taste'),
    ('짭짤한', 'taste'),
    ('달달한', 'taste'),
    ('기름진', 'taste'),
    ('느끼하지 않은', 'taste'),
    ('건강한', 'taste'),
    ('푸짐한', 'taste'),
    ('중화풍', 'taste'),
    ('일본식', 'taste'),
    ('한국 전통', 'taste'),

    -- 3) 메뉴 성향
    ('고기', 'menu'),
    ('국/탕/찌개', 'menu'),
    ('면 요리', 'menu'),
    ('밥류', 'menu'),
    ('샐러드', 'menu'),
    ('디저트', 'menu'),
    ('해산물', 'menu'),
    ('비건/식물성', 'menu'),
    ('치킨/튀김류', 'menu'),
    ('분식', 'menu'),

    -- 4) 상황 / 니즈
    ('빠르게 먹고 싶어요', 'situation'),
    ('천천히 여유롭게', 'situation'),
    ('가성비 중요', 'situation'),
    ('프리미엄 분위기', 'situation'),
    ('혼밥 가능', 'situation'),
    ('주차 편한 곳', 'situation'),
    ('직장 점심', 'situation'),
    ('저녁 약속', 'situation'),
    ('데이트', 'situation'),
    ('급하게 정해야 해요', 'situation'),

    -- 5) 기타
    ('맛깔나는 반찬', 'other'),
    ('신선함', 'other'),
    ('매장 넓음', 'other'),
    ('줄 안 서고 싶어요', 'other'),
    ('포장 가능', 'other');

-- Enable RLS for new table
ALTER TABLE keyword_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for keyword_votes
CREATE POLICY "Enable read access for all users" ON keyword_votes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON keyword_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON keyword_votes FOR DELETE USING (true);
