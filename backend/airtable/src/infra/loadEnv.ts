import * as dotenv from 'dotenv'

export function loadEnv() {
  if (process.env.NODE_ENV !== 'production') {
    const path = `.env-${process.env.NODE_ENV}`
    dotenv.config({ path })
  } else {
    dotenv.config()
  }
}

export function mandatoryEnv(name: string) {
  const value = process.env[name]
  if (value === undefined) {
    console.error(`Environment variable ${name} is not defined`)
    throw new Error(`Environment variable ${name} is not defined`)
  }
  return value
}
