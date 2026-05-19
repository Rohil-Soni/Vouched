require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Seeding database...');

  // Get college id for juetguna.in
  const { rows: colleges } = await pool.query("SELECT id FROM colleges WHERE email_domain='juetguna.in'");
  if (!colleges.length) { console.error('College juetguna.in not found. Run the setup first.'); process.exit(1); }
  const collegeId = colleges[0].id;

  // Create 2 senior users
  const senior1 = uuidv4(), senior2 = uuidv4(), fresher1 = uuidv4();
  await pool.query(`
    INSERT INTO users (id, email, name, college_id, branch, year_of_study, role, credibility_score, is_verified)
    VALUES
      ($1, 'senior1@juetguna.in', 'Arjun Sharma', $4, 'CSE', 4, 'SENIOR', 82, true),
      ($2, 'senior2@juetguna.in', 'Priya Mehta', $4, 'ECE', 3, 'SENIOR', 74, true),
      ($3, 'fresher1@juetguna.in', 'Rahul Verma', $4, 'CSE', 1, 'FRESHER', 50, true)
    ON CONFLICT (email) DO NOTHING
  `, [senior1, senior2, fresher1, collegeId]);

  // Re-fetch actual IDs in case they already existed
  const { rows: s1 } = await pool.query("SELECT id FROM users WHERE email='senior1@juetguna.in'");
  const { rows: s2 } = await pool.query("SELECT id FROM users WHERE email='senior2@juetguna.in'");
  const s1id = s1[0].id, s2id = s2[0].id;

  // Create live tips
  const tips = [
    {
      id: uuidv4(), author: s1id, cosigner: s2id,
      title: 'GATE scholarship portal crashes on last day — submit 5 days early',
      body: 'Every year the MHRD scholarship portal goes down on the deadline day due to traffic. Submit at least 5 days before. I missed it in 3rd year because of this. The helpdesk does NOT grant extensions.',
      category: 'SCHOLARSHIP', stake: 'HIGH',
      expiry: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
      score: 4.2, branch: '{CSE,ECE,ME}'
    },
    {
      id: uuidv4(), author: s2id, cosigner: s1id,
      title: 'Prof. Verma only writes strong recs for students who attended office hours',
      body: 'If you want a recommendation letter from the HOD, you need to have visited office hours at least 3 times during the semester. He tracks this. A generic email request gets a generic letter.',
      category: 'FACULTY', stake: 'MEDIUM',
      expiry: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      score: 2.8, branch: '{CSE}'
    },
    {
      id: uuidv4(), author: s1id, cosigner: s2id,
      title: 'Placement cell stops reading resumes after first 60 submissions',
      body: 'For on-campus drives, the placement cell forwards only the first 60 resumes to companies regardless of how many students apply. Submit your resume within 2 hours of the portal opening.',
      category: 'PLACEMENT', stake: 'HIGH',
      expiry: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      score: 5.1, branch: '{}'
    },
    {
      id: uuidv4(), author: s2id, cosigner: s1id,
      title: 'Mid-sem exam schedule released 3 days before — check notice board daily',
      body: 'The exam schedule is never announced on the official portal first. It goes on the physical notice board outside the admin office 3 days before. The portal update lags by 1-2 days.',
      category: 'EXAM', stake: 'MEDIUM',
      expiry: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
      score: 3.1, branch: '{}'
    },
  ];

  for (const t of tips) {
    await pool.query(`
      INSERT INTO tips (id, author_id, cosigner_id, college_id, title, body, category, confidence_stake, branch_scope, expiry_date, status, feed_score)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::text[],$10,'LIVE',$11)
      ON CONFLICT DO NOTHING
    `, [t.id, t.author, t.cosigner, collegeId, t.title, t.body, t.category, t.stake, t.branch, t.expiry, t.score]);
  }

  // Archive entries
  const archiveEntries = [
    { category: 'Admin & Bureaucracy', body: 'The admin office loses scholarship paperwork regularly. Always follow up in person at least 3 times after submission and keep a photocopy of everything you submit.' },
    { category: 'Faculty Patterns', body: 'End-semester grading in the CSE department is heavily weighted toward viva performance. A student who scores 60% in written but performs well in viva consistently gets B+ or above.' },
    { category: 'Club & Society Realities', body: 'The technical fest organizing committee selects members in February through informal referrals before the official application opens in March. The open application is mostly a formality.' },
    { category: 'Placement & Internship Truths', body: 'Companies visiting for internships in December shortlist candidates based on CGPA cutoff first, then resume. A CGPA below 7.5 gets filtered before a human reads your resume.' },
  ];

  for (const e of archiveEntries) {
    await pool.query(`
      INSERT INTO archive_entries (id, college_id, category, body, status, vouch_count, expires_at)
      VALUES ($1,$2,$3,$4,'LIVE',3, NOW() + INTERVAL '2 years')
    `, [uuidv4(), collegeId, e.category, e.body]);
  }

  console.log('✓ Seeded: 3 users, 4 tips, 4 archive entries');
  console.log('\nTest accounts (use OTP login):');
  console.log('  Senior: senior1@juetguna.in');
  console.log('  Senior: senior2@juetguna.in');
  console.log('  Fresher: fresher1@juetguna.in');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
