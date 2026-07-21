const { Client } = require('pg');

const sourceUrl = process.env.LOCAL_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  throw new Error('LOCAL_DATABASE_URL and DATABASE_URL are required.');
}

const tables = [
  'users',
  'services',
  'coupons',
  'offers',
  'bookings',
  'orders',
  'payments',
  'notifications'
];

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

async function tableExists(client, table) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS "exists"`,
    [table]
  );
  return result.rows[0].exists;
}

async function migrate() {
  const source = new Client({ connectionString: sourceUrl });
  const target = new Client({
    connectionString: targetUrl,
    ssl: { require: true, rejectUnauthorized: false }
  });

  await source.connect();
  await target.connect();

  try {
    const sourceIdentity = await source.query('SELECT current_database() AS database, current_user AS username');
    const targetIdentity = await target.query('SELECT current_database() AS database, current_user AS username');
    console.log(`Source: ${sourceIdentity.rows[0].database} (${sourceIdentity.rows[0].username})`);
    console.log(`Target: ${targetIdentity.rows[0].database} (${targetIdentity.rows[0].username})`);

    await target.query('BEGIN');

    for (const table of tables) {
      if (!(await tableExists(source, table))) {
        console.log(`${table}: source table not found, skipped`);
        continue;
      }
      if (!(await tableExists(target, table))) {
        throw new Error(`Target table ${table} does not exist. Start the Render API once to create its schema, then rerun migration.`);
      }

      const sourceRows = await source.query(`SELECT * FROM ${quoteIdentifier(table)} ORDER BY id`);
      let inserted = 0;

      for (const row of sourceRows.rows) {
        const columns = Object.keys(row);
        const columnSql = columns.map(quoteIdentifier).join(', ');
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        const result = await target.query(
          `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          columns.map((column) => row[column])
        );
        inserted += result.rowCount;
      }

      if (sourceRows.rows.some((row) => row.id != null)) {
        await target.query(
          `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${quoteIdentifier(table)}), 1), true)`,
          [table]
        );
      }

      const targetCount = await target.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table)}`);
      console.log(`${table}: source=${sourceRows.rowCount}, inserted=${inserted}, target=${targetCount.rows[0].count}`);
    }

    await target.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await target.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await Promise.allSettled([source.end(), target.end()]);
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});
