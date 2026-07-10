import { type Column, sql } from 'drizzle-orm'

// Binds a dynamic list as a single array parameter (`col = ANY($1::type[])`) so the query shape
// stays constant regardless of length — avoids the postgres.js client-side prepared-statement cache
// growing per distinct `IN ($1, …, $N)` length, and sidesteps the 65535 bind-parameter limit.
export function anyOf(column: Column, values: readonly unknown[]) {
  return sql`${column} = ANY(${sql.param(values)}::${sql.raw(column.getSQLType())}[])`
}

export function noneOf(column: Column, values: readonly unknown[]) {
  return sql`${column} <> ALL(${sql.param(values)}::${sql.raw(column.getSQLType())}[])`
}
