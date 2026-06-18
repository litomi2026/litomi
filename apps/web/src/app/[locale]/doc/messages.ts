import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      doc: {
        compliance2257: {
          title: '2257 컴플라이언스 안내',
          description: '리토미의 18 U.S.C. §2257 및 §2257A 관련 운영 원칙을 안내합니다.',
        },
        dmca: {
          title: '저작권/DMCA 신고',
          description: '리토미에 저작권 또는 DMCA 신고를 제출하는 방법을 안내합니다.',
        },
        privacy: {
          title: '개인정보 처리방침',
          description: '리토미가 어떤 정보를 어떤 목적으로 처리하는지 안내합니다.',
        },
        terms: {
          title: '이용약관',
          description: '리토미 서비스 이용에 적용되는 약관을 안내합니다.',
        },
        youthProtection: {
          title: '청소년보호정책',
          description: '청소년이 유해한 정보로부터 보호받을 수 있도록 적용하는 정책을 안내합니다.',
        },
      },
    },
    Doc: {
      common: {
        back: '← 돌아가기',
        toc: '목차',
        tocAria: '목차',
        contactLabel: '문의처:',
        emailLabel: '이메일',
        effectiveDate: '시행일 {date}',
      },
      compliance2257: {
        title: '18 U.S.C. §2257 / §2257A 컴플라이언스 안내',
        subtitle:
          '본 페이지는 서비스의 호스팅 구조와 18 U.S.C. §2257, §2257A 및 28 C.F.R. Part 75 관련 운영 원칙을 설명합니다.',
        notice: {
          p1: '본 안내는 서비스 수준의 일반 고지입니다. 개별 업로더 또는 원 저작자가 별도의 작품별 record-keeping statement를 제공하는 경우, 해당 작품에 대해서는 그 작품별 고지가 우선합니다.',
          p2: '본 서비스는 제3자 업로더가 제공한 개별 고지, 기록 보관 의무의 적용 여부, 또는 특정 작품의 적법성을 보증하지 않습니다.',
        },
        sections: {
          scope: {
            title: '1. 적용 범위',
            p1: '<law>18 U.S.C. §2257</law>, <law>18 U.S.C. §2257A</law>, 그리고 <law>28 C.F.R. Part 75</law>는 일반적으로 실제 인간이 등장하는 특정 시각적 표현물에 대한 연령 확인, 기록 보관, 라벨링 의무를 다룹니다.',
            p2: '본 서비스는 이용자가 업로드한 작품을 호스팅하는 온라인 플랫폼입니다. 이 페이지는 서비스의 일반적인 운영 방식과, 본 서비스에 게시되는 작품 유형을 기준으로 한 기본 입장을 설명하기 위한 것입니다.',
          },
          platformRole: {
            title: '2. 플랫폼의 역할',
            p1: '본 서비스는 이용자 제출 자료를 저장, 전송, 표시, 검색, 인덱싱하는 플랫폼으로 운영됩니다. 본 서비스는 제3자가 업로드한 작품에 대해 출연자를 섭외하거나, 고용하거나, 촬영을 지시하거나, 제작에 관여하지 않습니다.',
            p2: '따라서 본 서비스는 통상적인 운영 범위에서 제3자 제출 콘텐츠의 원 제작자 또는 출연자 관리 주체가 아니며, 단순 호스팅만으로 제3자 작품의 기록관리 책임자(custodian of records)로 지정되는 것은 아닙니다.',
          },
          nonRealPerson: {
            title: '3. 실제 사람이 아닌 작품',
            p1: '본 서비스에 게시되는 작품의 대부분은 웹툰, 만화, 동인지, 일러스트 등 실제 인간을 묘사하지 않는 창작물 또는 비사진적 표현물입니다.',
            p2: '이러한 작품은 실제 인간의 시각적 묘사에 관한 기록 보관 제도를 전제로 하는 18 U.S.C. §2257, §2257A 및 28 C.F.R. Part 75의 일반적인 적용 대상이 아닙니다.',
          },
          realPerson: {
            title: '4. 실제 사람이 등장하는 예외 콘텐츠',
            p1: '예외적으로 실제 성인이 등장하는 제3자 업로드 콘텐츠가 게시될 수 있습니다. 본 서비스는 미성년자가 등장하는 실제 인물 콘텐츠의 업로드를 허용하지 않습니다.',
            p2: '업로더 또는 원 콘텐츠 제공자가 실제 인간이 등장하는 자료를 제출하는 경우, 해당 제출자는 모든 묘사 대상이 제작 시점에 만 18세 이상이었는지 확인해야 하며, 관련 법률이 적용되는 경우 필요한 기록 보관 및 고지 의무를 스스로 판단하고 이행해야 합니다.',
            p3: '개별 작품에 대해 업로더가 별도의 2257 또는 2257A 고지를 제공하는 경우, 그 고지는 해당 작품에 관한 업로더 제공 작품별 고지로 취급됩니다.',
          },
          uploaderObligations: {
            title: '5. 업로더의 책임',
            items: {
              verifyRecords:
                '실제 인간이 등장하는 자료를 업로드하는 경우, 업로더는 해당 자료에 법률상 기록 보관 의무가 적용되는지 직접 확인해야 합니다.',
              maintainRecords:
                '적용되는 경우, 업로더 또는 원 콘텐츠 제공자는 연령 확인, 기록 보관, 작품별 식별 정보 및 필요한 고지 문구를 직접 유지해야 합니다.',
              noMinors:
                '업로더는 미성년자가 등장하는 실제 인물 자료를 업로드해서는 안 되며, 허위 또는 불완전한 준수 정보를 제공해서도 안 됩니다.',
              legalAdvice:
                '본 서비스는 개별 업로더의 법률 자문을 대신하지 않으며, 업로더는 필요한 경우 미국 법률 자문을 직접 받아야 합니다.',
            },
          },
          requests: {
            title: '6. 문의 및 조치',
            p1: '본 서비스는 적용 법률, <terms>이용약관</terms>, <dmca>저작권/DMCA 절차</dmca>, 및 내부 정책에 따라 필요 시 콘텐츠 삭제, 접근 제한, 추가 정보 요청 또는 계정 조치를 할 수 있습니다.',
            p2: '2257 또는 2257A 관련 문의는 대상 URL, 작품 제목, 업로더 식별 정보, 문제되는 사유를 포함하여 아래 이메일로 보내주시기 바랍니다.',
          },
          changes: {
            title: '7. 변경',
            p1: '본 안내는 법령 해석, 서비스 운영 구조, 제출 정책 또는 실무 절차의 변경에 따라 수정될 수 있습니다.',
          },
        },
      },
      privacy: {
        title: '개인정보 처리방침',
        subtitle: '어떤 정보를 어떤 목적으로 처리하는지 안내합니다.',
        sections: {
          collect: {
            title: '1. 수집·처리하는 정보',
            intro: '서비스 제공을 위해 아래 정보를 수집·생성·처리할 수 있습니다.',
            items: {
              account: '<label>계정 정보</label>: 내부 사용자 ID, 로그인 ID, 닉네임, 프로필 이미지 URL, 성인 여부 등',
              serviceUsage:
                '<label>서비스 이용 정보</label>: 북마크/내 서재/감상 기록/평가 등 이용자가 서비스에서 생성·저장한 데이터',
              logDevice:
                '<label>로그/기기 정보</label>: 보안 처리에 필요한 접속 IP 주소, 브라우저/기기 요약 정보(예: Chrome macOS 데스크톱), 페이지 뷰 등',
              performance:
                '<label>성능/통계 정보</label>: Google Analytics 및 Web Vitals을 통해 수집되는 이용/성능 지표, Amplitude 이벤트',
              advertising:
                '<label>광고 관련 정보</label>: 광고 식별자, 광고 클릭 시각, 포인트 적립·사용 내역, 남용 방지를 위한 검증/제한 상태',
            },
            excludedIntro: '다음 항목은 서비스 이용 과정에서 수집하지 않습니다.',
            excludedItems: {
              directIdentifiers: '실명, 이메일 주소, 연락처, 거주지, 국적 등 개인을 식별할 수 있는 정보',
            },
            sessionNote:
              '로그인 유지 세션에는 전체 IP 주소나 전체 user-agent 문자열을 저장하지 않고, 기기 구분에 필요한 최소한의 요약 정보만 보관합니다.',
            dmcaNote:
              '단, <dmca>저작권/DMCA 신고 및 이의제기</dmca>를 제출하는 경우에는 처리에 필요한 범위에서 제출하신 정보(이름, 이메일, 연락처, 주소 등)가 수집·보관될 수 있습니다.',
          },
          purpose: {
            title: '2. 이용 목적',
            items: {
              account: '계정 관리 및 서비스 제공(로그인 유지, 북마크/내역 동기화 등)',
              analytics: '서비스 품질 개선 및 통계 분석(이용 패턴/성능 지표 분석)',
              security: '자동화 트래픽 보안 및 포인트 부정 이용 방지',
              ads: '광고 제공 및 포인트 적립/정산 처리',
              legal: '법령 준수 및 분쟁 대응',
            },
          },
          retention: {
            title: '3. 보유 및 파기',
            p1: '개인정보는 목적 달성에 필요한 기간 동안 보관하고, 목적 달성 후에는 관련 법령 및 내부 정책에 따라 지체 없이 파기합니다. 다만, 분쟁 대응, 부정 이용 방지, 법적 의무 준수를 위해 필요한 범위에서 일정 기간 보관될 수 있습니다.',
            p2: '로그인 유지 세션에 연결된 기기 요약 정보는 세션이 만료되거나 로그아웃 처리되면 함께 삭제됩니다.',
          },
          thirdparty: {
            title: '4. 외부 서비스 이용(제3자 제공/위탁)',
            p1: '본 서비스는 안정적인 제공을 위해 외부 서비스를 이용할 수 있습니다. 외부 서비스는 각 사업자의 정책에 따라 데이터를 처리할 수 있습니다.',
            p2: '아래의 경우에도 대한민국 법관으로부터 적법한 절차에 따라 압수·수색 영장이 발부되기 전까진 어느 주체에게도 제공하지 않습니다.',
            items: {
              legalRequest: '법령에 의거하거나 수사 목적으로 관계 기관의 요청이 있는 경우',
              investigationRequest: '수사 기관에서 임의제출 요청이 있는 경우',
              userDispute: '이용자 간의 고소·고발로 인한 경우',
            },
          },
          cookies: {
            title: '5. 쿠키 및 유사 기술',
            p1: '본 서비스는 로그인 유지, 보안, 통계를 위해 쿠키 및 유사 기술을 사용할 수 있습니다. 쿠키 저장을 원하지 않는 경우 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인, 포인트 적립 등 일부 기능이 제한될 수 있습니다.',
          },
          rights: {
            title: '6. 이용자의 권리',
            p1: '이용자는 관련 법령에 따라 개인정보 열람, 정정·삭제, 처리 정지 등을 요청할 수 있습니다. 아래 문의처로 연락하시기 바랍니다.',
          },
          contact: {
            title: '7. 문의',
            label: '개인정보 관련 문의:',
          },
          changes: {
            title: '8. 변경',
            p1: '본 개인정보 처리방침은 관련 법령, 정책 및 내부 운영 방침에 따라 변경될 수 있습니다.',
          },
        },
      },
      terms: {
        title: '이용약관',
        subtitle: '리토미 서비스 이용에 관한 약관입니다.',
        sections: {
          purpose: {
            title: '제 1 조 (목적)',
            p1: '이 약관은 본 서비스 이용과 관련해 이용자의 권리·의무 및 책임 사항, 기타 필요한 사항을 정리하는 것을 목적으로 합니다.',
          },
          definitions: {
            title: '제 2 조 (용어의 정의)',
            items: {
              user: '<term>"이용자"</term>는 본 약관에 따라 본 서비스를 이용하는 개인 또는 단체를 말합니다.',
              service: '<term>"서비스"</term>는 litomi.cc 도메인에서 제공되는 온라인 서비스 및 부가 기능을 말합니다.',
              advertising:
                '<term>"광고"</term>는 본 서비스에 노출되는 광고 및 광고 관련 UI(스크립트, 배너, 네이티브 광고 등)를 말합니다.',
              libo: '<term>"리보"</term>는 본 서비스 내에서 적립·사용할 수 있는 포인트를 말합니다. 리보는 현금으로 환전되거나 제3자에게 양도될 수 없으며, 적립·사용 기준 및 한도는 서비스 내 안내에 따르고 운영상 변경될 수 있습니다.',
            },
          },
          service: {
            title: '제 3 조 (서비스 제공 및 변경)',
            items: {
              purpose:
                '본 서비스는 이용자가 다양한 만화 작품을 보다 안전하고 편리하게 열람할 수 있도록 돕는 것을 목표로 합니다.',
              changes:
                '운영 및 기술 환경에 따라 서비스의 전부 또는 일부 기능이 추가·변경·중단될 수 있습니다. 특히 광고 운영 방식, 리보 적립·사용 정책은 부정 이용 방지 및 운영 사정에 따라 변경될 수 있습니다.',
            },
          },
          ads: {
            title: '제 4 조 (광고 및 외부 링크)',
            items: {
              display:
                '본 서비스는 운영을 위해 광고를 게재할 수 있습니다. 광고는 제3자(광고 네트워크/광고주)가 제공할 수 있으며 성인인증을 완료한 사용자에겐 노출하지 않습니다.',
              networks:
                '본 서비스는 광고 제공을 위해 Adsterra 등 제3자 광고 네트워크의 스크립트/태그를 사용할 수 있습니다. 제3자 광고 네트워크는 자체 정책에 따라 쿠키 또는 유사 기술을 사용할 수 있습니다.',
              externalSites:
                '광고를 클릭하면 외부 사이트가 새 창/새 탭에서 열릴 수 있습니다. 외부 사이트의 콘텐츠·상품·서비스·개인정보 처리·거래 등에 대한 책임은 해당 사이트에 있습니다.',
              riskReduction:
                '본 서비스는 불법 도박, 피싱, 스캠, 악성코드 유도 등 이용자에게 피해를 줄 수 있는 광고의 노출을 줄이기 위해 노력하나, 제3자 제공 특성상 모든 광고를 사전에 통제하거나 보증할 수는 없습니다.',
              koreaVerification:
                '대한민국에서 접속한 이용자는 관련 법령 준수를 위해 일부 기능 이용에 성인인증이 필요할 수 있습니다.',
            },
          },
          libo: {
            title: '제 5 조 (포인트)',
            p1: '리보는 본 서비스 내 기능(예: 내 공간 확장 등)을 위해 제공되는 포인트입니다. 리보는 현금으로 환전되거나 외부 결제에 사용될 수 없으며, 제3자에게 양도·대여·담보 제공될 수 없습니다.',
            items: {
              earn: '<label>적립</label>: 리보는 이용자가 자발적으로 보상형 광고를 이용하는 경우 적립될 수 있습니다. 남용 방지를 위해 로그인, Cloudflare 보안 검증, 적립 횟수 제한, 대기 시간, 토큰 유효기간 등 정책이 적용될 수 있습니다.',
              blocking:
                '<label>차단/환경 영향</label>: 광고 차단 프로그램, 트래킹 차단 설정, 브라우저/네트워크 환경에 따라 광고가 정상 노출되지 않거나 리보 적립이 제한될 수 있습니다.',
              abuse:
                '<label>부정 이용</label>: 자동화된 클릭, 봇/스크립트 사용, 다중 계정, 취약점 악용 등 부정 이용이 의심되는 경우, 적립된 리보를 취소하거나 이용 제한(기능 제한/계정 제한 등)이 적용될 수 있습니다.',
              correction:
                '<label>정정</label>: 시스템 오류, 중복 적립, 비정상 트래픽 등으로 리보가 잘못 적립·차감된 경우, 본 서비스는 기록을 기준으로 합리적인 범위에서 이를 정정할 수 있습니다.',
            },
            note: '리보의 적립·사용 기준 및 한도는 서비스 내 안내에 따르며, 운영상 변경될 수 있습니다.',
          },
          browsers: {
            title: '제 6 조 (지원하는 브라우저)',
            p1: '본 서비스는 최신 버전의 웹 브라우저에서 최적화되어 있으며, 구형 브라우저에서는 일부 기능이 제한될 수 있습니다. 공식적으로 다음 버전 이상에서 지원합니다.',
          },
          dmca: {
            title: '제 7 조 (저작권 침해 신고 및 처리)',
            p1: '본 서비스는 저작권 침해 신고를 접수하고 처리하기 위한 절차를 운영합니다. 권리자 또는 적법한 대리인은 <dmca>저작권/DMCA 신고 페이지</dmca>를 통해 통지를 제출할 수 있으며, 유효한 통지가 접수되면 해당 콘텐츠에 대한 접근이 제한될 수 있습니다. 라이선스 또는 권한이 있다고 주장하는 경우에도 동일 페이지에서 이의제기(카운터 노티스)를 제출할 수 있습니다.',
          },
          liability: {
            title: '제 8 조 (면책 및 책임의 제한)',
            items: {
              thirdPartyDamage:
                '본 서비스는 법령상 허용되는 범위 내에서, 제3자가 제공하는 광고·외부 링크·외부 사이트 이용으로 인해 발생하는 손해에 대해 책임을 제한할 수 있습니다. 단, 본 서비스의 고의 또는 중대한 과실로 인한 경우에는 그러하지 아니합니다.',
              adNetworkAvailability:
                '제3자 광고 네트워크의 정책 변경, 네트워크 장애, 이용자 환경(브라우저 설정/차단 프로그램 등)으로 인해 광고가 노출되지 않거나 리보가 적립되지 않는 경우가 있을 수 있습니다.',
            },
          },
        },
      },
      youthProtection: {
        title: '청소년보호정책',
        subtitle:
          '리토미는 청소년이 유해한 정보로부터 보호받을 수 있도록 관련 법령과 서비스 운영 기준에 따라 정책을 수립하고 적용합니다.',
        sections: {
          purpose: {
            title: '1. 목적 및 적용 범위',
            p1: '본 정책은 리토미가 정보통신망을 통해 제공하는 정보와 이용자 상호작용 기능에 대하여, <law>청소년 보호법</law>, <law>정보통신망 이용촉진 및 정보보호 등에 관한 법률</law> 및 관련 법령의 취지에 따라 청소년 보호를 위한 기준과 절차를 안내하기 위해 마련되었습니다.',
            p2: '리토미는 만화 감상과 탐색을 위한 서비스를 제공하며, 청소년에게 부적절할 수 있는 정보의 노출을 줄이기 위해 접근 제한, 신고 처리, 운영 정책 반영 등의 조치를 적용할 수 있습니다.',
          },
          controls: {
            title: '2. 청소년 접근 제한 및 관리 조치',
            items: {
              entryNotice:
                '서비스 진입 화면에서 본 웹사이트가 <strong>19세 이상 성인</strong>을 대상으로 한다는 고지와 이용 제한 안내를 제공합니다.',
              bbaton:
                '로그인 사용자의 경우, 필요한 기능에 한하여 <strong>BBaton 기반 익명 성인인증</strong> 절차를 요구할 수 있습니다.',
              extraRestriction:
                '대한민국 법령, 내부 정책 또는 서비스 운영 판단에 따라 일부 기능이나 특정 이용 흐름에는 추가적인 <strong>성인인증 또는 접근 제한</strong>이 적용될 수 있습니다.',
              protectiveMeasures:
                '청소년에게 유해할 우려가 있는 정보는 공개 범위 조정, 노출 제한, 삭제, 계정 제한 등 합리적인 보호조치를 적용할 수 있습니다.',
            },
          },
          monitoring: {
            title: '3. 유해정보 모니터링 및 대응',
            p1: '리토미는 이용자 신고, 권리자 통지, 운영 검토, 법령상 요청 등을 바탕으로 청소년 유해정보 또는 위법 정보 여부를 확인할 수 있습니다.',
            p2: '검토 결과 청소년 보호 또는 법령 준수를 위해 필요하다고 판단되는 경우, 해당 정보에 대해 노출 제한, 삭제, 임시조치, 접근 차단, 계정 제재, 추가 자료 요청 등의 조치를 할 수 있습니다.',
            p3: '특히 아동·청소년 대상 성착취물, 불법촬영물, 강요된 성적 이미지, 명백한 위법정보 등 중대한 사안은 서비스 내 일반 신고 절차보다 우선하여 신속히 제한 또는 삭제 조치를 검토합니다.',
          },
          process: {
            title: '4. 운영 절차 및 내부 관리',
            items: {
              reviewStandards:
                '운영팀은 청소년 보호 관련 법령, 신고 유형, 접근 제한 기준을 검토하고 서비스 운영 기준에 반영합니다.',
              prioritizeReports:
                '청소년 보호와 관련된 문의 또는 신고가 접수되면 사안의 성격에 따라 우선순위를 나누어 확인합니다.',
              reviewEvidence:
                '필요한 경우 관련 화면, 게시물, 작품 정보, 신고 내용, 처리 기록 등을 확인하여 후속 조치를 결정합니다.',
              updatePolicy: '정책, 법령, 서비스 구조가 바뀌면 청소년 보호 절차와 안내 문구를 함께 업데이트합니다.',
            },
          },
          complaint: {
            title: '5. 피해상담 및 고충처리',
            p1: '청소년 유해정보 노출, 접근 제한 미비, 불법·유해 콘텐츠 유통 등과 관련한 문의나 신고는 아래 이메일로 접수할 수 있습니다. 저작권 침해 신고는 <dmca>저작권/DMCA 신고 페이지</dmca>를 이용해 주세요. 그 밖의 일반 문의는 아래 청소년보호 책임자 및 담당자 연락처로 보내주시면 확인 후 처리합니다.',
          },
          officer: {
            title: '6. 청소년보호 책임자 및 담당자',
            departmentLabel: '부서',
            departmentValue: '리토미 운영팀',
            roleLabel: '직위',
            roleValue: '운영자',
          },
          changes: {
            title: '7. 변경',
            p1: '본 정책은 관련 법령, 서비스 구조, 신고 처리 절차 및 내부 운영 기준의 변경에 따라 수정될 수 있습니다.',
          },
        },
      },
      dmca: {
        notice: {
          page: {
            backHome: '← 돌아가기',
            title: '저작권/DMCA 신고',
            subtitle: '권리자(또는 대리인) 통지 전용 폼이에요.',
            languageLabel: '언어',
            noticeHeading: '권리자 통지',
            fallbackHeading: '이 폼이 어려우신가요?',
            fallbackBody: '아래 메일로 보내 주셔도 돼요:',
            agentHeading: 'DMCA 지정 대리인 정보',
            agentBody:
              'Service Provider: {agentName} · Registration No: {registrationNumber} · Last Updated: {lastUpdated}',
            slaBody: '접수된 통지는 보통 3일 이내에 처리하는 걸 목표로 해요.',
            counterLink: '라이선스가 있다고 주장하고 싶다면(이의제기) →',
            formHint:
              '정확한 처리를 위해 가능한 한 구체적으로 작성해 주세요. 허위 신고는 법적 책임이 발생할 수 있어요.',
            errors: {
              invalid: '입력값을 다시 확인해 주세요.',
              noTarget: '작품 URL 또는 작품 ID를 최소 1개 이상 적어 주세요.',
              server: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
            },
          },
          form: {
            mailSubject: 'DMCA 신고',
            copySuccess: '복사됐어요. 메일에 붙여넣어 보내 주세요.',
            copyError: '복사하지 못했어요. 직접 복사해 주세요.',
            copyTemplate: '템플릿 복사',
            openEmailApp: '메일 앱 열기',
            emailTemplate: '메일 템플릿',
            empty: '(비어 있음)',
            optional: '(선택)',
            noticeHeading: '권리자 통지',
            reporterSection: '신고자 정보',
            reporterName: '이름',
            reporterEmail: '이메일',
            reporterAddress: '주소',
            reporterPhone: '전화번호',
            reporterRole: '권한',
            reporterRoleOwner: '저작권자',
            reporterRoleAgent: '대리인',
            workSection: '저작물 식별',
            workDescription: '저작물 설명',
            workURL: '저작물 URL (선택)',
            infringingSection: '침해물 식별',
            infringingReferences: '리토미 작품 URL 또는 작품 ID',
            infringingPlaceholder: '예) https://litomi.cc/manga/123\n123\nhttps://litomi.cc/manga/456',
            infringingHelp:
              '작품 URL에 /manga/숫자 가 포함돼 있으면 자동으로 인식해요. 여러 개면 줄바꿈으로 적어 주세요.',
            statementsSection: '진술',
            goodFaith: '선의로 침해라고 믿고 이 통지를 제출해요.',
            perjury: '위증 시 처벌을 받을 수 있음을 이해하고, 권리자 또는 적법한 대리인임을 진술해요.',
            signature: '전자서명(성명)',
            submit: '제출',
          },
          success: {
            title: '접수됐어요',
            body: '신고가 접수됐어요. 필요하면 {dmcaEmail}로 접수 번호와 함께 연락해 주세요.',
            caseLabel: '접수 번호',
            back: 'DMCA 페이지로 돌아가기',
          },
        },
        counter: {
          page: {
            title: '이의제기',
            subtitle: '라이선스/권한이 있다고 주장하는 경우 제출해 주세요.',
            languageLabel: '언어',
            backToNotice: '저작권/DMCA 신고로 돌아가기 →',
            hint: '처리 중 추가 정보가 필요하면 {dmcaEmail} 메일에서 연락드릴 수 있어요.',
            errors: {
              invalid: '입력값을 다시 확인해 주세요.',
              noTarget: '작품 URL 또는 작품 ID를 최소 1개 이상 적어 주세요.',
              server: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
            },
          },
          form: {
            mailSubject: 'DMCA 이의제기(카운터 노티스)',
            copySuccess: '복사됐어요. 메일에 붙여넣어 보내 주세요.',
            copyError: '복사하지 못했어요. 직접 복사해 주세요.',
            copyTemplate: '템플릿 복사',
            openEmailApp: '메일 앱 열기',
            emailTemplate: '메일 템플릿',
            empty: '(비어 있음)',
            optional: '(선택)',
            title: '이의제기',
            claimantSection: '제출자 정보',
            claimantName: '이름',
            claimantEmail: '이메일',
            claimantAddress: '주소',
            claimantPhone: '전화번호',
            relatedSection: '관련 정보',
            relatedNoticeId: '관련 접수 번호 (선택)',
            infringingReferences: '리토미 작품 URL 또는 작품 ID',
            infringingHelp:
              '작품 URL에 /manga/숫자 가 포함돼 있으면 자동으로 인식해요. 여러 개면 줄바꿈으로 적어 주세요.',
            claimSection: '주장 내용',
            claimDetails: '라이선스/권한 근거',
            evidenceLinks: '증빙 링크 (선택)',
            statementsSection: '진술',
            goodFaith: '선의로 이의제기를 제출해요.',
            perjury: '위증 시 처벌을 받을 수 있음을 이해하고, 제출한 정보가 정확하다고 진술해요.',
            signature: '전자서명(성명)',
            submit: '제출',
          },
          success: {
            title: '이의제기가 접수됐어요',
            body: '이의제기가 접수됐어요. 필요하면 {dmcaEmail}로 접수 번호와 함께 연락해 주세요.',
            caseLabel: '접수 번호',
            back: '이의제기 페이지로 돌아가기',
          },
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      doc: {
        compliance2257: {
          title: '2257 Compliance Notice',
          description: "Learn about Litomi's operating principles for 18 U.S.C. §2257 and §2257A.",
        },
        dmca: {
          title: 'Copyright/DMCA Reports',
          description: 'Learn how to submit a copyright or DMCA report to Litomi.',
        },
        privacy: {
          title: 'Privacy Policy',
          description: 'Learn what information Litomi processes and why.',
        },
        terms: {
          title: 'Terms of Service',
          description: 'Read the terms that apply to using Litomi.',
        },
        youthProtection: {
          title: 'Youth Protection Policy',
          description: 'Learn about the policy Litomi applies to help protect minors from harmful information.',
        },
      },
    },
    Doc: {
      common: {
        back: 'Back',
        toc: 'Table of contents',
        tocAria: 'Table of contents',
        contactLabel: 'Contact:',
        emailLabel: 'Email',
        effectiveDate: 'Effective date {date}',
      },
      compliance2257: {
        title: '18 U.S.C. §2257 / §2257A Compliance Notice',
        subtitle:
          'This page explains the service hosting structure and operating principles related to 18 U.S.C. §2257, §2257A, and 28 C.F.R. Part 75.',
        notice: {
          p1: 'This notice is a general service-level notice. If an uploader or original creator provides a separate work-specific record-keeping statement, that work-specific notice controls for that work.',
          p2: 'The service does not guarantee individual notices provided by third-party uploaders, whether record-keeping obligations apply, or the legality of any specific work.',
        },
        sections: {
          scope: {
            title: '1. Scope',
            p1: '<law>18 U.S.C. §2257</law>, <law>18 U.S.C. §2257A</law>, and <law>28 C.F.R. Part 75</law> generally address age verification, record-keeping, and labeling obligations for certain visual depictions involving real human beings.',
            p2: 'The service is an online platform that hosts works uploaded by users. This page explains the service’s general operating model and baseline position based on the types of works posted on the service.',
          },
          platformRole: {
            title: '2. Platform Role',
            p1: 'The service operates as a platform that stores, transmits, displays, searches, and indexes user-submitted material. The service does not recruit performers, hire performers, direct filming, or participate in production for works uploaded by third parties.',
            p2: 'Accordingly, in the ordinary course of operations, the service is not the original producer or performer-management entity for third-party submitted content, and mere hosting does not designate the service as the custodian of records for third-party works.',
          },
          nonRealPerson: {
            title: '3. Works Without Real People',
            p1: 'Most works posted on the service are creative or non-photographic depictions such as webtoons, manga, doujinshi, and illustrations that do not depict real human beings.',
            p2: 'These works are generally outside the ordinary scope of 18 U.S.C. §2257, §2257A, and 28 C.F.R. Part 75, which are premised on record-keeping for visual depictions of real human beings.',
          },
          realPerson: {
            title: '4. Exceptional Content Featuring Real People',
            p1: 'Exceptionally, third-party uploaded content featuring real adults may be posted. The service does not allow uploads of real-person content featuring minors.',
            p2: 'If an uploader or original content provider submits material featuring real human beings, that submitter must confirm that every depicted person was at least 18 years old at the time of production and, where applicable law applies, must independently determine and comply with required record-keeping and notice obligations.',
            p3: 'If an uploader provides a separate 2257 or 2257A notice for an individual work, that notice is treated as the uploader-provided work-specific notice for that work.',
          },
          uploaderObligations: {
            title: '5. Uploader Responsibilities',
            items: {
              verifyRecords:
                'When uploading material featuring real human beings, uploaders must independently verify whether legal record-keeping obligations apply to that material.',
              maintainRecords:
                'Where applicable, uploaders or original content providers must directly maintain age verification, records, work-specific identifying information, and any required notice language.',
              noMinors:
                'Uploaders must not upload real-person material featuring minors and must not provide false or incomplete compliance information.',
              legalAdvice:
                'The service does not replace legal advice for individual uploaders. Uploaders should obtain U.S. legal advice directly when needed.',
            },
          },
          requests: {
            title: '6. Requests and Actions',
            p1: 'The service may remove content, restrict access, request additional information, or take account action as needed under applicable law, the <terms>Terms of Service</terms>, the <dmca>Copyright/DMCA process</dmca>, and internal policies.',
            p2: 'For 2257 or 2257A-related inquiries, please email us with the target URL, work title, uploader identification information, and the reason for concern.',
          },
          changes: {
            title: '7. Changes',
            p1: 'This notice may be revised as legal interpretations, service operating structure, submission policies, or practical procedures change.',
          },
        },
      },
      privacy: {
        title: 'Privacy Policy',
        subtitle: 'Learn what information is processed and for what purposes.',
        sections: {
          collect: {
            title: '1. Information Collected and Processed',
            intro: 'The service may collect, generate, and process the following information to provide the service.',
            items: {
              account:
                '<label>Account information</label>: internal user ID, login ID, nickname, profile image URL, adult status, and similar data',
              serviceUsage:
                '<label>Service usage information</label>: bookmarks, libraries, reading history, ratings, and other data users create or store in the service',
              logDevice:
                '<label>Log/device information</label>: access IP address needed for security processing, browser/device summary information such as Chrome on macOS desktop, page views, and similar data',
              performance:
                '<label>Performance/statistics information</label>: usage and performance metrics collected through Google Analytics and Web Vitals, and Amplitude events',
              advertising:
                '<label>Advertising-related information</label>: advertising identifiers, ad click time, point earning and spending history, and verification/restriction status for abuse prevention',
            },
            excludedIntro: 'The following items are not collected during service use.',
            excludedItems: {
              directIdentifiers:
                'Information that directly identifies a person, such as real name, email address, contact information, residence, or nationality',
            },
            sessionNote:
              'Persistent login sessions do not store full IP addresses or full user-agent strings; only the minimum summary information needed to distinguish devices is retained.',
            dmcaNote:
              'However, if you submit a <dmca>Copyright/DMCA report or counter notice</dmca>, information you provide such as name, email, contact details, and address may be collected and retained to the extent needed for processing.',
          },
          purpose: {
            title: '2. Purposes of Use',
            items: {
              account:
                'Account management and service provision, including persistent login and bookmark/history synchronization',
              analytics:
                'Service quality improvement and statistical analysis, including usage pattern and performance metric analysis',
              security: 'Automated traffic security and prevention of point abuse',
              ads: 'Advertising delivery and point earning/settlement processing',
              legal: 'Legal compliance and dispute handling',
            },
          },
          retention: {
            title: '3. Retention and Deletion',
            p1: 'Personal information is retained for the period necessary to achieve its purpose and deleted without undue delay after the purpose is achieved, in accordance with applicable laws and internal policies. However, it may be retained for a certain period to the extent necessary for dispute handling, abuse prevention, or legal compliance.',
            p2: 'Device summary information linked to a persistent login session is deleted when the session expires or is logged out.',
          },
          thirdparty: {
            title: '4. Use of External Services / Third-Party Provision or Entrustment',
            p1: 'The service may use external services to provide stable operations. External services may process data under their own policies.',
            p2: 'Even in the following cases, the service does not provide information to any party until a Korean judge issues a search and seizure warrant through lawful procedure.',
            items: {
              legalRequest: 'When a request is made by a relevant authority under law or for investigative purposes',
              investigationRequest: 'When an investigative authority requests voluntary submission',
              userDispute: 'When a complaint or accusation arises between users',
            },
          },
          cookies: {
            title: '5. Cookies and Similar Technologies',
            p1: 'The service may use cookies and similar technologies for persistent login, security, and statistics. If you do not want cookies stored, you can reject cookies in your browser settings, but some features such as login and point earning may be limited.',
          },
          rights: {
            title: '6. User Rights',
            p1: 'Users may request access, correction, deletion, suspension of processing, and similar actions under applicable laws. Please contact us at the address below.',
          },
          contact: {
            title: '7. Contact',
            label: 'Privacy inquiries:',
          },
          changes: {
            title: '8. Changes',
            p1: 'This Privacy Policy may be changed in accordance with applicable laws, policies, and internal operating policies.',
          },
        },
      },
      terms: {
        title: 'Terms of Service',
        subtitle: 'Terms that apply to using the Litomi service.',
        sections: {
          purpose: {
            title: 'Article 1. Purpose',
            p1: 'These terms set out user rights, obligations, responsibilities, and other necessary matters related to using the service.',
          },
          definitions: {
            title: 'Article 2. Definitions',
            items: {
              user: '<term>"User"</term> means an individual or organization that uses the service under these terms.',
              service:
                '<term>"Service"</term> means the online service and related features provided through the litomi.cc domain.',
              advertising:
                '<term>"Advertising"</term> means advertisements and advertising-related UI shown in the service, including scripts, banners, and native ads.',
              libo: '<term>"Libo"</term> means points that can be earned and used within the service. Libo cannot be exchanged for cash or transferred to third parties, and earning/use standards and limits follow service notices and may change for operational reasons.',
            },
          },
          service: {
            title: 'Article 3. Service Provision and Changes',
            items: {
              purpose: 'The service aims to help users view a variety of manga works more safely and conveniently.',
              changes:
                'All or part of the service may be added, changed, or discontinued depending on operational and technical conditions. In particular, advertising operations and Libo earning/use policies may change for abuse prevention and operational reasons.',
            },
          },
          ads: {
            title: 'Article 4. Advertising and External Links',
            items: {
              display:
                'The service may display advertisements for operations. Advertisements may be provided by third parties such as ad networks or advertisers and are not shown to users who have completed adult verification.',
              networks:
                'The service may use scripts or tags from third-party advertising networks such as Adsterra to provide advertising. Third-party ad networks may use cookies or similar technologies under their own policies.',
              externalSites:
                'Clicking an advertisement may open an external site in a new window or tab. The external site is responsible for its content, products, services, privacy practices, transactions, and related matters.',
              riskReduction:
                'The service works to reduce exposure to ads that may harm users, such as illegal gambling, phishing, scams, or malware inducement, but due to third-party provision it cannot pre-screen, control, or guarantee every advertisement.',
              koreaVerification:
                'Users accessing from Korea may need adult verification for some features to comply with applicable laws.',
            },
          },
          libo: {
            title: 'Article 5. Points',
            p1: 'Libo is a point system provided for in-service features such as expanding personal space. Libo cannot be exchanged for cash, used for external payments, transferred, lent, or pledged to third parties.',
            items: {
              earn: '<label>Earning</label>: Libo may be earned when users voluntarily use rewarded ads. To prevent abuse, policies such as login, Cloudflare security verification, earning count limits, waiting periods, and token validity periods may apply.',
              blocking:
                '<label>Blocking/environment impact</label>: Ad blockers, tracking prevention settings, browser environment, or network environment may prevent ads from displaying properly or limit Libo earning.',
              abuse:
                '<label>Abuse</label>: If abusive use is suspected, including automated clicks, bots/scripts, multiple accounts, or vulnerability exploitation, earned Libo may be canceled or usage restrictions such as feature or account restrictions may apply.',
              correction:
                '<label>Correction</label>: If Libo is incorrectly earned or deducted due to system error, duplicate earning, abnormal traffic, or similar causes, the service may make reasonable corrections based on records.',
            },
            note: 'Libo earning/use standards and limits follow service notices and may change for operational reasons.',
          },
          browsers: {
            title: 'Article 6. Supported Browsers',
            p1: 'The service is optimized for modern web browsers, and some features may be limited in older browsers. The following versions or newer are officially supported.',
          },
          dmca: {
            title: 'Article 7. Copyright Infringement Reports and Handling',
            p1: 'The service operates a process for receiving and handling copyright infringement reports. Copyright owners or lawful agents may submit notices through the <dmca>Copyright/DMCA report page</dmca>, and access to the relevant content may be restricted when a valid notice is received. If you claim to have a license or authorization, you may submit a counter notice from the same page.',
          },
          liability: {
            title: 'Article 8. Disclaimers and Limitation of Liability',
            items: {
              thirdPartyDamage:
                'To the extent permitted by law, the service may limit liability for damages arising from third-party advertisements, external links, or external site use, except in cases of intentional misconduct or gross negligence by the service.',
              adNetworkAvailability:
                'Advertisements may fail to display or Libo may fail to accrue due to third-party ad network policy changes, network failures, or user environments such as browser settings or blocking tools.',
            },
          },
        },
      },
      youthProtection: {
        title: 'Youth Protection Policy',
        subtitle:
          'Litomi establishes and applies this policy under applicable laws and service operating standards so that minors can be protected from harmful information.',
        sections: {
          purpose: {
            title: '1. Purpose and Scope',
            p1: 'This policy is provided to explain standards and procedures for youth protection, in light of the purpose of the <law>Youth Protection Act</law>, the <law>Act on Promotion of Information and Communications Network Utilization and Information Protection</law>, and related laws, with respect to information and user interaction features provided by Litomi through information and communications networks.',
            p2: 'Litomi provides a service for viewing and exploring manga and may apply measures such as access restrictions, report handling, and operating policy updates to reduce exposure to information that may be inappropriate for minors.',
          },
          controls: {
            title: '2. Minor Access Restrictions and Management Measures',
            items: {
              entryNotice:
                'The service entry screen provides notice and usage restriction guidance that this website is intended for <strong>adults 19 and older</strong>.',
              bbaton:
                'For logged-in users, the service may require <strong>BBaton-based anonymous adult verification</strong> for necessary features.',
              extraRestriction:
                'Additional <strong>adult verification or access restrictions</strong> may apply to some features or usage flows under Korean law, internal policies, or service operating judgment.',
              protectiveMeasures:
                'For information that may be harmful to minors, reasonable protective measures such as scope adjustments, exposure limits, deletion, or account restrictions may be applied.',
            },
          },
          monitoring: {
            title: '3. Harmful Information Monitoring and Response',
            p1: 'Litomi may review whether information is harmful to minors or unlawful based on user reports, rights-holder notices, operational review, or legal requests.',
            p2: 'If review indicates that action is necessary for youth protection or legal compliance, the service may limit exposure, delete content, take temporary measures, block access, restrict accounts, or request additional materials.',
            p3: 'Serious matters such as child or youth sexual exploitation material, illegal filming, coerced sexual images, or clearly unlawful information are reviewed for swift restriction or deletion ahead of ordinary in-service report procedures.',
          },
          process: {
            title: '4. Operating Procedures and Internal Management',
            items: {
              reviewStandards:
                'The operations team reviews youth protection-related laws, report types, and access restriction standards and reflects them in service operating standards.',
              prioritizeReports:
                'When an inquiry or report related to youth protection is received, the team prioritizes review according to the nature of the matter.',
              reviewEvidence:
                'When necessary, related screens, posts, work information, report details, and handling records are reviewed to determine follow-up action.',
              updatePolicy:
                'When policies, laws, or service structures change, youth protection procedures and guidance text are updated together.',
            },
          },
          complaint: {
            title: '5. Counseling and Complaint Handling',
            p1: 'Inquiries or reports related to exposure to harmful information for minors, insufficient access restrictions, or distribution of unlawful or harmful content may be submitted by email below. Copyright infringement reports should use the <dmca>Copyright/DMCA report page</dmca>. Other general inquiries can be sent to the youth protection officer/contact below for review and handling.',
          },
          officer: {
            title: '6. Youth Protection Officer and Contact',
            departmentLabel: 'Department',
            departmentValue: 'Litomi Operations Team',
            roleLabel: 'Role',
            roleValue: 'Operator',
          },
          changes: {
            title: '7. Changes',
            p1: 'This policy may be revised as applicable laws, service structure, report handling procedures, and internal operating standards change.',
          },
        },
      },
      dmca: {
        notice: {
          page: {
            backHome: 'Back',
            title: 'Copyright / DMCA Notice',
            subtitle: 'This form is for copyright owners (or authorized agents).',
            languageLabel: 'Language',
            noticeHeading: 'Copyright Notice (DMCA-style)',
            fallbackHeading: 'Can’t use this form?',
            fallbackBody: 'You can email us at:',
            agentHeading: 'Designated DMCA Agent',
            agentBody:
              'Service Provider: {agentName} · Registration No: {registrationNumber} · Last Updated: {lastUpdated}',
            slaBody: 'We aim to process valid notices within 3 days.',
            counterLink: 'If you want to submit a counter notice (license/authorization claim) →',
            formHint: 'Please be as specific as possible. Submitting false information may result in legal liability.',
            errors: {
              invalid: 'Please check your inputs and try again.',
              noTarget: 'Please provide at least one Litomi URL or Manga ID.',
              server: 'Something went wrong. Please try again later.',
            },
          },
          form: {
            mailSubject: 'DMCA Notice',
            copySuccess: 'Copied. Please paste it into your email.',
            copyError: 'Could not copy. Please copy manually.',
            copyTemplate: 'Copy template',
            openEmailApp: 'Open email app',
            emailTemplate: 'Email template',
            empty: '(empty)',
            optional: '(optional)',
            noticeHeading: 'Copyright Notice (DMCA-style)',
            reporterSection: 'Your information',
            reporterName: 'Full name',
            reporterEmail: 'Email',
            reporterAddress: 'Address',
            reporterPhone: 'Phone number',
            reporterRole: 'Role',
            reporterRoleOwner: 'Copyright owner',
            reporterRoleAgent: 'Authorized agent',
            workSection: 'Identify the copyrighted work',
            workDescription: 'Description',
            workURL: 'URL (optional)',
            infringingSection: 'Identify the infringing material on Litomi',
            infringingReferences: 'Litomi URLs or Manga IDs',
            infringingPlaceholder: 'e.g.\nhttps://litomi.cc/manga/123\n123\nhttps://litomi.cc/manga/456',
            infringingHelp:
              'If your URL contains /manga/123, it will be detected automatically. Use new lines for multiple items.',
            statementsSection: 'Statements',
            goodFaith:
              'I have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law.',
            perjury:
              'I swear, under penalty of perjury, that the information in this notice is accurate and that I am the owner or authorized to act on behalf of the owner.',
            signature: 'Electronic signature (typed full name)',
            submit: 'Submit',
          },
          success: {
            title: 'Submitted',
            body: 'Your notice has been received. If you need to follow up, contact {dmcaEmail} with the case ID below.',
            caseLabel: 'Case ID',
            back: 'Back to DMCA page',
          },
        },
        counter: {
          page: {
            title: 'Counter Notice',
            subtitle: 'If you believe you have a license/authorization, submit a counter notice here.',
            languageLabel: 'Language',
            backToNotice: 'Back to DMCA notice →',
            hint: 'If we need more information, we may contact you via email. You can also reach us at {dmcaEmail}.',
            errors: {
              invalid: 'Please check your inputs and try again.',
              noTarget: 'Please provide at least one Litomi URL or Manga ID.',
              server: 'Something went wrong. Please try again later.',
            },
          },
          form: {
            mailSubject: 'DMCA Counter Notice',
            copySuccess: 'Copied. Please paste it into your email.',
            copyError: 'Could not copy. Please copy manually.',
            copyTemplate: 'Copy template',
            openEmailApp: 'Open email app',
            emailTemplate: 'Email template',
            empty: '(empty)',
            optional: '(optional)',
            title: 'Counter Notice',
            claimantSection: 'Your information',
            claimantName: 'Full name',
            claimantEmail: 'Email',
            claimantAddress: 'Address',
            claimantPhone: 'Phone number',
            relatedSection: 'Related information',
            relatedNoticeId: 'Related case ID (optional)',
            infringingReferences: 'Litomi URLs or Manga IDs',
            infringingHelp:
              'If your URL contains /manga/123, it will be detected automatically. Use new lines for multiple items.',
            claimSection: 'Your claim',
            claimDetails: 'License/authorization basis',
            evidenceLinks: 'Evidence links (optional)',
            statementsSection: 'Statements',
            goodFaith: 'I submit this counter notice in good faith.',
            perjury: 'I swear, under penalty of perjury, that the information is accurate.',
            signature: 'Electronic signature (typed full name)',
            submit: 'Submit',
          },
          success: {
            title: 'Counter notice submitted',
            body: 'Your counter notice has been received. If you need to follow up, contact {dmcaEmail} with the case ID below.',
            caseLabel: 'Case ID',
            back: 'Back to counter notice page',
          },
        },
      },
    },
  },
  [Locale.JA]: {
    Metadata: {
      doc: {
        compliance2257: {
          title: '2257 コンプライアンス案内',
          description: 'リトミの 18 U.S.C. §2257 および §2257A に関する運営原則を案内します。',
        },
        dmca: {
          title: '著作権/DMCA 通報',
          description: 'リトミに著作権または DMCA 通報を提出する方法を案内します。',
        },
        privacy: {
          title: 'プライバシーポリシー',
          description: 'リトミがどの情報をどの目的で処理するかを案内します。',
        },
        terms: {
          title: '利用規約',
          description: 'リトミサービスの利用に適用される規約を案内します。',
        },
        youthProtection: {
          title: '青少年保護ポリシー',
          description: '青少年を有害な情報から保護するために適用するポリシーを案内します。',
        },
      },
    },
    Doc: {
      common: {
        back: '戻る',
        toc: '目次',
        tocAria: '目次',
        contactLabel: 'お問い合わせ:',
        emailLabel: 'メール',
        effectiveDate: '施行日 {date}',
      },
      compliance2257: {
        title: '18 U.S.C. §2257 / §2257A コンプライアンス案内',
        subtitle:
          'このページでは、サービスのホスティング構造と、18 U.S.C. §2257、§2257A および 28 C.F.R. Part 75 に関する運営原則を説明します。',
        notice: {
          p1: '本案内はサービスレベルの一般的な通知です。個別のアップローダーまたは原著作者が作品別の record-keeping statement を提供している場合、その作品については当該作品別通知が優先されます。',
          p2: '本サービスは、第三者アップローダーが提供する個別通知、記録保存義務の適用有無、または特定作品の適法性を保証しません。',
        },
        sections: {
          scope: {
            title: '1. 適用範囲',
            p1: '<law>18 U.S.C. §2257</law>、<law>18 U.S.C. §2257A</law>、および <law>28 C.F.R. Part 75</law> は、一般に、実在の人間が登場する特定の視覚的表現物に関する年齢確認、記録保存、ラベリング義務を扱います。',
            p2: '本サービスは、利用者がアップロードした作品をホスティングするオンラインプラットフォームです。このページは、サービスの一般的な運営方法と、本サービスに掲載される作品類型を基準にした基本的な立場を説明するものです。',
          },
          platformRole: {
            title: '2. プラットフォームの役割',
            p1: '本サービスは、利用者提出資料を保存、送信、表示、検索、インデックス化するプラットフォームとして運営されます。本サービスは、第三者がアップロードした作品について出演者を募集、雇用、撮影指示、または制作関与しません。',
            p2: 'したがって、通常の運営範囲において、本サービスは第三者提出コンテンツの原制作主体または出演者管理主体ではなく、単なるホスティングによって第三者作品の記録管理責任者 (custodian of records) に指定されるものではありません。',
          },
          nonRealPerson: {
            title: '3. 実在人物ではない作品',
            p1: '本サービスに掲載される作品の多くは、ウェブトゥーン、漫画、同人誌、イラストなど、実在の人間を描写しない創作物または非写真表現物です。',
            p2: 'これらの作品は、実在する人間の視覚的描写に関する記録保存制度を前提とする 18 U.S.C. §2257、§2257A および 28 C.F.R. Part 75 の一般的な適用対象ではありません。',
          },
          realPerson: {
            title: '4. 実在人物が登場する例外的コンテンツ',
            p1: '例外的に、実在する成人が登場する第三者アップロードコンテンツが掲載される場合があります。本サービスは、未成年者が登場する実在人物コンテンツのアップロードを許可しません。',
            p2: 'アップローダーまたは原コンテンツ提供者が実在の人間を含む資料を提出する場合、その提出者は、描写対象者全員が制作時点で18歳以上であったことを確認し、関連法が適用される場合には必要な記録保存および通知義務を自ら判断し履行する必要があります。',
            p3: '個別作品についてアップローダーが別途 2257 または 2257A 通知を提供する場合、その通知は当該作品に関するアップローダー提供の作品別通知として扱われます。',
          },
          uploaderObligations: {
            title: '5. アップローダーの責任',
            items: {
              verifyRecords:
                '実在の人間が登場する資料をアップロードする場合、アップローダーは当該資料に法律上の記録保存義務が適用されるかを自ら確認する必要があります。',
              maintainRecords:
                '適用される場合、アップローダーまたは原コンテンツ提供者は、年齢確認、記録保存、作品別識別情報および必要な通知文言を自ら維持する必要があります。',
              noMinors:
                'アップローダーは、未成年者が登場する実在人物資料をアップロードしてはならず、虚偽または不完全な遵守情報を提供してはなりません。',
              legalAdvice:
                '本サービスは個別アップローダーの法律相談に代わるものではなく、アップローダーは必要に応じて米国法に関する助言を直接受ける必要があります。',
            },
          },
          requests: {
            title: '6. お問い合わせおよび措置',
            p1: '本サービスは、適用法、<terms>利用規約</terms>、<dmca>著作権/DMCA 手続き</dmca>、および内部ポリシーに従い、必要に応じてコンテンツ削除、アクセス制限、追加情報の要請、またはアカウント措置を行うことがあります。',
            p2: '2257 または 2257A に関するお問い合わせは、対象 URL、作品タイトル、アップローダー識別情報、問題となる理由を含めて、下記メールアドレスまでお送りください。',
          },
          changes: {
            title: '7. 変更',
            p1: '本案内は、法令解釈、サービス運営構造、提出ポリシーまたは実務手続きの変更に応じて修正される場合があります。',
          },
        },
      },
      privacy: {
        title: 'プライバシーポリシー',
        subtitle: 'どの情報をどの目的で処理するかを案内します。',
        sections: {
          collect: {
            title: '1. 収集・処理する情報',
            intro: 'サービス提供のため、以下の情報を収集、生成、処理する場合があります。',
            items: {
              account:
                '<label>アカウント情報</label>: 内部ユーザー ID、ログイン ID、ニックネーム、プロフィール画像 URL、成人状態など',
              serviceUsage:
                '<label>サービス利用情報</label>: ブックマーク、ライブラリ、閲覧履歴、評価など、利用者がサービス内で作成・保存したデータ',
              logDevice:
                '<label>ログ/デバイス情報</label>: セキュリティ処理に必要なアクセス IP アドレス、Chrome macOS デスクトップなどのブラウザ/デバイス要約情報、ページビューなど',
              performance:
                '<label>性能/統計情報</label>: Google Analytics および Web Vitals を通じて収集される利用・性能指標、Amplitude イベント',
              advertising:
                '<label>広告関連情報</label>: 広告識別子、広告クリック時刻、ポイントの獲得・使用履歴、不正利用防止のための検証/制限状態',
            },
            excludedIntro: '次の項目は、サービス利用過程では収集しません。',
            excludedItems: {
              directIdentifiers: '実名、メールアドレス、連絡先、居住地、国籍など、個人を識別できる情報',
            },
            sessionNote:
              'ログイン維持セッションには、完全な IP アドレスや完全な user-agent 文字列を保存せず、デバイス識別に必要な最小限の要約情報のみを保管します。',
            dmcaNote:
              'ただし、<dmca>著作権/DMCA 通報および異議申し立て</dmca>を提出する場合、処理に必要な範囲で、氏名、メール、連絡先、住所など提出された情報が収集・保管されることがあります。',
          },
          purpose: {
            title: '2. 利用目的',
            items: {
              account: 'アカウント管理およびサービス提供 (ログイン維持、ブックマーク/履歴同期など)',
              analytics: 'サービス品質改善および統計分析 (利用パターン/性能指標分析)',
              security: '自動化トラフィックのセキュリティおよびポイント不正利用防止',
              ads: '広告提供およびポイント獲得/精算処理',
              legal: '法令遵守および紛争対応',
            },
          },
          retention: {
            title: '3. 保有および削除',
            p1: '個人情報は目的達成に必要な期間保管し、目的達成後は関連法令および内部ポリシーに従って遅滞なく削除します。ただし、紛争対応、不正利用防止、法的義務遵守のために必要な範囲で一定期間保管される場合があります。',
            p2: 'ログイン維持セッションに紐づくデバイス要約情報は、セッションが期限切れになるかログアウト処理されると、あわせて削除されます。',
          },
          thirdparty: {
            title: '4. 外部サービスの利用 (第三者提供/委託)',
            p1: '本サービスは安定した提供のため外部サービスを利用する場合があります。外部サービスは各事業者のポリシーに従ってデータを処理することがあります。',
            p2: '以下の場合であっても、韓国の裁判官から適法な手続きにより捜索・差押令状が発付されるまでは、いかなる主体にも提供しません。',
            items: {
              legalRequest: '法令に基づく場合、または捜査目的で関係機関から要請がある場合',
              investigationRequest: '捜査機関から任意提出要請がある場合',
              userDispute: '利用者間の告訴・告発に起因する場合',
            },
          },
          cookies: {
            title: '5. Cookie および類似技術',
            p1: '本サービスは、ログイン維持、セキュリティ、統計のために Cookie および類似技術を使用する場合があります。Cookie の保存を望まない場合はブラウザ設定で拒否できますが、その場合、ログインやポイント獲得など一部機能が制限されることがあります。',
          },
          rights: {
            title: '6. 利用者の権利',
            p1: '利用者は関連法令に基づき、個人情報の閲覧、訂正・削除、処理停止などを請求できます。下記お問い合わせ先までご連絡ください。',
          },
          contact: {
            title: '7. お問い合わせ',
            label: '個人情報に関するお問い合わせ:',
          },
          changes: {
            title: '8. 変更',
            p1: '本プライバシーポリシーは、関連法令、ポリシーおよび内部運営方針に従って変更される場合があります。',
          },
        },
      },
      terms: {
        title: '利用規約',
        subtitle: 'リトミサービスの利用に関する規約です。',
        sections: {
          purpose: {
            title: '第1条 (目的)',
            p1: '本規約は、本サービスの利用に関連して、利用者の権利・義務および責任事項、その他必要な事項を定めることを目的とします。',
          },
          definitions: {
            title: '第2条 (用語の定義)',
            items: {
              user: '<term>「利用者」</term>とは、本規約に従って本サービスを利用する個人または団体をいいます。',
              service:
                '<term>「サービス」</term>とは、litomi.cc ドメインで提供されるオンラインサービスおよび付加機能をいいます。',
              advertising:
                '<term>「広告」</term>とは、本サービスに表示される広告および広告関連 UI (スクリプト、バナー、ネイティブ広告など) をいいます。',
              libo: '<term>「リボ」</term>とは、本サービス内で獲得・使用できるポイントをいいます。リボは現金に換金されたり第三者に譲渡されたりすることはできず、獲得・使用基準および限度はサービス内の案内に従い、運営上変更される場合があります。',
            },
          },
          service: {
            title: '第3条 (サービス提供および変更)',
            items: {
              purpose:
                '本サービスは、利用者が多様な漫画作品をより安全かつ便利に閲覧できるよう支援することを目的とします。',
              changes:
                '運営および技術環境により、サービスの全部または一部の機能が追加、変更、中断される場合があります。特に広告運営方式、リボ獲得・使用ポリシーは、不正利用防止および運営上の事情により変更される場合があります。',
            },
          },
          ads: {
            title: '第4条 (広告および外部リンク)',
            items: {
              display:
                '本サービスは運営のため広告を掲載する場合があります。広告は第三者 (広告ネットワーク/広告主) が提供することがあり、成人確認を完了した利用者には表示しません。',
              networks:
                '本サービスは広告提供のため、Adsterra など第三者広告ネットワークのスクリプト/タグを使用する場合があります。第三者広告ネットワークは自社ポリシーに従って Cookie または類似技術を使用することがあります。',
              externalSites:
                '広告をクリックすると、外部サイトが新しいウィンドウ/タブで開く場合があります。外部サイトのコンテンツ、商品、サービス、個人情報処理、取引などに関する責任は当該サイトにあります。',
              riskReduction:
                '本サービスは、違法賭博、フィッシング、詐欺、マルウェア誘導など、利用者に被害を与える可能性のある広告の表示を減らすよう努めますが、第三者提供の性質上、すべての広告を事前に統制または保証することはできません。',
              koreaVerification:
                '韓国からアクセスする利用者は、関連法令遵守のため、一部機能の利用に成人確認が必要な場合があります。',
            },
          },
          libo: {
            title: '第5条 (ポイント)',
            p1: 'リボは、本サービス内の機能 (例: マイスペース拡張など) のために提供されるポイントです。リボは現金に換金されたり外部決済に使用されたりすることはできず、第三者への譲渡、貸与、担保提供はできません。',
            items: {
              earn: '<label>獲得</label>: リボは、利用者が自主的にリワード広告を利用する場合に獲得できることがあります。不正利用防止のため、ログイン、Cloudflare セキュリティ検証、獲得回数制限、待機時間、トークン有効期間などのポリシーが適用される場合があります。',
              blocking:
                '<label>ブロック/環境の影響</label>: 広告ブロッカー、トラッキング防止設定、ブラウザ/ネットワーク環境により、広告が正常に表示されなかったりリボ獲得が制限されたりする場合があります。',
              abuse:
                '<label>不正利用</label>: 自動クリック、ボット/スクリプト使用、複数アカウント、脆弱性悪用など不正利用が疑われる場合、獲得済みリボの取消または利用制限 (機能制限/アカウント制限など) が適用される場合があります。',
              correction:
                '<label>訂正</label>: システムエラー、重複獲得、異常トラフィックなどによりリボが誤って獲得・差し引かれた場合、本サービスは記録を基準として合理的な範囲で訂正することがあります。',
            },
            note: 'リボの獲得・使用基準および限度はサービス内の案内に従い、運営上変更される場合があります。',
          },
          browsers: {
            title: '第6条 (対応ブラウザ)',
            p1: '本サービスは最新バージョンの Web ブラウザに最適化されており、古いブラウザでは一部機能が制限される場合があります。公式には次のバージョン以上をサポートします。',
          },
          dmca: {
            title: '第7条 (著作権侵害通報および処理)',
            p1: '本サービスは、著作権侵害通報を受け付け処理するための手続きを運営します。権利者または正当な代理人は、<dmca>著作権/DMCA 通報ページ</dmca>を通じて通知を提出でき、有効な通知が受理されると該当コンテンツへのアクセスが制限される場合があります。ライセンスまたは権限があると主張する場合も、同じページで異議申し立て (カウンターノーティス) を提出できます。',
          },
          liability: {
            title: '第8条 (免責および責任の制限)',
            items: {
              thirdPartyDamage:
                '本サービスは、法令上許容される範囲内で、第三者が提供する広告、外部リンク、外部サイト利用により発生する損害について責任を制限することがあります。ただし、本サービスの故意または重過失による場合はこの限りではありません。',
              adNetworkAvailability:
                '第三者広告ネットワークのポリシー変更、ネットワーク障害、利用者環境 (ブラウザ設定/ブロックツールなど) により、広告が表示されなかったりリボが獲得されなかったりする場合があります。',
            },
          },
        },
      },
      youthProtection: {
        title: '青少年保護ポリシー',
        subtitle:
          'リトミは、青少年が有害な情報から保護されるよう、関連法令とサービス運営基準に基づきポリシーを策定し適用します。',
        sections: {
          purpose: {
            title: '1. 目的および適用範囲',
            p1: '本ポリシーは、リトミが情報通信ネットワークを通じて提供する情報および利用者相互作用機能について、<law>青少年保護法</law>、<law>情報通信ネットワーク利用促進および情報保護等に関する法律</law>および関連法令の趣旨に従い、青少年保護のための基準と手続きを案内するために設けられました。',
            p2: 'リトミは漫画の閲覧と探索のためのサービスを提供しており、青少年に不適切な情報の露出を減らすため、アクセス制限、通報処理、運営ポリシー反映などの措置を適用する場合があります。',
          },
          controls: {
            title: '2. 青少年アクセス制限および管理措置',
            items: {
              entryNotice:
                'サービス入口画面で、本ウェブサイトが <strong>19歳以上の成人</strong>を対象としていることの告知と利用制限案内を提供します。',
              bbaton:
                'ログイン利用者の場合、必要な機能に限り <strong>BBaton ベースの匿名成人確認</strong>手続きを求める場合があります。',
              extraRestriction:
                '韓国法令、内部ポリシーまたはサービス運営上の判断により、一部機能や特定の利用フローには追加の <strong>成人確認またはアクセス制限</strong>が適用される場合があります。',
              protectiveMeasures:
                '青少年に有害となるおそれのある情報には、公開範囲調整、露出制限、削除、アカウント制限など合理的な保護措置を適用する場合があります。',
            },
          },
          monitoring: {
            title: '3. 有害情報のモニタリングおよび対応',
            p1: 'リトミは、利用者通報、権利者通知、運営レビュー、法令上の要請などをもとに、青少年有害情報または違法情報に該当するかを確認する場合があります。',
            p2: 'レビューの結果、青少年保護または法令遵守のため必要と判断される場合、当該情報について露出制限、削除、暫定措置、アクセス遮断、アカウント制裁、追加資料要請などの措置を行う場合があります。',
            p3: '特に児童・青少年対象の性的搾取物、違法撮影物、強要された性的画像、明白な違法情報など重大な事案は、サービス内の一般通報手続きに優先して迅速な制限または削除措置を検討します。',
          },
          process: {
            title: '4. 運営手続きおよび内部管理',
            items: {
              reviewStandards:
                '運営チームは、青少年保護関連法令、通報類型、アクセス制限基準を検討し、サービス運営基準に反映します。',
              prioritizeReports:
                '青少年保護に関する問い合わせまたは通報を受け付けた場合、事案の性質に応じて優先順位を分けて確認します。',
              reviewEvidence:
                '必要に応じて関連画面、投稿、作品情報、通報内容、処理記録などを確認し、後続措置を決定します。',
              updatePolicy:
                'ポリシー、法令、サービス構造が変わる場合、青少年保護手続きと案内文言もあわせて更新します。',
            },
          },
          complaint: {
            title: '5. 被害相談および苦情処理',
            p1: '青少年有害情報の露出、アクセス制限の不備、違法・有害コンテンツ流通などに関する問い合わせや通報は、下記メールで受け付けます。著作権侵害通報は <dmca>著作権/DMCA 通報ページ</dmca>をご利用ください。その他の一般問い合わせは、下記の青少年保護責任者および担当者連絡先へお送りいただければ確認後に処理します。',
          },
          officer: {
            title: '6. 青少年保護責任者および担当者',
            departmentLabel: '部署',
            departmentValue: 'リトミ運営チーム',
            roleLabel: '役職',
            roleValue: '運営者',
          },
          changes: {
            title: '7. 変更',
            p1: '本ポリシーは、関連法令、サービス構造、通報処理手続きおよび内部運営基準の変更に応じて修正される場合があります。',
          },
        },
      },
      dmca: {
        notice: {
          page: {
            backHome: '戻る',
            title: '著作権/DMCA 通報',
            subtitle: '権利者 (または代理人) の通知専用フォームです。',
            languageLabel: '言語',
            noticeHeading: '権利者通知',
            fallbackHeading: 'このフォームが使いにくいですか？',
            fallbackBody: '以下のメールでも送信できます:',
            agentHeading: 'DMCA 指定代理人情報',
            agentBody:
              'Service Provider: {agentName} · Registration No: {registrationNumber} · Last Updated: {lastUpdated}',
            slaBody: '受け付けた通知は通常3日以内の処理を目指しています。',
            counterLink: 'ライセンスがあると主張したい場合 (異議申し立て) →',
            formHint:
              '正確な処理のため、できるだけ具体的に記入してください。虚偽の通報は法的責任を伴う場合があります。',
            errors: {
              invalid: '入力内容をもう一度確認してください。',
              noTarget: '作品 URL または作品 ID を少なくとも1つ入力してください。',
              server: '一時的なエラーが発生しました。しばらくしてからもう一度お試しください。',
            },
          },
          form: {
            mailSubject: 'DMCA 通報',
            copySuccess: 'コピーしました。メールに貼り付けて送信してください。',
            copyError: 'コピーできませんでした。手動でコピーしてください。',
            copyTemplate: 'テンプレートをコピー',
            openEmailApp: 'メールアプリを開く',
            emailTemplate: 'メールテンプレート',
            empty: '(空)',
            optional: '(任意)',
            noticeHeading: '権利者通知',
            reporterSection: '通報者情報',
            reporterName: '氏名',
            reporterEmail: 'メール',
            reporterAddress: '住所',
            reporterPhone: '電話番号',
            reporterRole: '権限',
            reporterRoleOwner: '著作権者',
            reporterRoleAgent: '代理人',
            workSection: '著作物の識別',
            workDescription: '著作物の説明',
            workURL: '著作物 URL (任意)',
            infringingSection: '侵害物の識別',
            infringingReferences: 'リトミ作品 URL または作品 ID',
            infringingPlaceholder: '例)\nhttps://litomi.cc/manga/123\n123\nhttps://litomi.cc/manga/456',
            infringingHelp:
              '作品 URL に /manga/数字 が含まれている場合は自動で認識します。複数ある場合は改行で入力してください。',
            statementsSection: '陳述',
            goodFaith: '侵害であると善意で信じ、この通知を提出します。',
            perjury: '偽証時に罰則を受ける可能性を理解し、権利者または正当な代理人であることを陳述します。',
            signature: '電子署名 (氏名)',
            submit: '提出',
          },
          success: {
            title: '受け付けました',
            body: '通報を受け付けました。必要な場合は受付番号と一緒に {dmcaEmail} へご連絡ください。',
            caseLabel: '受付番号',
            back: 'DMCA ページへ戻る',
          },
        },
        counter: {
          page: {
            title: '異議申し立て',
            subtitle: 'ライセンス/権限があると主張する場合に提出してください。',
            languageLabel: '言語',
            backToNotice: '著作権/DMCA 通報へ戻る →',
            hint: '処理中に追加情報が必要な場合、{dmcaEmail} から連絡することがあります。',
            errors: {
              invalid: '入力内容をもう一度確認してください。',
              noTarget: '作品 URL または作品 ID を少なくとも1つ入力してください。',
              server: '一時的なエラーが発生しました。しばらくしてからもう一度お試しください。',
            },
          },
          form: {
            mailSubject: 'DMCA 異議申し立て (カウンターノーティス)',
            copySuccess: 'コピーしました。メールに貼り付けて送信してください。',
            copyError: 'コピーできませんでした。手動でコピーしてください。',
            copyTemplate: 'テンプレートをコピー',
            openEmailApp: 'メールアプリを開く',
            emailTemplate: 'メールテンプレート',
            empty: '(空)',
            optional: '(任意)',
            title: '異議申し立て',
            claimantSection: '提出者情報',
            claimantName: '氏名',
            claimantEmail: 'メール',
            claimantAddress: '住所',
            claimantPhone: '電話番号',
            relatedSection: '関連情報',
            relatedNoticeId: '関連受付番号 (任意)',
            infringingReferences: 'リトミ作品 URL または作品 ID',
            infringingHelp:
              '作品 URL に /manga/数字 が含まれている場合は自動で認識します。複数ある場合は改行で入力してください。',
            claimSection: '主張内容',
            claimDetails: 'ライセンス/権限の根拠',
            evidenceLinks: '証拠リンク (任意)',
            statementsSection: '陳述',
            goodFaith: '善意で異議申し立てを提出します。',
            perjury: '偽証時に罰則を受ける可能性を理解し、提出した情報が正確であることを陳述します。',
            signature: '電子署名 (氏名)',
            submit: '提出',
          },
          success: {
            title: '異議申し立てを受け付けました',
            body: '異議申し立てを受け付けました。必要な場合は受付番号と一緒に {dmcaEmail} へご連絡ください。',
            caseLabel: '受付番号',
            back: '異議申し立てページへ戻る',
          },
        },
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      doc: {
        compliance2257: {
          title: '2257 合规说明',
          description: '说明莉托米关于 18 U.S.C. §2257 和 §2257A 的运营原则。',
        },
        dmca: {
          title: '版权/DMCA 举报',
          description: '说明如何向莉托米提交版权或 DMCA 举报。',
        },
        privacy: {
          title: '隐私政策',
          description: '说明莉托米会处理哪些信息以及处理目的。',
        },
        terms: {
          title: '使用条款',
          description: '说明适用于使用莉托米服务的条款。',
        },
        youthProtection: {
          title: '青少年保护政策',
          description: '说明为保护青少年免受有害信息影响而采用的政策。',
        },
      },
    },
    Doc: {
      common: {
        back: '返回',
        toc: '目录',
        tocAria: '目录',
        contactLabel: '联系方式：',
        emailLabel: '邮箱',
        effectiveDate: '生效日期 {date}',
      },
      compliance2257: {
        title: '18 U.S.C. §2257 / §2257A 合规说明',
        subtitle: '本页面说明服务的托管结构，以及与 18 U.S.C. §2257、§2257A 和 28 C.F.R. Part 75 相关的运营原则。',
        notice: {
          p1: '本说明是服务层面的通用告知。如果上传者或原始创作者为个别作品提供单独的 record-keeping statement，则该作品以其作品专属告知为准。',
          p2: '本服务不保证第三方上传者提供的个别告知、记录保存义务是否适用，或任何特定作品的合法性。',
        },
        sections: {
          scope: {
            title: '1. 适用范围',
            p1: '<law>18 U.S.C. §2257</law>、<law>18 U.S.C. §2257A</law> 以及 <law>28 C.F.R. Part 75</law> 通常涉及对包含真实人类的特定视觉表现物的年龄确认、记录保存和标识义务。',
            p2: '本服务是托管用户上传作品的在线平台。本页面旨在说明服务的一般运营方式，以及基于本服务发布作品类型的基本立场。',
          },
          platformRole: {
            title: '2. 平台角色',
            p1: '本服务作为平台运营，用于存储、传输、展示、搜索和索引用户提交的资料。本服务不会为第三方上传作品招募、雇用或管理表演者，也不会指示拍摄或参与制作。',
            p2: '因此，在通常运营范围内，本服务不是第三方提交内容的原始制作方或表演者管理主体，仅提供托管并不会使本服务成为第三方作品的记录保管人 (custodian of records)。',
          },
          nonRealPerson: {
            title: '3. 非真实人物作品',
            p1: '本服务发布的大多数作品是网络漫画、漫画、同人志、插画等不描绘真实人类的创作物或非摄影表现物。',
            p2: '这些作品通常不属于以真实人类视觉描绘的记录保存制度为前提的 18 U.S.C. §2257、§2257A 和 28 C.F.R. Part 75 的一般适用范围。',
          },
          realPerson: {
            title: '4. 含真实人物的例外内容',
            p1: '在例外情况下，可能会发布包含真实成年人的第三方上传内容。本服务不允许上传包含未成年人的真实人物内容。',
            p2: '如果上传者或原内容提供者提交包含真实人类的资料，该提交者必须确认所有被描绘对象在制作时均已年满 18 岁；在相关法律适用时，也必须自行判断并履行必要的记录保存和告知义务。',
            p3: '如果上传者为个别作品提供单独的 2257 或 2257A 告知，该告知将被视为上传者提供的该作品专属告知。',
          },
          uploaderObligations: {
            title: '5. 上传者责任',
            items: {
              verifyRecords: '上传包含真实人类的资料时，上传者必须自行确认该资料是否适用法律上的记录保存义务。',
              maintainRecords:
                '在适用的情况下，上传者或原内容提供者必须自行维护年龄确认、记录保存、作品专属识别信息以及必要的告知文本。',
              noMinors: '上传者不得上传包含未成年人的真实人物资料，也不得提供虚假或不完整的合规信息。',
              legalAdvice: '本服务不替代个别上传者的法律咨询。上传者如有需要，应自行取得美国法律意见。',
            },
          },
          requests: {
            title: '6. 咨询与处理措施',
            p1: '本服务可根据适用法律、<terms>使用条款</terms>、<dmca>版权/DMCA 程序</dmca>以及内部政策，在必要时删除内容、限制访问、请求补充信息或采取账号措施。',
            p2: '有关 2257 或 2257A 的咨询，请通过以下邮箱发送目标 URL、作品标题、上传者识别信息以及问题原因。',
          },
          changes: {
            title: '7. 变更',
            p1: '本说明可能会根据法律解释、服务运营结构、提交政策或实际处理程序的变化而修订。',
          },
        },
      },
      privacy: {
        title: '隐私政策',
        subtitle: '说明会处理哪些信息以及处理目的。',
        sections: {
          collect: {
            title: '1. 收集和处理的信息',
            intro: '为提供服务，可能会收集、生成和处理以下信息。',
            items: {
              account: '<label>账号信息</label>：内部用户 ID、登录 ID、昵称、头像 URL、成人状态等',
              serviceUsage: '<label>服务使用信息</label>：书签、我的书库、阅读记录、评分等用户在服务中创建或保存的数据',
              logDevice:
                '<label>日志/设备信息</label>：安全处理所需的访问 IP 地址、浏览器/设备摘要信息（例如 Chrome macOS 桌面端）、页面浏览等',
              performance:
                '<label>性能/统计信息</label>：通过 Google Analytics 和 Web Vitals 收集的使用/性能指标，以及 Amplitude 事件',
              advertising:
                '<label>广告相关信息</label>：广告标识符、广告点击时间、积分获取/使用记录，以及防滥用所需的验证/限制状态',
            },
            excludedIntro: '服务使用过程中不会收集以下项目。',
            excludedItems: {
              directIdentifiers: '真实姓名、邮箱地址、联系方式、居住地、国籍等可识别个人身份的信息',
            },
            sessionNote: '登录保持会话不会保存完整 IP 地址或完整 user-agent 字符串，只保留区分设备所需的最少摘要信息。',
            dmcaNote:
              '但是，如果提交 <dmca>版权/DMCA 举报或异议通知</dmca>，为处理所需，可能会收集并保存你提交的信息（姓名、邮箱、联系方式、地址等）。',
          },
          purpose: {
            title: '2. 使用目的',
            items: {
              account: '账号管理和服务提供，包括保持登录、同步书签/记录等',
              analytics: '提升服务质量和统计分析，包括使用模式/性能指标分析',
              security: '自动化流量安全和防止积分滥用',
              ads: '广告提供以及积分获取/结算处理',
              legal: '遵守法律和处理争议',
            },
          },
          retention: {
            title: '3. 保留与删除',
            p1: '个人信息会在达成目的所需期间内保存，并在目的达成后依照相关法律和内部政策及时删除。但是，为处理争议、防止滥用或履行法律义务所需的范围内，可能会保留一定期间。',
            p2: '与登录保持会话关联的设备摘要信息会在会话过期或注销处理时一并删除。',
          },
          thirdparty: {
            title: '4. 使用外部服务（第三方提供/委托）',
            p1: '本服务可能会使用外部服务以稳定提供服务。外部服务可能会根据各自运营者的政策处理数据。',
            p2: '即使属于以下情形，在韩国法官依合法程序签发扣押、搜查令之前，本服务也不会向任何主体提供信息。',
            items: {
              legalRequest: '根据法律或出于调查目的，有关机关提出请求时',
              investigationRequest: '调查机关请求自愿提交时',
              userDispute: '因用户之间的起诉、举报等争议产生时',
            },
          },
          cookies: {
            title: '5. Cookie 和类似技术',
            p1: '本服务可能会为保持登录、安全和统计目的使用 Cookie 及类似技术。如果不希望保存 Cookie，可以在浏览器设置中拒绝，但登录、积分获取等部分功能可能会受到限制。',
          },
          rights: {
            title: '6. 用户权利',
            p1: '用户可依相关法律请求查阅、更正、删除个人信息，或停止处理等。请通过下方联系方式联系我们。',
          },
          contact: {
            title: '7. 联系',
            label: '隐私相关咨询：',
          },
          changes: {
            title: '8. 变更',
            p1: '本隐私政策可能会根据相关法律、政策和内部运营方针进行变更。',
          },
        },
      },
      terms: {
        title: '使用条款',
        subtitle: '关于使用莉托米服务的条款。',
        sections: {
          purpose: {
            title: '第 1 条（目的）',
            p1: '本条款旨在规定与使用本服务有关的用户权利、义务、责任事项以及其他必要事项。',
          },
          definitions: {
            title: '第 2 条（术语定义）',
            items: {
              user: '<term>“用户”</term>是指根据本条款使用本服务的个人或组织。',
              service: '<term>“服务”</term>是指通过 litomi.cc 域名提供的在线服务及附加功能。',
              advertising: '<term>“广告”</term>是指本服务中展示的广告及广告相关 UI（脚本、横幅、原生广告等）。',
              libo: '<term>“利波”</term>是指可在本服务内获取和使用的积分。利波不能兑换现金或转让给第三方，获取/使用标准和限额以服务内说明为准，并可能因运营需要变更。',
            },
          },
          service: {
            title: '第 3 条（服务提供与变更）',
            items: {
              purpose: '本服务旨在帮助用户更安全、便利地浏览各种漫画作品。',
              changes:
                '根据运营和技术环境，服务的全部或部分功能可能会新增、变更或中止。尤其是广告运营方式、利波获取/使用政策，可能会因防止滥用和运营需要而变更。',
            },
          },
          ads: {
            title: '第 4 条（广告和外部链接）',
            items: {
              display:
                '本服务可能会为运营目的展示广告。广告可由第三方（广告网络/广告主）提供，并且不会向已完成成人认证的用户展示。',
              networks:
                '本服务可能会使用 Adsterra 等第三方广告网络的脚本/标签来提供广告。第三方广告网络可能会根据其自身政策使用 Cookie 或类似技术。',
              externalSites:
                '点击广告可能会在新窗口/新标签页中打开外部网站。外部网站的内容、商品、服务、个人信息处理、交易等责任由该网站承担。',
              riskReduction:
                '本服务会努力减少非法赌博、钓鱼、诈骗、诱导恶意软件等可能损害用户的广告展示，但由于第三方提供的性质，无法事先控制或保证所有广告。',
              koreaVerification: '从韩国访问的用户，为遵守相关法律，部分功能可能需要成人认证。',
            },
          },
          libo: {
            title: '第 5 条（积分）',
            p1: '利波是为本服务内功能（例如扩展个人空间等）提供的积分。利波不能兑换现金，不能用于外部支付，也不能转让、出借或设定担保给第三方。',
            items: {
              earn: '<label>获取</label>：用户自愿使用激励广告时，可能会获得利波。为防止滥用，可能适用登录、Cloudflare 安全验证、获取次数限制、等待时间、令牌有效期等政策。',
              blocking:
                '<label>拦截/环境影响</label>：广告拦截程序、跟踪拦截设置、浏览器/网络环境可能导致广告无法正常展示，或限制利波获取。',
              abuse:
                '<label>滥用</label>：如怀疑存在自动点击、机器人/脚本、多账号、利用漏洞等滥用行为，已获取的利波可能会被取消，或适用使用限制（功能限制/账号限制等）。',
              correction:
                '<label>更正</label>：因系统错误、重复获取、异常流量等导致利波被错误获取或扣减时，本服务可基于记录在合理范围内进行更正。',
            },
            note: '利波的获取/使用标准和限额以服务内说明为准，并可能因运营需要变更。',
          },
          browsers: {
            title: '第 6 条（支持的浏览器）',
            p1: '本服务针对最新版本的网页浏览器进行了优化，旧版浏览器中部分功能可能会受到限制。官方支持以下版本及以上。',
          },
          dmca: {
            title: '第 7 条（版权侵权举报与处理）',
            p1: '本服务运营用于接收和处理版权侵权举报的程序。权利人或合法代理人可通过 <dmca>版权/DMCA 举报页面</dmca>提交通知；收到有效通知后，相关内容的访问可能会受到限制。如果你主张拥有许可或权限，也可以在同一页面提交异议通知（Counter Notice）。',
          },
          liability: {
            title: '第 8 条（免责声明和责任限制）',
            items: {
              thirdPartyDamage:
                '在法律允许的范围内，本服务可限制因第三方提供的广告、外部链接或外部网站使用而产生的损害责任。但因本服务故意或重大过失造成的情形不在此限。',
              adNetworkAvailability:
                '由于第三方广告网络政策变更、网络故障、用户环境（浏览器设置/拦截工具等），广告可能无法展示，或利波可能无法获取。',
            },
          },
        },
      },
      youthProtection: {
        title: '青少年保护政策',
        subtitle: '莉托米根据相关法律和服务运营标准制定并适用本政策，以帮助青少年免受有害信息影响。',
        sections: {
          purpose: {
            title: '1. 目的和适用范围',
            p1: '本政策旨在就莉托米通过信息通信网络提供的信息和用户互动功能，依据<law>青少年保护法</law>、<law>信息通信网络利用促进及信息保护等相关法律</law>及相关法律的宗旨，说明青少年保护的标准和程序。',
            p2: '莉托米提供漫画浏览和探索服务，并可能采取访问限制、举报处理、运营政策反映等措施，以减少青少年接触不适宜信息的可能性。',
          },
          controls: {
            title: '2. 青少年访问限制和管理措施',
            items: {
              entryNotice: '服务入口页面会提示本网站面向 <strong>19 岁以上成年人</strong>，并提供使用限制说明。',
              bbaton: '对于登录用户，本服务可能会仅在必要功能中要求进行 <strong>基于 BBaton 的匿名成人认证</strong>。',
              extraRestriction:
                '根据韩国法律、内部政策或服务运营判断，部分功能或特定使用流程可能会适用额外的 <strong>成人认证或访问限制</strong>。',
              protectiveMeasures:
                '对于可能对青少年有害的信息，可采取公开范围调整、曝光限制、删除、账号限制等合理保护措施。',
            },
          },
          monitoring: {
            title: '3. 有害信息监测与应对',
            p1: '莉托米可基于用户举报、权利人通知、运营审核、法律请求等，确认信息是否属于青少年有害信息或违法信息。',
            p2: '如审核结果认为为保护青少年或遵守法律有必要，本服务可对相关信息采取曝光限制、删除、临时措施、访问阻断、账号制裁、请求补充资料等措施。',
            p3: '特别是儿童、青少年性剥削物、非法拍摄物、被强迫的性图像、明显违法信息等重大事项，会优先于服务内一般举报程序，迅速审查限制或删除措施。',
          },
          process: {
            title: '4. 运营流程和内部管理',
            items: {
              reviewStandards: '运营团队会审查青少年保护相关法律、举报类型、访问限制标准，并反映到服务运营标准中。',
              prioritizeReports: '收到与青少年保护相关的咨询或举报时，会根据事项性质划分优先级进行确认。',
              reviewEvidence: '必要时会确认相关画面、帖子、作品信息、举报内容、处理记录等，以决定后续措施。',
              updatePolicy: '当政策、法律或服务结构发生变化时，会同步更新青少年保护程序和说明文本。',
            },
          },
          complaint: {
            title: '5. 咨询与投诉处理',
            p1: '关于青少年有害信息曝光、访问限制不足、违法/有害内容流通等咨询或举报，可通过以下邮箱提交。版权侵权举报请使用 <dmca>版权/DMCA 举报页面</dmca>。其他一般咨询可发送至以下青少年保护负责人和联系人，确认后处理。',
          },
          officer: {
            title: '6. 青少年保护负责人和联系人',
            departmentLabel: '部门',
            departmentValue: '莉托米运营团队',
            roleLabel: '职务',
            roleValue: '运营者',
          },
          changes: {
            title: '7. 变更',
            p1: '本政策可能会根据相关法律、服务结构、举报处理程序和内部运营标准的变化而修订。',
          },
        },
      },
      dmca: {
        notice: {
          page: {
            backHome: '返回',
            title: '版权/DMCA 举报',
            subtitle: '这是供权利人（或代理人）提交通知的专用表单。',
            languageLabel: '语言',
            noticeHeading: '权利人通知',
            fallbackHeading: '这个表单不好用吗？',
            fallbackBody: '也可以发送到以下邮箱：',
            agentHeading: 'DMCA 指定代理人信息',
            agentBody:
              'Service Provider: {agentName} · Registration No: {registrationNumber} · Last Updated: {lastUpdated}',
            slaBody: '已受理的通知通常会尽量在 3 天内处理。',
            counterLink: '如果你想主张拥有许可（异议通知）→',
            formHint: '为便于准确处理，请尽可能具体填写。虚假举报可能产生法律责任。',
            errors: {
              invalid: '请重新确认输入内容。',
              noTarget: '请至少填写 1 个作品 URL 或作品 ID。',
              server: '发生临时错误。请稍后再试。',
            },
          },
          form: {
            mailSubject: 'DMCA 举报',
            copySuccess: '已复制。请粘贴到邮件中发送。',
            copyError: '复制失败。请手动复制。',
            copyTemplate: '复制模板',
            openEmailApp: '打开邮件应用',
            emailTemplate: '邮件模板',
            empty: '（空）',
            optional: '（可选）',
            noticeHeading: '权利人通知',
            reporterSection: '举报人信息',
            reporterName: '姓名',
            reporterEmail: '邮箱',
            reporterAddress: '地址',
            reporterPhone: '电话号码',
            reporterRole: '权限',
            reporterRoleOwner: '版权人',
            reporterRoleAgent: '代理人',
            workSection: '识别受版权保护的作品',
            workDescription: '作品说明',
            workURL: '作品 URL（可选）',
            infringingSection: '识别侵权内容',
            infringingReferences: '莉托米作品 URL 或作品 ID',
            infringingPlaceholder: '例）\nhttps://litomi.cc/manga/123\n123\nhttps://litomi.cc/manga/456',
            infringingHelp: '如果作品 URL 中包含 /manga/数字，会自动识别。多个项目请换行填写。',
            statementsSection: '声明',
            goodFaith: '我基于善意相信该内容构成侵权，并提交此通知。',
            perjury: '我理解作伪证可能受到处罚，并声明我是权利人或合法授权代理人。',
            signature: '电子签名（姓名）',
            submit: '提交',
          },
          success: {
            title: '已受理',
            body: '举报已受理。如需跟进，请附上受理编号联系 {dmcaEmail}。',
            caseLabel: '受理编号',
            back: '返回 DMCA 页面',
          },
        },
        counter: {
          page: {
            title: '异议通知',
            subtitle: '如果你主张拥有许可/权限，请在此提交。',
            languageLabel: '语言',
            backToNotice: '返回版权/DMCA 举报 →',
            hint: '处理过程中如需补充信息，我们可能会通过 {dmcaEmail} 联系你。',
            errors: {
              invalid: '请重新确认输入内容。',
              noTarget: '请至少填写 1 个作品 URL 或作品 ID。',
              server: '发生临时错误。请稍后再试。',
            },
          },
          form: {
            mailSubject: 'DMCA 异议通知（Counter Notice）',
            copySuccess: '已复制。请粘贴到邮件中发送。',
            copyError: '复制失败。请手动复制。',
            copyTemplate: '复制模板',
            openEmailApp: '打开邮件应用',
            emailTemplate: '邮件模板',
            empty: '（空）',
            optional: '（可选）',
            title: '异议通知',
            claimantSection: '提交人信息',
            claimantName: '姓名',
            claimantEmail: '邮箱',
            claimantAddress: '地址',
            claimantPhone: '电话号码',
            relatedSection: '相关信息',
            relatedNoticeId: '相关受理编号（可选）',
            infringingReferences: '莉托米作品 URL 或作品 ID',
            infringingHelp: '如果作品 URL 中包含 /manga/数字，会自动识别。多个项目请换行填写。',
            claimSection: '主张内容',
            claimDetails: '许可/权限依据',
            evidenceLinks: '证明链接（可选）',
            statementsSection: '声明',
            goodFaith: '我基于善意提交此异议通知。',
            perjury: '我理解作伪证可能受到处罚，并声明所提交的信息准确无误。',
            signature: '电子签名（姓名）',
            submit: '提交',
          },
          success: {
            title: '异议通知已受理',
            body: '异议通知已受理。如需跟进，请附上受理编号联系 {dmcaEmail}。',
            caseLabel: '受理编号',
            back: '返回异议通知页面',
          },
        },
      },
    },
  },
} satisfies LocalizedMessages
