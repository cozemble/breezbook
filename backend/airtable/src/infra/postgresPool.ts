import pg from 'pg';

let pool: pg.Pool | null = null;

export async function closePgPool() {
	if (pool) {
		await pool.end();
		pool = null;
	}
}
