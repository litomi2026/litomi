import './style.css'

const REMOTE_URL = 'https://litomi.in/'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Unable to find the app root')
}

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Litomi Remote Shell</p>
      <h1>네이티브 앱은 <span>litomi.in</span>을 직접 엽니다.</h1>
      <p class="lede">
        이 번들은 앱이 연결에 실패했을 때 보여줄 로컬 안전망과 진단 화면만 제공합니다.
      </p>
      <div class="actions">
        <a class="button button-primary" href="${REMOTE_URL}">사이트 열기</a>
        <a class="button button-secondary" href="/error/index.html">오류 화면 보기</a>
      </div>
    </section>

    <section class="panel-grid" aria-label="Remote shell rules">
      <article class="panel">
        <p class="panel-label">Start URL</p>
        <p class="panel-value">${REMOTE_URL}</p>
        <p class="panel-copy">앱 시작 직후 native splash 다음 단계에서 바로 이 주소를 불러옵니다.</p>
      </article>

      <article class="panel">
        <p class="panel-label">In-app navigation</p>
        <p class="panel-value">https://litomi.in same-origin only</p>
        <p class="panel-copy">같은 origin 안에서는 WebView를 유지하고, 다른 origin은 시스템 브라우저로 보냅니다.</p>
      </article>

      <article class="panel">
        <p class="panel-label">Local fallback</p>
        <p class="panel-value">/error/index.html</p>
        <p class="panel-copy">네트워크, TLS, HTTP 오류 또는 초기 로드 타임아웃이 나면 이 로컬 화면으로 전환합니다.</p>
      </article>
    </section>
  </main>
`
