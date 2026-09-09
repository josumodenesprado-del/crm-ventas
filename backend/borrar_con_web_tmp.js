const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.yycfkpdchgsxiqewkmrw:Zarzalamayor05@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const modo = process.argv[2] || 'preview';
  const sel = await pool.query(
    `SELECT id, nombre FROM leads WHERE notas LIKE '%TIENE web propia%' ORDER BY id`);
  console.log('Marcadas con web:', sel.rows.length);
  sel.rows.forEach(r => console.log('  id=' + r.id + ' ' + r.nombre));
  if (modo === 'borrar') {
    const del = await pool.query(`DELETE FROM leads WHERE notas LIKE '%TIENE web propia%' RETURNING id`);
    console.log('Borradas:', del.rows.length);
    const rest = await pool.query('SELECT COUNT(*) AS n FROM leads');
    console.log('Restantes total:', rest.rows[0].n);
  } else {
    console.log('(modo preview — pasa "borrar" como argumento para ejecutar)');
  }
  await pool.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
