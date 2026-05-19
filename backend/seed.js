require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Seeding database with comprehensive test data...');

  // Get college id for juetguna.in
  const { rows: colleges } = await pool.query("SELECT id FROM colleges WHERE email_domain='juetguna.in'");
  if (!colleges.length) { console.error('College juetguna.in not found. Run the setup first.'); process.exit(1); }
  const collegeId = colleges[0].id;

  // Create test users with various credibility scores
  const senior1 = uuidv4(), senior2 = uuidv4(), senior3 = uuidv4(), 
        fresher1 = uuidv4(), fresher2 = uuidv4(), moderator1 = uuidv4();
  
  await pool.query(`
    INSERT INTO users (id, email, name, college_id, branch, year_of_study, role, credibility_score, is_verified)
    VALUES
      ($1, 'senior1@juetguna.in', 'Arjun Sharma', $7, 'CSE', 4, 'SENIOR', 85, true),
      ($2, 'senior2@juetguna.in', 'Priya Mehta', $7, 'ECE', 3, 'SENIOR', 78, true),
      ($3, 'senior3@juetguna.in', 'Rohan Kumar', $7, 'ME', 4, 'SENIOR', 92, true),
      ($4, 'fresher1@juetguna.in', 'Rahul Verma', $7, 'CSE', 1, 'FRESHER', 50, true),
      ($5, 'fresher2@juetguna.in', 'Shreya Patel', $7, 'ECE', 2, 'FRESHER', 55, true),
      ($6, 'moderator1@juetguna.in', 'Dev Singh', $7, 'CSE', 4, 'MODERATOR', 88, true)
    ON CONFLICT (email) DO NOTHING
  `, [senior1, senior2, senior3, fresher1, fresher2, moderator1, collegeId]);

  // Re-fetch actual IDs in case they already existed
  const { rows: users } = await pool.query("SELECT id, email FROM users WHERE college_id = $1 ORDER BY email", [collegeId]);
  const userMap = {};
  users.forEach(u => userMap[u.email] = u.id);

  const s1id = userMap['senior1@juetguna.in'];
  const s2id = userMap['senior2@juetguna.in'];
  const s3id = userMap['senior3@juetguna.in'];
  const f1id = userMap['fresher1@juetguna.in'];
  const f2id = userMap['fresher2@juetguna.in'];
  const m1id = userMap['moderator1@juetguna.in'];

  // Create live tips with various confidence stakes
  const tips = [
    {
      id: uuidv4(), author: s1id, cosigner: s2id,
      title: 'GATE scholarship portal crashes on last day — submit 5 days early',
      body: 'Every year the MHRD scholarship portal goes down on the deadline day due to traffic. Submit at least 5 days before. I missed it in 3rd year because of this. The helpdesk does NOT grant extensions. Based on 4 years of experience.',
      category: 'SCHOLARSHIP', stake: 'HIGH',
      expiry: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
      branch: '{CSE,ECE,ME}'
    },
    {
      id: uuidv4(), author: s2id, cosigner: s3id,
      title: 'Prof. Verma prioritizes students who attend office hours for recommendations',
      body: 'If you want a strong recommendation letter from the HOD, you need to have visited office hours at least 3-4 times during the semester. He tracks attendance and engagement. Generic email requests get generic letters.',
      category: 'FACULTY', stake: 'MEDIUM',
      expiry: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      branch: '{CSE}'
    },
    {
      id: uuidv4(), author: s3id, cosigner: s1id,
      title: 'Placement: Submit resume within 2 hours of portal opening',
      body: 'The placement cell forwards only the first 70 resumes to companies regardless of total applications. For competitive drives, submit within 2 hours. Waiting even 12 hours can mean getting skipped.',
      category: 'PLACEMENT', stake: 'HIGH',
      expiry: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      branch: '{}'
    },
    {
      id: uuidv4(), author: s1id, cosigner: s2id,
      title: 'Exam schedule released on notice board 3 days before portal update',
      body: 'The midterm exam schedule is NEVER announced on the official portal first. It goes on the physical notice board outside the admin office 3+ days before. The online portal update always lags by 1-2 days. Check daily.',
      category: 'EXAM', stake: 'MEDIUM',
      expiry: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
      branch: '{}'
    },
    {
      id: uuidv4(), author: s2id, cosigner: s3id,
      title: 'Club selections happen through referrals before official applications open',
      body: 'The tech club organizing committee selects ~50% of members informally through referrals in February. When the official application opens in March, those spots are already taken even if their applications are weak.',
      category: 'CLUB', stake: 'MEDIUM',
      expiry: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      branch: '{}'
    },
    {
      id: uuidv4(), author: s3id, cosigner: s1id,
      title: 'Admin loses paperwork — always follow up in person 3+ times',
      body: 'The admin office loses scholarship and grant paperwork regularly. After submission, follow up in person at least 3 times at 1-week intervals. Keep photocopies of everything. This has saved many students from missing deadlines.',
      category: 'ADMIN', stake: 'HIGH',
      expiry: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      branch: '{}'
    },
  ];

  for (const t of tips) {
    await pool.query(`
      INSERT INTO tips (id, author_id, cosigner_id, college_id, title, body, category, confidence_stake, branch_scope, expiry_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::text[],$10,'LIVE')
      ON CONFLICT DO NOTHING
    `, [t.id, t.author, t.cosigner, collegeId, t.title, t.body, t.category, t.stake, t.branch, t.expiry]);
  }

  // Create a disputed tip to show in moderator queue
  const disputedTipId = uuidv4();
  await pool.query(`
    INSERT INTO tips (id, author_id, cosigner_id, college_id, title, body, category, confidence_stake, branch_scope, expiry_date, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::text[],$10,'LIVE')
    ON CONFLICT DO NOTHING
  `, [disputedTipId, s1id, s2id, collegeId, 'Internship applications close 5pm sharp — no late submissions', 
      'The placement cell closes the internship application portal at exactly 5:00 PM IST. Submissions even 1 minute after get rejected. Multiple friends have lost opportunities due to this.',
      'PLACEMENT', 'HIGH', '{CSE,ECE}', new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0]]);

  // Create a dispute on that tip
  const disputeId = uuidv4();
  const dishonestReporterEmail = 'joker@juetguna.in';
  
  // Check if joker account exists, if not create one
  const { rows: jokerUser } = await pool.query("SELECT id FROM users WHERE email=$1", [dishonestReporterEmail]);
  let jokerId;
  if (jokerUser.length) {
    jokerId = jokerUser[0].id;
  } else {
    jokerId = uuidv4();
    await pool.query(`
      INSERT INTO users (id, email, name, college_id, branch, year_of_study, role, credibility_score, is_verified)
      VALUES ($1, $2, 'The Joker', $3, 'CSE', 2, 'FRESHER', 30, true)
    `, [jokerId, dishonestReporterEmail, collegeId]);
  }

  await pool.query(`
    INSERT INTO disputes (id, tip_id, reporter_id, q1_what_wrong, q2_acted_on_tip, q3_actual_outcome, q4_when_happened, q5_evidence, status)
    VALUES ($1, $2, $3, $4, true, $5, $6, $7, 'OPEN')
    ON CONFLICT DO NOTHING
  `, [disputeId, disputedTipId, jokerId, 
      'This is totally wrong. Applications stayed open until 5:30pm.',
      'I submitted at 5:15 PM and it worked fine. This tip is false.',
      new Date().toISOString().split('T')[0],
      'Screenshot of successful submission at 5:15 PM attached to the form.']);

  // Archive entries (unwritten rules)
  const archiveEntries = [
    { category: 'ADMIN', body: 'The administrative office loses scholarship paperwork regularly during peak seasons. Always follow up in person at least 3 times after submission and keep xeroxed copies of all documents submitted. This is a systemic issue that affects 15-20% of scholarship applicants each year.' },
    { category: 'FACULTY', body: 'End-semester grading in the CSE department is heavily weighted toward viva performance, often more than the written exam. A student who scores 60% in written but performs exceptionally well in viva consistently gets B+ or A grades. This pattern is observed across all CSE faculty.' },
    { category: 'CLUB', body: 'The technical fest organizing committee pre-selects approximately 40% of members through informal referrals starting in February, before the official application window opens in March. The open application is largely a formality for the remaining 60% of positions.' },
    { category: 'PLACEMENT', body: 'Internship companies visiting campus apply a strict CGPA cutoff (usually 7.5+) before any resume screening happens. Students below this cutoff are filtered out automatically, regardless of project work or skills. This affects around 30-35% of the batch annually.' },
  ];

  for (const e of archiveEntries) {
    await pool.query(`
      INSERT INTO archive_entries (id, college_id, category, body, status, vouch_count, expires_at)
      VALUES ($1,$2,$3,$4,'LIVE',2, NOW() + INTERVAL '2 years')
      ON CONFLICT DO NOTHING
    `, [uuidv4(), collegeId, e.category, e.body]);
  }

  // Log credibility changes to show in profile
  const credibilityEvents = [
    { user: s1id, delta: 15, reason: 'Tip confirmed accurate: GATE portal crash warning' },
    { user: s1id, delta: -5, reason: 'Co-signed tip marked as disputed' },
    { user: s2id, delta: 10, reason: 'Tip confirmed: Faculty office hour pattern' },
    { user: s3id, delta: 15, reason: 'High-confidence tip confirmed accurate' },
  ];

  for (const e of credibilityEvents) {
    await pool.query(`
      INSERT INTO credibility_events (id, user_id, delta, reason)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT DO NOTHING
    `, [uuidv4(), e.user, e.delta, e.reason]);
  }

  console.log('✅ Seeding complete!\n');
  console.log('📊 Created:');
  console.log('  • 6 test users (3 seniors, 2 freshers, 1 moderator)');
  console.log('  • 7 live tips with various confidence stakes');
  console.log('  • 1 disputed tip in moderator queue');
  console.log('  • 4 archive entries (unwritten rules)');
  console.log('  • Credibility history for users\n');
  console.log('🔓 Test Accounts (all use OTP login):');
  console.log('  🎓 Seniors:');
  console.log('    senior1@juetguna.in (Arjun Sharma - 85 credibility)');
  console.log('    senior2@juetguna.in (Priya Mehta - 78 credibility)');
  console.log('    senior3@juetguna.in (Rohan Kumar - 92 credibility)');
  console.log('  👤 Freshers:');
  console.log('    fresher1@juetguna.in (Rahul Verma - 50 credibility)');
  console.log('    fresher2@juetguna.in (Shreya Patel - 55 credibility)');
  console.log('  🛡️ Moderator:');
  console.log('    moderator1@juetguna.in (Dev Singh - 88 credibility)\n');
  console.log('💡 What to test:');
  console.log('  1. Login with any account → OTP sent to console (dev mode)');
  console.log('  2. Feed shows 6 tips ranked by credibility & urgency');
  console.log('  3. Click tip → See detail page with credibility badge');
  console.log('  4. Moderator queue: moderator1 can see & vote on disputes');
  console.log('  5. Archive shows moderated "unwritten rules"');
  console.log('  6. Profile shows credibility score & history\n');

  await pool.end();
}

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
