exports.up = (pgm) => {
  pgm.createTable('colleges', {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'text', notNull: true },
    email_domain: { type: 'text', notNull: true, unique: true },
    city: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true },
    email: { type: 'text', notNull: true, unique: true },
    name: { type: 'text', notNull: true },
    college_id: { type: 'uuid', references: 'colleges(id)' },
    branch: { type: 'text' },
    year_of_study: { type: 'int' },
    role: { type: 'text', notNull: true, check: "role IN ('FRESHER','SENIOR','MODERATOR','ADMIN')" },
    credibility_score: { type: 'int', default: 50, check: 'credibility_score BETWEEN 0 AND 100' },
    is_verified: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    last_active_at: { type: 'timestamptz' },
  });

  pgm.createTable('tips', {
    id: { type: 'uuid', primaryKey: true },
    author_id: { type: 'uuid', references: 'users(id)' },
    cosigner_id: { type: 'uuid', references: 'users(id)' },
    college_id: { type: 'uuid', references: 'colleges(id)' },
    title: { type: 'text', notNull: true },
    body: { type: 'text', notNull: true },
    category: { type: 'text', check: "category IN ('SCHOLARSHIP','FACULTY','CLUB','PLACEMENT','ADMIN','EXAM')" },
    confidence_stake: { type: 'text', check: "confidence_stake IN ('LOW','MEDIUM','HIGH')" },
    branch_scope: { type: 'text[]', default: pgm.func("'{}'") },
    expiry_date: { type: 'date', notNull: true },
    status: { type: 'text', default: pgm.func("'PENDING_COSIGN'"), check: "status IN ('DRAFT','PENDING_COSIGN','LIVE','DISPUTED','REMOVED','EXPIRED','ARCHIVED')" },
    feed_score: { type: 'float' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.createTable('credibility_events', {
    id: { type: 'uuid', primaryKey: true },
    user_id: { type: 'uuid', references: 'users(id)' },
    delta: { type: 'int', notNull: true },
    reason: { type: 'text', notNull: true },
    reference_id: { type: 'uuid' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.createTable('disputes', {
    id: { type: 'uuid', primaryKey: true },
    tip_id: { type: 'uuid', references: 'tips(id)' },
    reporter_id: { type: 'uuid', references: 'users(id)' },
    q1_what_wrong: { type: 'text', notNull: true },
    q2_acted_on_tip: { type: 'boolean', notNull: true },
    q3_actual_outcome: { type: 'text', notNull: true },
    q4_when_happened: { type: 'date', notNull: true },
    q5_evidence: { type: 'text' },
    status: { type: 'text', default: pgm.func("'OPEN'"), check: "status IN ('OPEN','UPHELD','REJECTED','ADMIN_REVIEW')" },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    resolved_at: { type: 'timestamptz' },
  });

  pgm.createTable('dispute_votes', {
    id: { type: 'uuid', primaryKey: true },
    dispute_id: { type: 'uuid', references: 'disputes(id)' },
    moderator_id: { type: 'uuid', references: 'users(id)' },
    vote: { type: 'text', check: "vote IN ('UPHOLD','REJECT')" },
    voted_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.createTable('nudges', {
    id: { type: 'uuid', primaryKey: true },
    user_id: { type: 'uuid', references: 'users(id)' },
    tip_id: { type: 'uuid', references: 'tips(id)' },
    threshold_days: { type: 'int', notNull: true },
    channel: { type: 'text' },
    sent_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    opened_at: { type: 'timestamptz' },
  });

  pgm.createTable('archive_entries', {
    id: { type: 'uuid', primaryKey: true },
    college_id: { type: 'uuid', references: 'colleges(id)' },
    branch: { type: 'text' },
    category: { type: 'text' },
    body: { type: 'text', notNull: true },
    status: { type: 'text', default: pgm.func("'PENDING'"), check: "status IN ('PENDING','LIVE','REJECTED','ARCHIVED')" },
    vouch_count: { type: 'int', default: 0 },
    submitted_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    expires_at: { type: 'timestamptz' },
  });

  pgm.createTable('archive_vouches', {
    id: { type: 'uuid', primaryKey: true },
    entry_id: { type: 'uuid', references: 'archive_entries(id)' },
    user_id: { type: 'uuid', references: 'users(id)' },
    vouched_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
};

exports.down = (pgm) => {
  ['archive_vouches','archive_entries','nudges','dispute_votes','disputes','credibility_events','tips','users','colleges']
    .forEach(t => pgm.dropTable(t));
};
