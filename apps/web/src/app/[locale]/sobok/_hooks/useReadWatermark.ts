import { useEffect, useRef } from 'react'

// 라이브 버스트에서 메시지마다 PUT이 나가지 않도록 전송을 합치는 최소 간격.
const COOLDOWN_MS = 3_000

// 읽음 워터마크 전송 게이트 — 문서가 실제로 보일 때만 mark하고(백그라운드 탭에서 도착한
// 메시지는 탭에 돌아왔을 때 처리), 버스트는 leading+trailing 쿨다운으로 합치며, 이미 보낸
// 위치보다 과거로는 보내지 않는다. messageId는 ULID라 문자열 비교가 곧 시간 비교다.
// markRead가 프로미스를 돌려주면 실패 시 위치를 되돌려 다음 트리거에서 재전송한다.
export default function useReadWatermark(
  latestMessageId: string | undefined,
  markRead: (lastReadMessageId: string) => unknown,
) {
  const latestRef = useRef(latestMessageId)
  const markReadRef = useRef(markRead)
  const lastSentRef = useRef('')
  const cooldownRef = useRef<number | null>(null)

  latestRef.current = latestMessageId
  markReadRef.current = markRead

  useEffect(() => {
    function flush() {
      const messageId = latestRef.current

      if (!messageId || messageId <= lastSentRef.current || document.visibilityState !== 'visible') {
        return
      }

      const previous = lastSentRef.current
      lastSentRef.current = messageId

      Promise.resolve(markReadRef.current(messageId)).catch(() => {
        // 전송 실패 — 워터마크 위치를 되돌려 다음 트리거(새 메시지·가시성 변화)가 재전송하게 한다.
        if (lastSentRef.current === messageId) {
          lastSentRef.current = previous
        }
      })
    }

    // 쿨다운 중 도착한 메시지는 trailing flush가 latestRef로 흡수한다.
    function requestMark() {
      if (cooldownRef.current !== null) {
        return
      }

      flush()

      cooldownRef.current = window.setTimeout(() => {
        cooldownRef.current = null
        flush()
      }, COOLDOWN_MS)
    }

    requestMark()
    document.addEventListener('visibilitychange', requestMark)

    return () => {
      document.removeEventListener('visibilitychange', requestMark)
    }
  }, [latestMessageId])

  useEffect(() => {
    return () => {
      if (cooldownRef.current !== null) {
        window.clearTimeout(cooldownRef.current)
        cooldownRef.current = null
      }
    }
  }, [])
}
