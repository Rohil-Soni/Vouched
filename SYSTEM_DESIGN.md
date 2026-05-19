# Vouched — System Design

> Version 1.0 | Phase 1 Focus

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User & Auth System](#2-user--auth-system)
3. [Tip Submission System](#3-tip-submission-system)
4. [Credibility Score Engine](#4-credibility-score-engine)
5. [Intelligence Feed](#5-intelligence-feed)
6. [Dispute System](#6-dispute-system)
7. [Nudge Engine](#7-nudge-engine)
8. [Unwritten Rules Archive](#8-unwritten-rules-archive)
9. [Trust Circles](#9-trust-circles)
10. [Database Schema](#10-database-schema)
11. [API Surface](#11-api-surface)

---

## 1. System Overview

Vouched is a college-specific intelligence platform. The core loop is:

```
Senior submits tip → Co-signer confirms → Tip goes live on feed
       ↓
Fresher receives nudge → Acts on tip → Outcome happens
       ↓
Outcome confirmed or disputed → Credibility score updates
```

Every feature exists to serve this loop. Nothing is decorative.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                   │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│               REST API (Node.js / Express)          │
│                                                     │
│  Auth │ Tips │ Feed │ Disputes │ Archive │ Circles  │
└──┬────────┬──────────┬──────────┬──────────┬────────┘
   │        │          │          │          │
┌──▼────────▼──────────▼──────────▼──────────▼────────┐
│                  PostgreSQL Database                │
└─────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              Background Jobs (Cron)                 │
│         Nudge Engine │ Tip Expiry │ Score Decay     │
└─────────────────────────────────────────────────────┘
```

---

## 2. User & Auth System

### Roles

| Role | How Earned | Capabilities |
|---|---|---|
| `FRESHER` | Default on signup (year 1-2) | Read feed, receive nudges, dispute tips |
| `SENIOR` | Year 3+ verified at signup | Submit tips, co-sign tips, exit debrief |
| `MODERATOR` | Credibility score ≥ 75 | Review disputes, moderate archive |
| `ADMIN` | Manual assignment | Full platform access |

### College Verification Flow

```
User enters college email (e.g. rohil@iitb.ac.in)
        ↓
System extracts domain → looks up colleges table
        ↓
OTP sent to that email address
        ↓
OTP verified → account activated, college_id assigned
        ↓
User declares year of study → role assigned (FRESHER or SENIOR)
```

- Year of study is self-declared but tied to their college email batch
- Seniors are year 3 and above
- Role can be manually corrected by ADMIN if abused

### Profile Fields

```
id, email, name, college_id, branch, year_of_study,
role, credibility_score, badges[], is_verified,
created_at, last_active_at
```

### Auth

- JWT-based authentication
- Access token: 15 min expiry
- Refresh token: 30 days, stored in httpOnly cookie
- Password reset via college email OTP only

---

## 3. Tip Submission System

### Who Can Submit

Only users with role `SENIOR`. Freshers can read, not write.

### Tip Form — 6 Fields

| Field | Type | Notes |
|---|---|---|
| `title` | string (max 100 chars) | Short, scannable headline |
| `body` | string (max 1000 chars) | Full context, the "why it matters" |
| `category` | enum | SCHOLARSHIP, FACULTY, CLUB, PLACEMENT, ADMIN, EXAM |
| `expiry_date` | date | When this tip stops being relevant |
| `confidence_stake` | enum | LOW, MEDIUM, HIGH — affects credibility gain/loss |
| `branch_scope` | string[] | Which branches this applies to. Empty = all branches |

### Confidence Stake Logic

The senior declares how confident they are. This is not just a label — it directly controls how much credibility they gain or lose.

| Stake | Credibility Gain (if confirmed) | Credibility Loss (if disputed) |
|---|---|---|
| LOW | +5 | -10 |
| MEDIUM | +10 | -17 |
| HIGH | +15 | -25 |

Higher confidence = higher reward, higher risk. This prevents seniors from always picking HIGH.

### Co-Signer Requirement

- Every tip requires exactly 1 co-signer before going live
- Co-signer must be a `SENIOR` from the same college
- Co-signer reviews the tip and clicks "I can confirm this"
- Co-signer earns +2 credibility if the tip is later confirmed accurate
- Co-signer loses -5 credibility if the tip is successfully disputed
- Tips without a co-signer within 72 hours are auto-archived as drafts

### Tip Lifecycle

```
DRAFT → PENDING_COSIGN → LIVE → EXPIRED (auto, on expiry_date)
                                      ↓
                               ARCHIVED (searchable but not in feed)
```

A tip can also be:
- `DISPUTED` — under active dispute review
- `REMOVED` — dispute upheld, tip pulled

---

## 4. Credibility Score Engine

### Starting State

Every user starts at **50**. Range is 0–100.

### Score Events

| Event | Delta |
|---|---|
| Tip confirmed accurate (LOW stake) | +5 |
| Tip confirmed accurate (MEDIUM stake) | +10 |
| Tip confirmed accurate (HIGH stake) | +15 |
| Dispute upheld against your tip (LOW) | -10 |
| Dispute upheld against your tip (MEDIUM) | -17 |
| Dispute upheld against your tip (HIGH) | -25 |
| Your dispute rejected (you filed it) | -5 |
| Co-signed a tip that was confirmed | +2 |
| Co-signed a tip that was disputed | -5 |
| Moderated a dispute correctly | +1 |
| Completed exit debrief | +3 (one-time) |

### How "Confirmed Accurate" Works

Tips don't auto-confirm. Confirmation happens when:
1. The tip's expiry date passes AND no dispute was upheld against it → auto-confirmed
2. A fresher who acted on the tip marks it as "this was accurate" (optional, bonus signal)

This means the default path is: tip expires cleanly → contributor gets credit. Disputes are the exception, not the rule.

### Score Boundaries

- Score cannot go below 0 or above 100
- Score is college-specific — a senior's score at IITB means nothing at BITS
- Score history is logged (every delta recorded with reason and timestamp)

### Moderator Threshold

- Score ≥ 75 → eligible for MODERATOR role
- Score drops below 70 → moderator status suspended until score recovers
- This creates a self-regulating moderator pool

---

## 5. Intelligence Feed

### What Appears in the Feed

- Only `LIVE` tips
- Filtered by: user's college (mandatory), user's branch (default on, can turn off)
- Sorted by feed score, not by time

### Feed Ranking Algorithm

```
feed_score = (urgency_weight × days_remaining_factor) × (contributor_credibility / 100)
```

**urgency_weight** by category:
```
SCHOLARSHIP → 1.5
EXAM        → 1.4
PLACEMENT   → 1.3
FACULTY     → 1.1
CLUB        → 1.0
ADMIN       → 0.9
```

**days_remaining_factor**:
```
≤ 3 days  → 3.0
≤ 7 days  → 2.0
≤ 14 days → 1.5
≤ 21 days → 1.2
> 21 days → 1.0
```

So a HIGH-urgency scholarship tip from a 90-credibility senior expiring in 2 days scores:
```
(1.5 × 2.0) × (90/100) = 2.7
```

A LOW-urgency admin tip from a 40-credibility senior expiring in 30 days:
```
(0.9 × 1.0) × (40/100) = 0.36
```

The right tips rise. The noise sinks.

### Feed Tip Card — What's Shown

```
[Category Badge]  [Branch Tag]  [Days Remaining]
Title
Body (truncated to 2 lines, expand on tap)
Contributor: @username  Credibility: 84  Co-signed ✓
[Vouched by 3]  [Dispute]
```

---

## 6. Dispute System

### Who Can Dispute

Any verified user (FRESHER or SENIOR) who has personally experienced the outcome of a tip.

### Dispute Form — 5 Questions

These questions are mandatory. No form = no dispute. This is the friction layer.

1. What specifically was inaccurate about this tip?
2. Did you personally act on this tip? (Yes / No — if No, dispute is rejected immediately)
3. What was the actual outcome you experienced?
4. When did this happen? (date picker)
5. Can you provide any supporting evidence? (optional text / screenshot upload)

### Panel Selection

- 3 moderators selected randomly from the college's eligible moderator pool
- Moderators cannot be the tip's author or co-signer
- Moderators cannot have an active dispute with the tip author
- If fewer than 3 moderators exist at the college, ADMIN reviews instead

### Review Window

- 48 hours from dispute submission
- Each moderator reviews independently — they cannot see each other's votes until all 3 have voted or time expires
- Majority rules: 2/3 to uphold, 2/3 to reject

### Outcomes

| Result | Consequence |
|---|---|
| Dispute upheld (2-3 votes) | Tip removed, author loses credibility (based on stake), co-signer loses -5 |
| Dispute rejected (0-1 votes) | Tip stays live, reporter loses -5 credibility |
| Tie / timeout | Tip flagged for ADMIN review, stays live in the meantime |

### Moderator Accountability

- Moderators who consistently vote with the minority (wrong calls) lose moderator status
- Each moderator's vote history is tracked internally (not public)
- Correct moderation = +1 credibility per dispute

---

## 7. Nudge Engine

### How It Works

A cron job runs once daily at 8:00 AM. It:

1. Queries all `LIVE` tips
2. For each tip, calculates days until expiry
3. Finds all users at the same college whose branch matches the tip's branch_scope
4. Checks which users have NOT already been nudged at this threshold
5. Sends notification to eligible users

### Nudge Thresholds

| Days Remaining | Nudge Type | Message Tone |
|---|---|---|
| 21 days | Awareness | "Heads up — this window opens soon" |
| 7 days | Action | "One week left — here's what you need to do" |
| 3 days | Urgent | "3 days left. Don't miss this." |

### Notification Channels

- In-app notification (always)
- Email (user can opt out)
- Push notification via FCM (if mobile app installed)

### Nudge Record

Every nudge sent is recorded:
```
nudge_id, user_id, tip_id, threshold_days, sent_at, channel, opened_at
```

This prevents duplicate nudges and lets us measure open rates per threshold.

---

## 8. Unwritten Rules Archive

### Purpose

Permanent, evergreen institutional knowledge. Not time-sensitive tips — structural truths about how the college works.

### Submission Flow

```
Senior submits anonymously (name not stored, only college_id + branch)
        ↓
Auto-check: does body contain individual names? → Rejected instantly
        ↓
Enters moderation queue (status: PENDING)
        ↓
3 moderators review independently
        ↓
2/3 approve → Published (status: LIVE, author = "Anonymous Senior")
1/3 or fewer → Rejected, submitter gets category-level reason
```

### Auto-Rejection Rules

The system auto-rejects before human review if:
- Body contains patterns matching individual names (NLP name detection)
- Body is under 50 characters (too vague to be useful)
- Identical or near-identical entry already exists (similarity check)

### Archive Entry Format

```
[Category] [College] [Branch — if branch-specific]

Content body

Vouched by: N seniors | Disputed: N times | Last verified: Month Year
Expires: Academic Year YYYY-YY (unless re-vouched)
```

### Categories

- Faculty Patterns
- Department Norms
- Club & Society Realities
- Admin & Bureaucracy
- Placement & Internship Truths

### Expiry & Re-Vouching

- Every archive entry expires after 2 academic years
- Any current senior can re-vouch an entry ("still accurate as of this year")
- Re-vouching resets the 2-year clock
- Expired entries move to `ARCHIVED` status — searchable but not surfaced by default

---

## 9. Trust Circles

### What It Is

A private, invite-only group for sharing tips too sensitive for the public feed.

### Rules

- Max 20 members per circle
- Creator is the circle admin
- All members must be from the same college
- Circle tips are visible only to members

### Circle Tip Escalation

If a tip inside a circle needs to reach the public feed:

```
Any member proposes escalation
        ↓
60% of circle members must vouch it (within 48 hours)
        ↓
Tip is submitted to public feed anonymously
        ↓
Original author's identity is NOT revealed — tip shows as "Vouched by Trust Circle"
        ↓
Normal co-sign + live flow applies from here
```

### Circle Admin Powers

- Add / remove members
- Delete circle tips
- Dissolve the circle

---

## 10. Database Schema

### `colleges`
```sql
id            UUID PRIMARY KEY
name          TEXT NOT NULL
email_domain  TEXT UNIQUE NOT NULL   -- e.g. iitb.ac.in
city          TEXT
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### `users`
```sql
id                UUID PRIMARY KEY
email             TEXT UNIQUE NOT NULL
name              TEXT NOT NULL
college_id        UUID REFERENCES colleges(id)
branch            TEXT
year_of_study     INT
role              TEXT CHECK (role IN ('FRESHER','SENIOR','MODERATOR','ADMIN'))
credibility_score INT DEFAULT 50 CHECK (credibility_score BETWEEN 0 AND 100)
is_verified       BOOLEAN DEFAULT FALSE
created_at        TIMESTAMPTZ DEFAULT NOW()
last_active_at    TIMESTAMPTZ
```

### `tips`
```sql
id               UUID PRIMARY KEY
author_id        UUID REFERENCES users(id)
cosigner_id      UUID REFERENCES users(id)
college_id       UUID REFERENCES colleges(id)
title            TEXT NOT NULL
body             TEXT NOT NULL
category         TEXT CHECK (category IN ('SCHOLARSHIP','FACULTY','CLUB','PLACEMENT','ADMIN','EXAM'))
confidence_stake TEXT CHECK (confidence_stake IN ('LOW','MEDIUM','HIGH'))
branch_scope     TEXT[]                        -- empty = all branches
expiry_date      DATE NOT NULL
status           TEXT CHECK (status IN ('DRAFT','PENDING_COSIGN','LIVE','DISPUTED','REMOVED','EXPIRED','ARCHIVED'))
feed_score       FLOAT                         -- recomputed daily by cron
created_at       TIMESTAMPTZ DEFAULT NOW()
expires_at       TIMESTAMPTZ
```

### `credibility_events`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
delta       INT NOT NULL               -- positive or negative
reason      TEXT NOT NULL              -- human-readable event type
reference_id UUID                      -- tip_id or dispute_id that caused it
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### `disputes`
```sql
id              UUID PRIMARY KEY
tip_id          UUID REFERENCES tips(id)
reporter_id     UUID REFERENCES users(id)
q1_what_wrong   TEXT NOT NULL
q2_acted_on_tip BOOLEAN NOT NULL
q3_actual_outcome TEXT NOT NULL
q4_when_happened DATE NOT NULL
q5_evidence     TEXT
status          TEXT CHECK (status IN ('OPEN','UPHELD','REJECTED','ADMIN_REVIEW'))
created_at      TIMESTAMPTZ DEFAULT NOW()
resolved_at     TIMESTAMPTZ
```

### `dispute_votes`
```sql
id           UUID PRIMARY KEY
dispute_id   UUID REFERENCES disputes(id)
moderator_id UUID REFERENCES users(id)
vote         TEXT CHECK (vote IN ('UPHOLD','REJECT'))
voted_at     TIMESTAMPTZ DEFAULT NOW()
```

### `nudges`
```sql
id             UUID PRIMARY KEY
user_id        UUID REFERENCES users(id)
tip_id         UUID REFERENCES tips(id)
threshold_days INT NOT NULL            -- 21, 7, or 3
channel        TEXT                   -- 'in_app', 'email', 'push'
sent_at        TIMESTAMPTZ DEFAULT NOW()
opened_at      TIMESTAMPTZ
```

### `archive_entries`
```sql
id           UUID PRIMARY KEY
college_id   UUID REFERENCES colleges(id)
branch       TEXT
category     TEXT
body         TEXT NOT NULL
status       TEXT CHECK (status IN ('PENDING','LIVE','REJECTED','ARCHIVED'))
vouch_count  INT DEFAULT 0
submitted_at TIMESTAMPTZ DEFAULT NOW()
expires_at   TIMESTAMPTZ              -- 2 years from last re-vouch
```

### `archive_vouches`
```sql
id         UUID PRIMARY KEY
entry_id   UUID REFERENCES archive_entries(id)
user_id    UUID REFERENCES users(id)
vouched_at TIMESTAMPTZ DEFAULT NOW()
```

### `trust_circles`
```sql
id         UUID PRIMARY KEY
name       TEXT NOT NULL
college_id UUID REFERENCES colleges(id)
admin_id   UUID REFERENCES users(id)
created_at TIMESTAMPTZ DEFAULT NOW()
```

### `circle_members`
```sql
circle_id UUID REFERENCES trust_circles(id)
user_id   UUID REFERENCES users(id)
joined_at TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (circle_id, user_id)
```

### `circle_tips`
```sql
id           UUID PRIMARY KEY
circle_id    UUID REFERENCES trust_circles(id)
author_id    UUID REFERENCES users(id)
body         TEXT NOT NULL
vouch_count  INT DEFAULT 0
escalated    BOOLEAN DEFAULT FALSE
created_at   TIMESTAMPTZ DEFAULT NOW()
```

---

## 11. API Surface

### Auth
```
POST   /auth/signup              Create account, send OTP
POST   /auth/verify-otp          Verify OTP, activate account
POST   /auth/login               Login, return JWT
POST   /auth/refresh             Refresh access token
POST   /auth/logout              Invalidate refresh token
```

### Users
```
GET    /users/me                 Get own profile
PATCH  /users/me                 Update branch, year, notification prefs
GET    /users/:id                Get public profile (credibility, badges)
GET    /users/me/credibility     Get own credibility event history
```

### Tips
```
POST   /tips                     Submit a new tip (SENIOR only)
GET    /tips                     Get feed (filtered, ranked)
GET    /tips/:id                 Get single tip detail
PATCH  /tips/:id/cosign          Co-sign a pending tip (SENIOR only)
POST   /tips/:id/confirm         Mark tip as accurate after expiry (FRESHER)
DELETE /tips/:id                 Author withdraws tip (only if PENDING_COSIGN)
```

### Disputes
```
POST   /disputes                 File a dispute against a tip
GET    /disputes/:id             Get dispute detail
GET    /disputes/queue           Get disputes pending review (MODERATOR only)
POST   /disputes/:id/vote        Submit moderator vote
```

### Nudges
```
GET    /nudges                   Get own nudge history
PATCH  /nudges/:id/open          Mark nudge as opened
PATCH  /users/me/nudge-prefs     Update notification channel preferences
```

### Archive
```
POST   /archive                  Submit anonymous archive entry
GET    /archive                  Browse archive (filtered by college, category)
GET    /archive/:id              Get single archive entry
POST   /archive/:id/vouch        Re-vouch an archive entry (SENIOR only)
GET    /archive/modqueue         Moderation queue (MODERATOR only)
POST   /archive/:id/moderate     Submit moderation decision
```

### Trust Circles
```
POST   /circles                  Create a circle
GET    /circles/mine             Get circles I belong to
POST   /circles/:id/invite       Invite a member
DELETE /circles/:id/members/:uid Remove a member (admin only)
POST   /circles/:id/tips         Post a tip to a circle
GET    /circles/:id/tips         Get circle tips
POST   /circles/:id/tips/:tid/vouch    Vouch a circle tip
POST   /circles/:id/tips/:tid/escalate Propose escalation to public feed
```

### Colleges (Internal / Admin)
```
GET    /colleges                 List all colleges
POST   /colleges                 Add a college + email domain (ADMIN only)
```

---

*End of System Design v1.0*
