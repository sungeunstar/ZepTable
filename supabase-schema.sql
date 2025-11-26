-- ZepTable Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    total_members INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voting_active BOOLEAN DEFAULT true
);

-- Users (participants) table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    selected_keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keywords (system keywords) table
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    category TEXT NOT NULL
);

-- Places (restaurant candidates) table
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    description TEXT,
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, place_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_session ON users(session_id);
CREATE INDEX idx_places_session ON places(session_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_votes_place ON votes(place_id);

-- Insert default keywords
INSERT INTO keywords (label, category) VALUES
    ('편안한 분위기였으면 해요', 'mood'),
    ('푸짐하게 먹고 싶어요', 'food_pref'),
    ('맛으로 확실하게 만족하고 싶어요', 'food_pref'),
    ('조용한 장소였으면 해요', 'mood'),
    ('넓고 쾌적했으면 좋겠어요', 'mood'),
    ('가성비 중요해요', 'budget'),
    ('건강한 느낌이면 좋아요', 'food_pref'),
    ('단체로 가기 부담 없었으면 해요', 'mood'),
    ('빠르게 먹을 수 있으면 좋아요', 'convenience');

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we don't have auth)
CREATE POLICY "Enable read access for all users" ON sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sessions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON keywords FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON places FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON places FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON places FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON votes FOR DELETE USING (true);
