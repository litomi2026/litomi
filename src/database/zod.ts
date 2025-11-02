import 'server-only'
import { z } from 'zod'

import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@/constants/policy'

export const loginIdSchema = z
  .string()
  .min(2, { error: '아이디는 최소 2자 이상이어야 해요' })
  .max(32, { error: '아이디는 최대 32자까지 입력할 수 있어요' })
  .regex(new RegExp(LOGIN_ID_PATTERN), { error: '아이디는 알파벳, 숫자, _ 로만 구성해야 해요' })

export const passwordSchema = z
  .string()
  .min(8, { error: '비밀번호는 최소 8자 이상이어야 해요' })
  .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있어요' })
  .regex(new RegExp(PASSWORD_PATTERN), { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요' })

export const nameSchema = z
  .string()
  .min(2, { error: '이름은 최소 2자 이상이어야 해요' })
  .max(32, { error: '이름은 최대 32자까지 입력할 수 있어요' })
  .regex(/^[a-zA-Z][a-zA-Z0-9-._~]*$/, { error: '이름은 알파벳, 숫자 - . _ ~ 로만 구성해야 해요' })

export const nicknameSchema = z
  .string()
  .min(2, { error: '닉네임은 최소 2자 이상이어야 해요' })
  .max(32, { error: '닉네임은 최대 32자까지 입력할 수 있어요' })

export const imageURLSchema = z
  .url('프로필 이미지 주소가 URL 형식이 아니에요')
  .max(256, '프로필 이미지 URL은 최대 256자까지 입력할 수 있어요')
