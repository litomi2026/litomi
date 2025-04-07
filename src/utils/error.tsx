import LoginLink from '@/components/LoginLink'
import { QueryKeys } from '@/constants/query'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type Params = {
  message: string
  queryClient: ReturnType<typeof useQueryClient>
}

export function handleUnauthorizedError({ message, queryClient }: Params) {
  queryClient.invalidateQueries({ queryKey: QueryKeys.me })
  toast.warning(
    <div className="flex gap-2 items-center">
      <div>{message}</div>
      <LoginLink>로그인하기</LoginLink>
    </div>,
  )
}
