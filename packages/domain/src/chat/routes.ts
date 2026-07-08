// sobok 라우트 경로의 단일 정의부. 팬 공개 페이지는 @ 네임스페이스(예약어·세그먼트 충돌 방지)를,
// 스튜디오는 bare handle을 쓴다 — 이 규칙이 웹 링크와 푸시 프로듀서마다 따로 조립되며 어긋나
// (@ 누락) 푸시 링크가 404로 새던 일을 막기 위해 모든 프로듀서가 여기 한 곳을 거쳐 조립한다.

export function sobokRoomPath(handle: string): string {
  return `/sobok/@${handle}`
}

export function sobokStudioPath(handle: string): string {
  return `/sobok/studio/${handle}`
}
