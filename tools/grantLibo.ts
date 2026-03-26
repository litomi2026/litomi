#!/usr/bin/env bun

import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { TRANSACTION_TYPE } from '../src/constants/points'
import { db } from '../src/database/supabase/drizzle'
import { pointTransactionTable, userPointsTable } from '../src/database/supabase/points'
import { userTable } from '../src/database/supabase/user'

const ArgsSchema = z
  .object({
    userId: z.coerce.number().int().positive().optional(),
    loginId: z.string().trim().min(2).max(32).optional(),
    amount: z.coerce.number().int().positive().max(1_000_000),
    operator: z.string().trim().min(1).max(64).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    execute: z.boolean().default(false),
    force: z.boolean().default(false),
    json: z.boolean().default(false),
    help: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.userId && !value.loginId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '--user-id 또는 --login-id 중 하나는 꼭 필요해요',
      })
    }
  })

type Args = z.infer<typeof ArgsSchema>

type RecentAdminGrant = {
  id: number
  amount: number
  balanceAfter: number
  createdAt: string
}

type ResolvedUser = {
  id: number
  loginId: string
  name: string
  nickname: string
}

const usage = `
리보 운영 지급 스크립트

Usage:
  bun run grant:libo -- --login-id target --amount 5000
  bun run grant:libo -- --user-id 42 --amount 5000 --operator ops --reason "CS 보상" --execute

Options:
  --user-id <number>      지급 대상 user.id
  --login-id <string>     지급 대상 loginId
  --amount <number>       지급할 리보
  --operator <string>     작업자 식별자 (출력용, DB에는 저장되지 않아요)
  --reason <string>       지급 사유 (출력용, DB에는 저장되지 않아요)
  --execute               실제 지급 실행 (없으면 preview)
  --force                 최근 같은 금액의 운영 지급 이력이 있어도 계속 진행
  --json                  JSON으로 출력
  --help                  도움말
`.trim()

await main()

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR')
}

async function getCurrentBalance(userId: number) {
  const [points] = await db
    .select({ balance: userPointsTable.balance })
    .from(userPointsTable)
    .where(eq(userPointsTable.userId, userId))
    .limit(1)

  return { balance: points?.balance ?? 0 }
}

async function getRecentAdminGrants(userId: number): Promise<RecentAdminGrant[]> {
  const grants = await db
    .select({
      id: pointTransactionTable.id,
      amount: pointTransactionTable.amount,
      balanceAfter: pointTransactionTable.balanceAfter,
      createdAt: pointTransactionTable.createdAt,
    })
    .from(pointTransactionTable)
    .where(and(eq(pointTransactionTable.userId, userId), eq(pointTransactionTable.type, TRANSACTION_TYPE.ADMIN_GRANT)))
    .orderBy(desc(pointTransactionTable.id))
    .limit(5)

  return grants.map((grant) => ({
    ...grant,
    createdAt: grant.createdAt.toISOString(),
  }))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    console.log(usage)
    return
  }

  const user = await resolveUser(args)
  const [currentPoints, recentAdminGrants] = await Promise.all([
    getCurrentBalance(user.id),
    getRecentAdminGrants(user.id),
  ])
  const matchingRecentGrant = recentAdminGrants.find((grant) => grant.amount === args.amount)
  const predictedBalance = currentPoints.balance + args.amount

  if (!args.execute) {
    printResult({
      json: args.json,
      result: {
        mode: 'preview',
        status: 'ready',
        executeRequested: false,
        user,
        amount: args.amount,
        currentBalance: currentPoints.balance,
        predictedBalance,
        operator: args.operator ?? null,
        reason: args.reason ?? null,
        recentAdminGrants,
        matchingRecentGrant: matchingRecentGrant ?? null,
      },
    })
    return
  }

  if (matchingRecentGrant && !args.force) {
    printResult({
      json: args.json,
      result: {
        mode: 'execute',
        status: 'blocked-recent-match',
        executeRequested: true,
        user,
        amount: args.amount,
        currentBalance: currentPoints.balance,
        predictedBalance,
        operator: args.operator ?? null,
        reason: args.reason ?? null,
        recentAdminGrants,
        matchingRecentGrant,
      },
    })
    process.exitCode = 1
    return
  }

  const result = await db.transaction(async (tx) => {
    const now = new Date()

    await tx.insert(userPointsTable).values({ userId: user.id }).onConflictDoNothing()

    const [points] = await tx
      .select({ balance: userPointsTable.balance })
      .from(userPointsTable)
      .where(eq(userPointsTable.userId, user.id))
      .for('update')

    if (!points) {
      throw new Error('User points record is missing after upsert')
    }

    const newBalance = points.balance + args.amount

    await tx
      .update(userPointsTable)
      .set({
        balance: newBalance,
        totalEarned: sql`${userPointsTable.totalEarned} + ${args.amount}`,
        updatedAt: now,
      })
      .where(eq(userPointsTable.userId, user.id))

    const [transaction] = await tx
      .insert(pointTransactionTable)
      .values({
        userId: user.id,
        type: TRANSACTION_TYPE.ADMIN_GRANT,
        amount: args.amount,
        balanceAfter: newBalance,
      })
      .returning({ id: pointTransactionTable.id })

    return {
      currentBalance: points.balance,
      newBalance,
      pointTransactionId: transaction.id,
    }
  })

  printResult({
    json: args.json,
    result: {
      mode: 'execute',
      status: 'granted',
      executeRequested: true,
      user,
      amount: args.amount,
      currentBalance: result.currentBalance,
      predictedBalance: result.newBalance,
      operator: args.operator ?? null,
      reason: args.reason ?? null,
      recentAdminGrants,
      matchingRecentGrant: matchingRecentGrant ?? null,
      pointTransactionId: result.pointTransactionId,
    },
  })
}

function parseArgs(argv: string[]): Args {
  const raw: Record<string, boolean | string> = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]

    if (token === '--') continue
    if (token === '--help' || token === '-h') {
      raw.help = true
      continue
    }
    if (token === '--execute') {
      raw.execute = true
      continue
    }
    if (token === '--force') {
      raw.force = true
      continue
    }
    if (token === '--json') {
      raw.json = true
      continue
    }
    if (!token.startsWith('--')) {
      throw new Error(`알 수 없는 인자예요: ${token}`)
    }

    const key = token.slice(2)
    const value = argv[i + 1]

    if (!value || value.startsWith('--')) {
      throw new Error(`${token} 값이 필요해요`)
    }

    raw[key] = value
    i += 1
  }

  if (raw.help === true) {
    return {
      amount: 1,
      execute: false,
      force: false,
      json: raw.json === true,
      help: true,
    } as Args
  }

  const parsed = ArgsSchema.safeParse({
    userId: raw['user-id'] ?? raw.userId,
    loginId: raw['login-id'] ?? raw.loginId,
    amount: raw.amount,
    operator: raw.operator,
    reason: raw.reason,
    execute: raw.execute === true,
    force: raw.force === true,
    json: raw.json === true,
    help: false,
  })

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `- ${issue.message}`).join('\n')
    throw new Error(`${details}\n\n${usage}`)
  }

  return parsed.data
}

function printResult(params: {
  json: boolean
  result: {
    mode: 'execute' | 'preview'
    status: 'blocked-recent-match' | 'granted' | 'ready'
    executeRequested: boolean
    user: ResolvedUser
    amount: number
    currentBalance: number
    predictedBalance: number
    operator: string | null
    reason: string | null
    recentAdminGrants: RecentAdminGrant[]
    matchingRecentGrant: RecentAdminGrant | null
    pointTransactionId?: number
  }
}) {
  const { json, result } = params

  if (json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(`mode: ${result.mode}`)
  console.log(`status: ${result.status}`)
  console.log(`executeRequested: ${result.executeRequested ? 'yes' : 'no'}`)
  console.log(`user: ${result.user.loginId} (#${result.user.id}, ${result.user.nickname})`)
  console.log(`amount: ${formatNumber(result.amount)} 리보`)
  console.log(`currentBalance: ${formatNumber(result.currentBalance)} 리보`)
  console.log(`predictedBalance: ${formatNumber(result.predictedBalance)} 리보`)
  console.log(`operator: ${result.operator ?? '(미입력)'}`)
  console.log(`reason: ${result.reason ?? '(미입력)'}`)
  console.log('metadataPersistence: operator/reason은 DB에 저장되지 않아요')

  if (result.pointTransactionId) {
    console.log(`pointTransactionId: ${result.pointTransactionId}`)
  }

  if (result.matchingRecentGrant) {
    console.log('warning: 최근 운영 지급 이력 중 같은 금액이 있어요')
    console.log(`  id: ${result.matchingRecentGrant.id}`)
    console.log(`  amount: ${formatNumber(result.matchingRecentGrant.amount)} 리보`)
    console.log(`  createdAt: ${result.matchingRecentGrant.createdAt}`)
  }

  if (result.recentAdminGrants.length > 0) {
    console.log('recentAdminGrants:')
    for (const grant of result.recentAdminGrants) {
      console.log(
        `  - #${grant.id} ${formatNumber(grant.amount)} 리보 / balanceAfter ${formatNumber(grant.balanceAfter)} / ${grant.createdAt}`,
      )
    }
  }
}

async function resolveUser(args: Args): Promise<ResolvedUser> {
  const whereCondition =
    args.userId && args.loginId
      ? and(eq(userTable.id, args.userId), eq(userTable.loginId, args.loginId))
      : args.userId
        ? eq(userTable.id, args.userId)
        : eq(userTable.loginId, args.loginId!)

  const [user] = await db
    .select({
      id: userTable.id,
      loginId: userTable.loginId,
      name: userTable.name,
      nickname: userTable.nickname,
    })
    .from(userTable)
    .where(whereCondition)
    .limit(1)

  if (!user) {
    const label = args.userId ? `userId=${args.userId}` : `loginId=${args.loginId}`
    throw new Error(`지급 대상을 찾지 못했어요: ${label}`)
  }

  return user
}
