-- Seed: DJ users + active rooms for testing
-- Run with: psql postgresql://devenseth@localhost:5432/dropthequeue -f seed.sql

BEGIN;

-- Create DJ users
INSERT INTO users (id, type, "displayName", fingerprint, email, "avatarSeed", "totalAccepts", "totalRequests", badges, "createdAt")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'dj', 'DJ Vikram',  'seed-dj-vikram',  'vikram@dtq.test',  'vikram',  0, 0, '', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'dj', 'DJ Priya',   'seed-dj-priya',   'priya@dtq.test',   'priya',   0, 0, '', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'dj', 'DJ Arjun',   'seed-dj-arjun',   'arjun@dtq.test',   'arjun',   0, 0, '', NOW())
ON CONFLICT DO NOTHING;

-- Create rooms
INSERT INTO rooms (id, code, "qrToken", name, status, mode, "playlistSource", settings, "startedAt")
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FIRE01', 'qr-fire01', 'Main Stage',    'active', 'normal', null, '{}', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'VIBE42', 'qr-vibe42', 'Rooftop Lounge','active', 'normal', null, '{}', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'DESI24', 'qr-desi24', 'Dance Floor',   'active', 'normal', null, '{}', NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'BANG22', 'qr-bang22', 'VIP Room',      'active', 'normal', null, '{}', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'BASS77', 'qr-bass77', 'After Party',   'active', 'normal', null, '{}', NOW())
ON CONFLICT DO NOTHING;

-- Assign DJs to rooms
UPDATE rooms SET "djId" = '11111111-1111-1111-1111-111111111111' WHERE code IN ('FIRE01', 'BANG22');
UPDATE rooms SET "djId" = '22222222-2222-2222-2222-222222222222' WHERE code IN ('VIBE42', 'BASS77');
UPDATE rooms SET "djId" = '33333333-3333-3333-3333-333333333333' WHERE code = 'DESI24';

COMMIT;

-- Verify
SELECT r.code, r.name, r.status, u."displayName" AS dj
FROM rooms r
LEFT JOIN users u ON u.id = r."djId"
ORDER BY r.code;
