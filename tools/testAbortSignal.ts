#!/usr/bin/env bun
/**
 * 클라이언트 연결 끊김 시나리오 테스트 스크립트
 *
 * 실행: bun tools/testAbortSignal.ts
 */

const BASE_URL = 'http://localhost:3000'

// 메인 실행
async function main() {
  console.log('🧪 클라이언트 연결 끊김 테스트 시작\n')
  console.log('서버가 실행 중인지 확인하세요: bun run dev')
  console.log('='.repeat(50))

  await testImmediateAbort()
  await testDelayedAbort(100) // 빠른 중단
  await testDelayedAbort(500) // 중간 중단
  await testDelayedAbort(2000) // 늦은 중단
  await testRaceCondition()
  await testServerSideTimeout()

  console.log(`\n${'='.repeat(50)}`)
  console.log('✅ 테스트 완료')
}

async function testDelayedAbort(delay: number) {
  console.log(`\n2. ${delay}ms 후 중단 테스트`)
  const controller = new AbortController()

  // 타이머 설정
  const timer = setTimeout(() => {
    controller.abort()
    console.log(`⏱️ ${delay}ms 경과 - 연결 중단`)
  }, delay)

  const startTime = Date.now()

  try {
    const response = await fetch(`${BASE_URL}/api/proxy/k/search?query=test`, {
      signal: controller.signal,
    })
    const duration = Date.now() - startTime
    clearTimeout(timer)

    console.log(`✅ 요청 성공 (${duration}ms 소요)`)
    console.log('Status:', response.status)

    // 응답 본문 읽기 시도
    const data = (await response.json()) as { mangas?: Array<unknown> }
    console.log('Mangas count:', data.mangas?.length || 0)
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`✅ AbortError 발생 (${duration}ms 소요)`)
    } else if (error instanceof Error) {
      console.log(`❌ 다른 에러 (${duration}ms):`, error.message)
    } else {
      console.log(`❌ 알 수 없는 에러 (${duration}ms):`, error)
    }
  }
}

async function testImmediateAbort() {
  console.log('\n1. 즉시 중단 테스트')
  const controller = new AbortController()
  controller.abort() // 즉시 중단

  try {
    await fetch(`${BASE_URL}/api/proxy/k/search?query=test`, { signal: controller.signal })
    console.log('❌ 요청이 성공함 (예상: 실패)')
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('✅ AbortError 발생 (정상)')
    } else if (error instanceof Error) {
      console.log('❌ 다른 에러:', error.message)
    } else {
      console.log('❌ 알 수 없는 에러:', error)
    }
  }
}

async function testRaceCondition() {
  console.log('\n3. 경쟁 조건 테스트 (여러 요청 동시 중단)')

  const controllers = Array(5)
    .fill(null)
    .map(() => new AbortController())

  const promises = controllers.map((controller, index) =>
    fetch(`${BASE_URL}/api/proxy/k/search?query=test${index}`, {
      signal: controller.signal,
    })
      .then(() => `Request ${index}: Success`)
      .catch((err) => `Request ${index}: ${err instanceof Error ? err.name : 'Unknown error'}`),
  )

  // 무작위 시간에 각 요청 중단
  controllers.forEach((controller, index) => {
    setTimeout(() => {
      controller.abort()
      console.log(`⏱️ Request ${index} aborted`)
    }, Math.random() * 1000)
  })

  const results = await Promise.all(promises)
  results.forEach((result) => console.log(result))
}

async function testServerSideTimeout() {
  console.log('\n4. 서버 측 타임아웃 테스트')

  // 매우 복잡한 쿼리로 서버 부하 유발
  const complexQuery = 'a'.repeat(100) // 긴 검색어

  try {
    const response = await fetch(`${BASE_URL}/api/proxy/k/search?query=${complexQuery}&min-page=1000&max-page=2000`)
    console.log('Status:', response.status)

    if (response.status === 400) {
      console.log('✅ 긴 쿼리 거부됨 (정상)')
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error:', error.message)
    } else {
      console.log('Error:', error)
    }
  }
}

main().catch(console.error)
