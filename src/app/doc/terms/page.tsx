/* eslint-disable react/no-unescaped-entities */

export default async function Page() {
  return (
    <div className="p-4 md:p-16 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:list-inside">
      <div className="max-w-prose mx-auto">
        <h1 className="text-3xl font-bold mb-6">이용약관</h1>
        <h2 className="mb-3">제 1 조 (목적)</h2>
        <p className="mb-4">
          이 약관은 Litomi (이하 "본 서비스")의 이용과 관련하여 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을
          규정함을 목적으로 합니다.
        </p>
        <h2 className="mb-3">제 2 조 (용어의 정의)</h2>
        <ul className="mb-4">
          <li>"이용자"라 함은 본 약관에 따라 본 서비스를 이용하는 개인 또는 단체를 말합니다.</li>
          <li>"서비스"라 함은 Litomi 사이트에서 제공하는 온라인 상의 모든 서비스 및 부가 기능을 말합니다.</li>
        </ul>
        <h2 className="mb-2">제 3 조 (서비스 목적)</h2>
        <p className="mb-4">
          본 서비스는 많은 이용자와 활성 사용자를 확보하여 서비스 개발 및 운영 경험이 있다고 포트폴리오에 작성하는 것이
          목적입니다.
        </p>
        <h2 className="mb-2">제 4 조 (광고 게재 정책)</h2>
        <p className="mb-4">
          본 서비스는 운영을 통한 수익 창출을 목적으로 하지 않으며, 현재 및 향후 구글 광고나 성인 광고 등 외부 광고를
          게재하지 않을 것입니다.
        </p>
        <h2 className="mb-2">제 5 조 (오픈 소스 전환)</h2>
        <p className="mb-4">
          만약 향후 사이트 트래픽 증가로 인해 운영 비용 부담이 심각하게 발생할 경우, 해당 상황을 검토하여 서비스의 지속
          가능성을 확보하기 위한 대안으로 Litomi 소스 코드를 공개할 예정입니다. 이 경우, 이용자께서는 Vercel 클라우드 등
          선호하는 플랫폼을 활용하여 자체적으로 호스팅할 수 있습니다.
        </p>
        <h2 className="mb-2">제 6 조 (지원하는 브라우저)</h2>
        <p className="mb-4">
          본 서비스는 최신 버전의 웹 브라우저에서 최적화되어 있으며, 구형 브라우저에서는 일부 기능이 제한될 수 있습니다.
          <br />본 서비스는 다음의 브라우저에서 지원됩니다.
        </p>
        <ul className="mb-4">
          <li>Chrome 80</li>
          <li>Edge 80</li>
          <li>Safari 14, iOS Safari 14.4</li>
          <li>Firefox 74</li>
          <li>Opera 67</li>
          <li>Samsung Internet 13.0</li>
        </ul>
        <h3 className="mt-6 text-center">시행일 2025-03-15</h3>
      </div>
    </div>
  )
}
