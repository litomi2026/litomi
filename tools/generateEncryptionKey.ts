#!/usr/bin/env bun
import crypto from 'crypto'

/**
 * Generate a secure encryption key for TOTP secrets
 * Run with: bun run tools/generateEncryptionKey.ts
 */

console.log('🔐 Generating secure encryption key for TOTP...\n')

// Generate a 32-byte (256-bit) random key
const key = crypto.randomBytes(32).toString('hex')

console.log('Add this to your .env file:')
console.log('─'.repeat(80))
console.log(`TOTP_ENCRYPTION_KEY=${key}`)
console.log('─'.repeat(80))

console.log('\n⚠️  Important:')
console.log('1. Keep this key secret and secure')
console.log('2. Never commit this key to version control')
console.log('3. Use the same key across all instances of your app')
console.log('4. Backup this key securely - losing it means you cannot decrypt existing TOTP secrets')
console.log('5. If you need to rotate the key, you must re-encrypt all existing TOTP secrets')
