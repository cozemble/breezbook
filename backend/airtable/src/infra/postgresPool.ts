import pg from 'pg'
import { mandatoryEnv } from './loadEnv.js'

let pool: pg.Pool | null = null

export function pgPool() {
  if (pool) {
    return pool
  }
  const host = mandatoryEnv('PGHOST')
  const port = parseInt(mandatoryEnv('PGPORT'))
  const database = mandatoryEnv('PGDATABASE')
  const adminUser = mandatoryEnv('PG_ADMIN_USER')
  const adminPassword = mandatoryEnv('PG_ADMIN_PASSWORD')
  console.log(`Connecting to postgres at ${host}:${port}/${database} as user '${adminUser}'...`)
  pool = new pg.Pool({
    host,
    port,
    database,
    user: adminUser,
    password: adminPassword,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
  pool.on('connect', (client) => {
    client.on('notice', (message) => {
      console.log('PostgreSQL Notice:', message)
    })
  })
  return pool
}

export async function closePgPool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export async function withAdminPgClient<T>(f: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pgPool().connect()
  try {
    return await f(client)
  } finally {
    client.release()
  }
}

export async function inTxn<T>(client: pg.PoolClient, action: () => Promise<T>): Promise<T> {
  await client.query('BEGIN')
  try {
    const t = await action()
    await client.query('COMMIT')
    return t
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  }
}
