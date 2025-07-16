'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import IconInfo from '@/components/icons/IconInfo'
import Loading from '@/components/ui/Loading'
import TooltipPopover from '@/components/ui/TooltipPopover'
import { loginIdPattern, passwordPattern } from '@/constants/pattern'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import { resetMeQuery } from '@/query/useMeQuery'
import { sanitizeRedirect } from '@/utils'

import signup from './action'

const initialState = {} as Awaited<ReturnType<typeof signup>>

export default function SignupForm() {
  const [{ error, success, formData, data }, formAction, pending] = useActionState(signup, initialState)
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const loginId = data?.loginId

  useEffect(() => {
    if (error) {
      toast.error(Object.values(error).flatMap((value) => value.errors)[0])
    }
  }, [error])

  useEffect(() => {
    if (!success) {
      return
    }

    ;(async () => {
      toast.success(`${loginId} 계정으로 가입했어요`)
      resetMeQuery()
      await queryClient.invalidateQueries({ queryKey: QueryKeys.me, type: 'all' })
      const redirect = searchParams.get(SearchParamKey.REDIRECT)
      const sanitizedURL = sanitizeRedirect(redirect) || '/'
      router.replace(sanitizedURL.replace(/^\/@\//, `/@${loginId}/`))
    })()
  }, [loginId, queryClient, router, searchParams, success])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formElement = e.target as HTMLFormElement

    if (formElement.password.value !== formElement['password-confirm'].value) {
      e.preventDefault()
      toast.warning('비밀번호가 일치하지 않습니다.')
    } else if (formElement.loginId.value === formElement.password.value) {
      e.preventDefault()
      toast.warning('아이디와 비밀번호를 다르게 입력해주세요.')
    }
  }

  return (
    <form
      action={formAction}
      className="grid gap-6 
        [&_label]:block [&_label]:text-sm [&_label]:md:text-base [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:leading-7
        [&_input]:mt-1 [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
        [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
        [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed
        [&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700 [&_input]:aria-invalid:placeholder-red-700"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4">
        <div>
          <div className="flex items-center gap-1">
            <label htmlFor="id">
              아이디 <span className="text-red-500">*</span>
            </label>
            <TooltipPopover className="flex" position="right" type="tooltip">
              <IconInfo className="p-1.5 w-7 md:w-8 md:p-2" />
              <div className="rounded-xl border-2 border-zinc-700 bg-background p-3 whitespace-nowrap text-sm">
                <p>
                  알파벳, 숫자 - . _ ~ 만 사용하여 <br />
                  2자 이상의 아이디를 입력해주세요.
                </p>
              </div>
            </TooltipPopover>
          </div>
          <input
            aria-invalid={(error?.loginId?.errors?.length ?? 0) > 0}
            autoFocus
            defaultValue={String(formData?.get('loginId') ?? '')}
            disabled={pending}
            id="loginId"
            maxLength={32}
            minLength={2}
            name="loginId"
            pattern={loginIdPattern}
            placeholder="아이디를 입력하세요"
            required
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <label htmlFor="password">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <TooltipPopover className="flex" position="right" type="tooltip">
              <IconInfo className="p-1.5 w-7 md:w-8 md:p-2" />
              <div className="rounded-xl border-2 border-zinc-700 bg-background p-3 whitespace-nowrap text-sm">
                <p>
                  알파벳, 숫자를 포함하여 8자 이상의 <br />
                  비밀번호를 입력해주세요.
                </p>
              </div>
            </TooltipPopover>
          </div>
          <input
            aria-invalid={(error?.password?.errors?.length ?? 0) > 0}
            defaultValue={String(formData?.get('password') ?? '')}
            disabled={pending}
            id="password"
            maxLength={64}
            minLength={8}
            name="password"
            pattern={passwordPattern}
            placeholder="비밀번호를 입력하세요"
            required
            type="password"
          />
        </div>
        <div>
          <label htmlFor="password-confirm">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <input
            aria-invalid={(error?.['password-confirm']?.errors?.length ?? 0) > 0}
            defaultValue={String(formData?.get('password-confirm') ?? '')}
            disabled={pending}
            id="password-confirm"
            name="password-confirm"
            placeholder="비밀번호를 다시 입력하세요"
            required
            type="password"
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <label htmlFor="nickname">닉네임</label>
            <TooltipPopover className="flex" position="right" type="tooltip">
              <IconInfo className="p-1.5 w-7 md:w-8 md:p-2" />
              <div className="rounded-xl border-2 border-zinc-700 bg-background p-3 whitespace-nowrap text-sm">
                <p>2자 이상 32자 이하로 입력해주세요. 나중에 변경할 수 있어요.</p>
              </div>
            </TooltipPopover>
          </div>
          <input
            aria-invalid={(error?.nickname?.errors?.length ?? 0) > 0}
            defaultValue={String(formData?.get('nickname') ?? '')}
            disabled={pending}
            id="nickname"
            maxLength={32}
            minLength={2}
            name="nickname"
            placeholder="닉네임을 입력하세요"
          />
        </div>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500 focus:outline-none focus:ring-3 focus:ring-zinc-500"
        disabled={pending}
        type="submit"
      >
        <div className="p-2 flex justify-center bg-zinc-900 cursor-pointer rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed">
          {pending ? <Loading className="text-zinc-500 w-12 p-2" /> : '회원가입'}
        </div>
      </button>
    </form>
  )
}

export function SignupFormSkeleton() {
  return <div className="h-[412px] rounded-xl bg-zinc-700 animate-fade-in" />
}
