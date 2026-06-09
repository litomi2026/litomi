import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      navigation: {
        app: {
          title: '앱으로 사용하기',
          description: '리토미 앱 설치 방법을 환경별로 안내해요.',
        },
        chat: {
          title: 'AI 채팅',
          description: '내 기기에서 AI 모델을 내려받아 캐릭터와 대화해요.',
        },
      },
      search: {
        title: '검색',
        queryTitle: '{query} 검색',
        description: '리토미에서 언어, 종류, 작가, 시리즈, 캐릭터, 태그 조건으로 만화와 동인지를 검색하세요.',
        queryDescription: '{query} 조건에 맞는 만화와 동인지를 리토미에서 찾아보세요.',
        landingQueryLabels: {
          'language:korean': '한국어 작품',
          'type:doujinshi': '동인지',
          'type:manga': '망가',
        },
      },
    },
    AppInstall: {
      title: '앱 설치 안내',
      description:
        '사용 중인 기기에 맞는 설치 방법을 선택해 주세요. 현재 리토미 앱은 기기에 최적화된 네이티브 앱으로 개발된 것이 아니라 기존의 웹 서비스를 앱 형태로 감싸서 보여주는 방식으로 제작되었기에, 웹 푸시 알림과 전체 화면 기능을 지원하는 웹앱(PWA) 설치 방식을 권장해요.',
      common: {
        externalSrOnly: '(새 탭에서 열림)',
        faqTitle: '자주 묻는 질문',
      },
      pwa: {
        badge: '추천',
        title: '웹앱 설치 (PWA)',
        prompt: {
          standalone: {
            title: '이미 앱처럼 사용 중이에요',
            description:
              '이미 홈 화면에 추가된 상태예요. 다음부터는 브라우저 대신 홈 화면 아이콘으로 바로 열면 됩니다.',
          },
          iosBrowser: {
            title: '먼저 Safari에서 열어 주세요',
            description:
              'iPhone과 iPad에서는 Safari에서만 홈 화면 추가가 안정적으로 보여요. 지금 페이지를 Safari에서 다시 연 뒤 설치를 진행해 주세요.',
          },
          iosSafari: {
            title: '지금 Safari에서 열려 있어요',
            description: '아래 순서대로 진행하면 iPhone과 iPad에서도 비교적 자연스럽게 앱처럼 사용할 수 있어요.',
            steps: {
              share: '공유 버튼을 눌러요',
              addToHome: '"홈 화면에 추가"를 고릅니다',
              reopen: '추가 후 홈 화면 아이콘으로 다시 열어요',
            },
          },
          installable: {
            title: '브라우저가 웹앱 설치를 지원해요',
            description:
              '버튼을 누르면 브라우저의 설치 창이 바로 열려요. 설치 후에는 일반 앱처럼 홈 화면에서 실행할 수 있어요.',
            action: '앱 설치하기',
          },
          fallback: {
            title: '브라우저 메뉴에서도 설치할 수 있어요',
            description:
              '자동 설치 버튼이 바로 보이지 않으면 브라우저 메뉴에서 "앱 설치", "홈 화면에 추가", 또는 비슷한 항목을 찾아보세요.',
          },
        },
      },
      android: {
        apkTitle: 'APK 앱 설치',
        download: '최신 APK 파일 다운로드',
        unknownSourcesNote: '설치가 막히면 기기 설정에서 <setting>알 수 없는 앱 설치</setting>를 한 번 허용해 주세요.',
      },
      ios: {
        actions: {
          sourceJson: 'Source JSON 열기',
          sideStoreDirect: 'SideStore에서 바로 추가',
        },
        testFlight: {
          description: 'TestFlight 앱을 통해 베타 버전을 설치합니다.',
          action: 'TestFlight 열기',
        },
        altStore: {
          title: 'IPA 앱 설치 (AltStore)',
          description: '데스크탑 PC에 설치된 AltServer를 통해 리토미 iOS 앱을 설치하는 방식이에요.',
          steps: {
            install: {
              title: 'AltStore를 설치해요',
              content:
                'Windows/Mac에서 <altServer>AltServer</altServer>를 설치하고, iPhone/iPad에 <app>AltStore Classic</app>을 설치한 뒤, 설정에서 <trust>Apple ID 신뢰</trust>와 <developerMode>개발자 모드</developerMode> 활성화까지 마쳐 주세요.',
            },
            addSource: {
              title: 'AltStore에 리토미 소스를 추가해요',
              content:
                'AltStore의 <sources>Sources</sources> 탭에서 <addSource>Add Source</addSource>를 누른 뒤, 위의 <sourceJson>Source JSON</sourceJson> 주소를 붙여 넣어요.',
            },
            installApp: {
              title: '리토미 iOS 앱을 설치해요',
              content: '추가된 리토미 소스를 열고 앱 카드의 설치 버튼을 누르면 기기에 내려받을 수 있어요.',
            },
            refresh: {
              title: 'AltServer로 만료 전에 갱신해요',
              content:
                '<myApps>My Apps</myApps> 탭의 <refreshAll>Refresh All</refreshAll>로 갱신할 수 있어요. 이때 <altServer>AltServer</altServer>가 같은 Wi-Fi에 있거나 USB로 연결되어 있어야 해요.',
            },
          },
          faq: {
            refresh: '무료 Apple 계정이면 리토미와 AltStore가 7일마다 만료되므로 주기적으로 갱신해줘야 해요.',
            appLimit: '무료 계정 기준으로 AltStore 자체를 포함해 동시에 활성화할 수 있는 앱은 최대 3개예요.',
          },
        },
        sideStore: {
          title: 'IPA 앱 설치 (SideStore)',
          description:
            '처음 설치할 때만 컴퓨터가 필요하고, 이후에는 <localDevVPN>LocalDevVPN</localDevVPN>을 켠 상태에서 기기에서 갱신할 수 있어요.',
          actionHint:
            '<directButton>SideStore에서 바로 추가</directButton> 버튼은 SideStore가 이미 설치된 iPhone/iPad에서만 바로 열려요. 설치 전이라면 아래 안내대로 먼저 SideStore를 준비해 주세요.',
          steps: {
            install: {
              title: 'SideStore를 설치해요',
              content:
                'Windows/Mac/Linux에서 <sideStore>SideStore</sideStore>를 설치하고, iPhone/iPad에서 <pairingFile>pairing 파일</pairingFile>과 <localDevVPN>LocalDevVPN</localDevVPN> 설정까지 마쳐 주세요.',
            },
            addSource: {
              title: 'SideStore에 리토미 소스를 추가해요',
              content:
                'SideStore가 설치된 iPhone/iPad라면 위의 <directButton>SideStore에서 바로 추가</directButton> 버튼으로 리토미 소스를 열 수 있어요. 수동으로 추가하려면 <sources>Sources</sources> 탭에서 추가 버튼을 누른 뒤 <sourceJson>Source JSON</sourceJson> 주소를 붙여 넣어요.',
            },
            installApp: {
              title: '리토미 iOS 앱을 설치해요',
              content: '추가된 리토미 소스를 열고 앱 카드의 설치 버튼을 누르면 기기에 내려받을 수 있어요.',
            },
            refresh: {
              title: 'LocalDevVPN을 켠 채로 갱신해요',
              content:
                '<myApps>My Apps</myApps> 탭의 <refreshAll>Refresh All</refreshAll>로 갱신할 수 있어요. 설치, 업데이트, 갱신 중에는 <localDevVPN>LocalDevVPN</localDevVPN>을 켜 두는 편이 안전해요.',
            },
          },
          faq: {
            refresh: '무료 Apple 계정이면 리토미와 SideStore가 7일마다 만료되므로 주기적으로 갱신해줘야 해요.',
            appLimit: '무료 계정 기준으로 SideStore 자체를 포함해 동시에 활성화할 수 있는 앱은 최대 3개예요.',
          },
        },
      },
    },
    Navigation: {
      sidebar: {
        home: '홈',
        search: '검색',
        ranking: '인기',
        library: '서재',
        bookmark: '북마크',
        posts: '이야기',
        tag: '태그',
        notification: '알림',
        libo: '리보',
        more: '더보기',
        censor: '검열',
        donation: '후원',
        chat: 'AI 채팅',
        fortune: '운세',
      },
      mobileMenu: {
        open: '메뉴 열기',
        close: '메뉴 닫기',
        menu: '메뉴',
        menuLabel: '모바일 메뉴',
        navLabel: '모바일 보조 메뉴',
        ranking: '인기',
        bookmark: '북마크',
        posts: '이야기',
        tag: '태그',
        chat: 'AI 채팅',
        libo: '리보',
        history: '감상 기록',
        rating: '평가',
        fortune: '운세',
        settings: '설정',
        censor: '검열',
        donation: '후원',
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      navigation: {
        app: {
          title: 'Use as an App',
          description: 'Learn how to install the Litomi app for each environment.',
        },
        chat: {
          title: 'AI Chat',
          description: 'Download an AI model on your device and chat with characters.',
        },
      },
      search: {
        title: 'Search',
        queryTitle: '{query} Search',
        description: 'Search Litomi by language, type, artist, series, character, and tag.',
        queryDescription: 'Find manga and doujinshi matching {query} on Litomi.',
        landingQueryLabels: {
          'language:korean': 'Korean works',
          'type:doujinshi': 'Doujinshi',
          'type:manga': 'Manga',
        },
      },
    },
    AppInstall: {
      title: 'App Installation Guide',
      description:
        'Choose the installation method for your device. The current Litomi app is not a device-optimized native app; it wraps the existing web service as an app, so we recommend the web app (PWA) method with web push notifications and fullscreen support.',
      common: {
        externalSrOnly: '(opens in a new tab)',
        faqTitle: 'FAQ',
      },
      pwa: {
        badge: 'Recommended',
        title: 'Install as Web App (PWA)',
        prompt: {
          standalone: {
            title: 'Already using it like an app',
            description:
              'It is already added to your home screen. Next time, open it directly from the home screen icon instead of the browser.',
          },
          iosBrowser: {
            title: 'Open it in Safari first',
            description:
              'On iPhone and iPad, adding to the home screen is shown reliably only in Safari. Reopen this page in Safari, then continue installation.',
          },
          iosSafari: {
            title: 'You are in Safari now',
            description: 'Follow these steps to use Litomi more naturally like an app on iPhone and iPad.',
            steps: {
              share: 'Tap the Share button',
              addToHome: 'Choose "Add to Home Screen"',
              reopen: 'Open it again from the home screen icon',
            },
          },
          installable: {
            title: 'Your browser supports web app installation',
            description:
              'Tap the button to open the browser installation prompt. After installing, you can launch it from the home screen like a regular app.',
            action: 'Install app',
          },
          fallback: {
            title: 'You can also install it from the browser menu',
            description:
              'If the automatic install button does not appear, look in the browser menu for "Install app", "Add to Home Screen", or a similar item.',
          },
        },
      },
      android: {
        apkTitle: 'Install APK App',
        download: 'Download the latest APK',
        unknownSourcesNote:
          'If installation is blocked, allow <setting>Install unknown apps</setting> once in your device settings.',
      },
      ios: {
        actions: {
          sourceJson: 'Open Source JSON',
          sideStoreDirect: 'Add directly in SideStore',
        },
        testFlight: {
          description: 'Install the beta version through the TestFlight app.',
          action: 'Open TestFlight',
        },
        altStore: {
          title: 'Install IPA App (AltStore)',
          description: 'Install the Litomi iOS app through AltServer on your desktop computer.',
          steps: {
            install: {
              title: 'Install AltStore',
              content:
                'Install <altServer>AltServer</altServer> on Windows/Mac, install <app>AltStore Classic</app> on your iPhone/iPad, then finish enabling <trust>Trust Apple ID</trust> and <developerMode>Developer Mode</developerMode> in Settings.',
            },
            addSource: {
              title: 'Add the Litomi source to AltStore',
              content:
                'In AltStore’s <sources>Sources</sources> tab, tap <addSource>Add Source</addSource>, then paste the <sourceJson>Source JSON</sourceJson> URL above.',
            },
            installApp: {
              title: 'Install the Litomi iOS app',
              content:
                'Open the added Litomi source and tap the install button on the app card to download it to your device.',
            },
            refresh: {
              title: 'Refresh before it expires with AltServer',
              content:
                'Refresh from the <myApps>My Apps</myApps> tab using <refreshAll>Refresh All</refreshAll>. <altServer>AltServer</altServer> must be on the same Wi-Fi or connected over USB.',
            },
          },
          faq: {
            refresh:
              'With a free Apple account, Litomi and AltStore expire every 7 days, so you need to refresh them regularly.',
            appLimit: 'With a free account, you can keep up to 3 apps active at once, including AltStore itself.',
          },
        },
        sideStore: {
          title: 'Install IPA App (SideStore)',
          description:
            'You only need a computer for the first installation. After that, you can refresh from the device with <localDevVPN>LocalDevVPN</localDevVPN> turned on.',
          actionHint:
            'The <directButton>Add directly in SideStore</directButton> button opens directly only on an iPhone/iPad with SideStore already installed. If you have not installed it yet, prepare SideStore first using the guide below.',
          steps: {
            install: {
              title: 'Install SideStore',
              content:
                'Install <sideStore>SideStore</sideStore> on Windows/Mac/Linux, then complete the <pairingFile>pairing file</pairingFile> and <localDevVPN>LocalDevVPN</localDevVPN> setup on your iPhone/iPad.',
            },
            addSource: {
              title: 'Add the Litomi source to SideStore',
              content:
                'If SideStore is installed on your iPhone/iPad, use the <directButton>Add directly in SideStore</directButton> button above to open the Litomi source. To add it manually, go to the <sources>Sources</sources> tab, tap the add button, and paste the <sourceJson>Source JSON</sourceJson> URL.',
            },
            installApp: {
              title: 'Install the Litomi iOS app',
              content:
                'Open the added Litomi source and tap the install button on the app card to download it to your device.',
            },
            refresh: {
              title: 'Refresh with LocalDevVPN turned on',
              content:
                'Refresh from the <myApps>My Apps</myApps> tab with <refreshAll>Refresh All</refreshAll>. Keep <localDevVPN>LocalDevVPN</localDevVPN> on during installation, updates, and refreshes.',
            },
          },
          faq: {
            refresh:
              'With a free Apple account, Litomi and SideStore expire every 7 days, so you need to refresh them regularly.',
            appLimit: 'With a free account, you can keep up to 3 apps active at once, including SideStore itself.',
          },
        },
      },
    },
    Navigation: {
      sidebar: {
        home: 'Home',
        search: 'Explore',
        ranking: 'Popular',
        library: 'Library',
        bookmark: 'Bookmarks',
        posts: 'Posts',
        tag: 'Tags',
        notification: 'Notifications',
        libo: 'Libo',
        more: 'More',
        censor: 'Censor',
        donation: 'Donation',
        chat: 'AI Chat',
        fortune: 'Fortune',
      },
      mobileMenu: {
        open: 'Open menu',
        close: 'Close menu',
        menu: 'Menu',
        menuLabel: 'Mobile menu',
        navLabel: 'Mobile secondary menu',
        ranking: 'Popular',
        bookmark: 'Bookmarks',
        posts: 'Posts',
        tag: 'Tags',
        chat: 'AI Chat',
        libo: 'Libo',
        history: 'Reading history',
        rating: 'Ratings',
        fortune: 'Fortune',
        settings: 'Settings and privacy',
        censor: 'Censor',
        donation: 'Donation',
      },
    },
  },
  [Locale.JA]: {
    Metadata: {
      navigation: {
        app: {
          title: 'アプリで使う',
          description: 'リトミをアプリとして使う方法を環境別に案内します。',
        },
        chat: {
          title: 'AIと話す',
          description: 'お使いの端末に AI モデルを入れて、キャラクターと会話しましょう。',
        },
      },
      search: {
        title: '検索',
        queryTitle: '{query} 検索',
        description: 'リトミで言語、種類、作家、シリーズ、キャラクター、タグ条件から漫画や同人誌を検索できます。',
        queryDescription: '{query} 条件に合う漫画や同人誌をリトミで探しましょう。',
        landingQueryLabels: {
          'language:korean': '韓国語作品',
          'type:doujinshi': '同人誌',
          'type:manga': '漫画',
        },
      },
    },
    AppInstall: {
      title: 'アプリのインストール案内',
      description:
        'お使いの端末に合うインストール方法を選んでください。現在のリトミアプリは端末向けに最適化されたネイティブアプリではなく、既存の Web サービスをアプリ形式で表示する仕組みのため、Web プッシュ通知と全画面表示に対応した Web アプリ (PWA) としてのインストールをおすすめします。',
      common: {
        externalSrOnly: '(新しいタブで開きます)',
        faqTitle: 'よくある質問',
      },
      pwa: {
        badge: 'おすすめ',
        title: 'Web アプリとしてインストール (PWA)',
        prompt: {
          standalone: {
            title: 'すでにアプリのように使用中です',
            description:
              'すでにホーム画面に追加されています。次回からはブラウザではなく、ホーム画面のアイコンから直接開けます。',
          },
          iosBrowser: {
            title: 'まず Safari で開いてください',
            description:
              'iPhone と iPad では、ホーム画面への追加は Safari でのみ安定して表示されます。このページを Safari で開き直してからインストールしてください。',
          },
          iosSafari: {
            title: '現在 Safari で開いています',
            description: '以下の手順で、iPhone と iPad でもアプリのように自然に使えます。',
            steps: {
              share: '共有ボタンを押す',
              addToHome: '「ホーム画面に追加」を選ぶ',
              reopen: '追加後、ホーム画面のアイコンから開き直す',
            },
          },
          installable: {
            title: 'このブラウザは Web アプリのインストールに対応しています',
            description:
              'ボタンを押すとブラウザのインストール画面が開きます。インストール後は通常のアプリのようにホーム画面から起動できます。',
            action: 'アプリをインストール',
          },
          fallback: {
            title: 'ブラウザメニューからもインストールできます',
            description:
              '自動インストールボタンが表示されない場合は、ブラウザメニューで「アプリをインストール」「ホーム画面に追加」などの項目を探してください。',
          },
        },
      },
      android: {
        apkTitle: 'APK アプリをインストール',
        download: '最新 APK ファイルをダウンロード',
        unknownSourcesNote:
          'インストールがブロックされる場合は、端末の設定で <setting>不明なアプリのインストール</setting> を一度許可してください。',
      },
      ios: {
        actions: {
          sourceJson: 'Source JSON を開く',
          sideStoreDirect: 'SideStore で直接追加',
        },
        testFlight: {
          description: 'TestFlight アプリを通じてベータ版をインストールします。',
          action: 'TestFlight を開く',
        },
        altStore: {
          title: 'IPA アプリをインストール (AltStore)',
          description:
            'デスクトップ PC にインストールした AltServer 経由で、リトミ iOS アプリをインストールする方法です。',
          steps: {
            install: {
              title: 'AltStore をインストールする',
              content:
                'Windows/Mac で <altServer>AltServer</altServer> をインストールし、iPhone/iPad に <app>AltStore Classic</app> をインストールしたあと、設定で <trust>Apple ID を信頼</trust> と <developerMode>デベロッパモード</developerMode> の有効化まで完了してください。',
            },
            addSource: {
              title: 'AltStore にリトミのソースを追加する',
              content:
                'AltStore の <sources>Sources</sources> タブで <addSource>Add Source</addSource> を押し、上の <sourceJson>Source JSON</sourceJson> URL を貼り付けます。',
            },
            installApp: {
              title: 'リトミ iOS アプリをインストールする',
              content:
                '追加したリトミのソースを開き、アプリカードのインストールボタンを押すと端末にダウンロードできます。',
            },
            refresh: {
              title: '期限切れ前に AltServer で更新する',
              content:
                '<myApps>My Apps</myApps> タブの <refreshAll>Refresh All</refreshAll> で更新できます。このとき <altServer>AltServer</altServer> が同じ Wi-Fi 上にあるか、USB で接続されている必要があります。',
            },
          },
          faq: {
            refresh:
              '無料の Apple アカウントでは、リトミと AltStore が 7 日ごとに期限切れになるため、定期的な更新が必要です。',
            appLimit: '無料アカウントでは、AltStore 自体を含めて同時に有効化できるアプリは最大 3 個です。',
          },
        },
        sideStore: {
          title: 'IPA アプリをインストール (SideStore)',
          description:
            '初回インストール時だけコンピューターが必要です。その後は <localDevVPN>LocalDevVPN</localDevVPN> をオンにした状態で、端末から更新できます。',
          actionHint:
            '<directButton>SideStore で直接追加</directButton> ボタンは、SideStore がすでにインストールされた iPhone/iPad でのみ直接開けます。インストール前の場合は、下の案内に沿って先に SideStore を準備してください。',
          steps: {
            install: {
              title: 'SideStore をインストールする',
              content:
                'Windows/Mac/Linux で <sideStore>SideStore</sideStore> をインストールし、iPhone/iPad で <pairingFile>pairing ファイル</pairingFile> と <localDevVPN>LocalDevVPN</localDevVPN> の設定まで完了してください。',
            },
            addSource: {
              title: 'SideStore にリトミのソースを追加する',
              content:
                'SideStore がインストールされた iPhone/iPad なら、上の <directButton>SideStore で直接追加</directButton> ボタンでリトミのソースを開けます。手動で追加する場合は、<sources>Sources</sources> タブで追加ボタンを押し、<sourceJson>Source JSON</sourceJson> URL を貼り付けます。',
            },
            installApp: {
              title: 'リトミ iOS アプリをインストールする',
              content:
                '追加したリトミのソースを開き、アプリカードのインストールボタンを押すと端末にダウンロードできます。',
            },
            refresh: {
              title: 'LocalDevVPN をオンにして更新する',
              content:
                '<myApps>My Apps</myApps> タブの <refreshAll>Refresh All</refreshAll> で更新できます。インストール、アップデート、更新中は <localDevVPN>LocalDevVPN</localDevVPN> をオンにしておくと安全です。',
            },
          },
          faq: {
            refresh:
              '無料の Apple アカウントでは、リトミと SideStore が 7 日ごとに期限切れになるため、定期的な更新が必要です。',
            appLimit: '無料アカウントでは、SideStore 自体を含めて同時に有効化できるアプリは最大 3 個です。',
          },
        },
      },
    },
    Navigation: {
      sidebar: {
        home: 'ホーム',
        search: '検索',
        ranking: '人気',
        library: '本棚',
        bookmark: 'ブックマーク',
        posts: '投稿',
        tag: 'タグ',
        notification: '通知',
        libo: 'Libo',
        more: 'その他',
        censor: '表示制限',
        donation: '支援',
        chat: 'AIと話す',
        fortune: '占い',
      },
      mobileMenu: {
        open: 'メニューを開く',
        close: 'メニューを閉じる',
        menu: 'メニュー',
        menuLabel: '携帯端末用メニュー',
        navLabel: '携帯端末用の追加メニュー',
        ranking: '人気',
        bookmark: 'ブックマーク',
        posts: '投稿',
        tag: 'タグ',
        chat: 'AIと話す',
        libo: 'Libo',
        history: '閲覧履歴',
        rating: '評価',
        fortune: '占い',
        settings: '設定',
        censor: '表示制限',
        donation: '支援',
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      navigation: {
        app: {
          title: '作为应用使用',
          description: '按环境说明莉托米应用的安装方法。',
        },
        chat: {
          title: 'AI 聊天',
          description: '在你的设备上下载 AI 模型，与角色对话。',
        },
      },
      search: {
        title: '搜索',
        queryTitle: '{query} 搜索',
        description: '在莉托米按语言、类型、作者、系列、角色和标签条件搜索漫画与同人志。',
        queryDescription: '在莉托米查找符合 {query} 条件的漫画和同人志。',
        landingQueryLabels: {
          'language:korean': '韩语作品',
          'type:doujinshi': '同人志',
          'type:manga': '漫画',
        },
      },
    },
    AppInstall: {
      title: '应用安装说明',
      description:
        '请选择适合你设备的安装方式。当前莉托米应用并不是针对设备优化的原生应用，而是把现有 Web 服务包装成应用形式，因此更推荐使用支持网页推送通知和全屏显示的 Web 应用（PWA）安装方式。',
      common: {
        externalSrOnly: '（在新标签页打开）',
        faqTitle: '常见问题',
      },
      pwa: {
        badge: '推荐',
        title: '安装为 Web 应用（PWA）',
        prompt: {
          standalone: {
            title: '已经像应用一样使用中',
            description: '它已经添加到主屏幕。下次可直接从主屏幕图标打开，无需先进入浏览器。',
          },
          iosBrowser: {
            title: '请先在 Safari 中打开',
            description:
              '在 iPhone 和 iPad 上，添加到主屏幕只会在 Safari 中稳定显示。请在 Safari 中重新打开此页面后继续安装。',
          },
          iosSafari: {
            title: '当前已在 Safari 中打开',
            description: '按照以下步骤操作，就能在 iPhone 和 iPad 上更自然地像应用一样使用。',
            steps: {
              share: '点击分享按钮',
              addToHome: '选择“添加到主屏幕”',
              reopen: '添加后从主屏幕图标重新打开',
            },
          },
          installable: {
            title: '你的浏览器支持安装 Web 应用',
            description: '点击按钮会直接打开浏览器的安装提示。安装后可像普通应用一样从主屏幕启动。',
            action: '安装应用',
          },
          fallback: {
            title: '也可以从浏览器菜单安装',
            description: '如果没有看到自动安装按钮，请在浏览器菜单中寻找“安装应用”“添加到主屏幕”或类似选项。',
          },
        },
      },
      android: {
        apkTitle: '安装 APK 应用',
        download: '下载最新 APK 文件',
        unknownSourcesNote: '如果安装被拦截，请在设备设置中允许一次 <setting>安装未知应用</setting>。',
      },
      ios: {
        actions: {
          sourceJson: '打开 Source JSON',
          sideStoreDirect: '直接在 SideStore 中添加',
        },
        testFlight: {
          description: '通过 TestFlight 应用安装测试版。',
          action: '打开 TestFlight',
        },
        altStore: {
          title: '安装 IPA 应用（AltStore）',
          description: '通过安装在桌面电脑上的 AltServer 安装莉托米 iOS 应用。',
          steps: {
            install: {
              title: '安装 AltStore',
              content:
                '在 Windows/Mac 上安装 <altServer>AltServer</altServer>，在 iPhone/iPad 上安装 <app>AltStore Classic</app>，然后在设置中完成 <trust>信任 Apple ID</trust> 和启用 <developerMode>开发者模式</developerMode>。',
            },
            addSource: {
              title: '将莉托米源添加到 AltStore',
              content:
                '在 AltStore 的 <sources>Sources</sources> 标签页中点击 <addSource>Add Source</addSource>，然后粘贴上方的 <sourceJson>Source JSON</sourceJson> 地址。',
            },
            installApp: {
              title: '安装莉托米 iOS 应用',
              content: '打开已添加的莉托米源，点击应用卡片上的安装按钮即可下载到设备。',
            },
            refresh: {
              title: '到期前通过 AltServer 刷新',
              content:
                '可在 <myApps>My Apps</myApps> 标签页中使用 <refreshAll>Refresh All</refreshAll> 刷新。此时 <altServer>AltServer</altServer> 必须处于同一 Wi-Fi，或通过 USB 连接。',
            },
          },
          faq: {
            refresh: '使用免费 Apple 账号时，莉托米和 AltStore 每 7 天会到期，因此需要定期刷新。',
            appLimit: '免费账号最多可同时保持 3 个应用处于激活状态，其中包括 AltStore 本身。',
          },
        },
        sideStore: {
          title: '安装 IPA 应用（SideStore）',
          description: '只有首次安装时需要电脑。之后可在设备上开启 <localDevVPN>LocalDevVPN</localDevVPN> 后进行刷新。',
          actionHint:
            '<directButton>直接在 SideStore 中添加</directButton> 按钮只会在已安装 SideStore 的 iPhone/iPad 上直接打开。若尚未安装，请先按照下方说明准备 SideStore。',
          steps: {
            install: {
              title: '安装 SideStore',
              content:
                '在 Windows/Mac/Linux 上安装 <sideStore>SideStore</sideStore>，并在 iPhone/iPad 上完成 <pairingFile>pairing 文件</pairingFile> 和 <localDevVPN>LocalDevVPN</localDevVPN> 设置。',
            },
            addSource: {
              title: '将莉托米源添加到 SideStore',
              content:
                '如果 iPhone/iPad 已安装 SideStore，可使用上方 <directButton>直接在 SideStore 中添加</directButton> 按钮打开莉托米源。若要手动添加，请在 <sources>Sources</sources> 标签页中点击添加按钮，然后粘贴 <sourceJson>Source JSON</sourceJson> 地址。',
            },
            installApp: {
              title: '安装莉托米 iOS 应用',
              content: '打开已添加的莉托米源，点击应用卡片上的安装按钮即可下载到设备。',
            },
            refresh: {
              title: '开启 LocalDevVPN 后刷新',
              content:
                '可在 <myApps>My Apps</myApps> 标签页中使用 <refreshAll>Refresh All</refreshAll> 刷新。安装、更新和刷新期间，建议保持 <localDevVPN>LocalDevVPN</localDevVPN> 开启。',
            },
          },
          faq: {
            refresh: '使用免费 Apple 账号时，莉托米和 SideStore 每 7 天会到期，因此需要定期刷新。',
            appLimit: '免费账号最多可同时保持 3 个应用处于激活状态，其中包括 SideStore 本身。',
          },
        },
      },
    },
    Navigation: {
      sidebar: {
        home: '首页',
        search: '搜索',
        ranking: '热门',
        library: '书库',
        bookmark: '书签',
        posts: '动态',
        tag: '标签',
        notification: '通知',
        libo: 'Libo',
        more: '更多',
        censor: '屏蔽',
        donation: '赞助',
        chat: 'AI 聊天',
        fortune: '运势',
      },
      mobileMenu: {
        open: '打开菜单',
        close: '关闭菜单',
        menu: '菜单',
        menuLabel: '移动端菜单',
        navLabel: '移动端辅助菜单',
        ranking: '热门',
        bookmark: '书签',
        posts: '动态',
        tag: '标签',
        chat: 'AI 聊天',
        libo: 'Libo',
        history: '阅读记录',
        rating: '评分',
        fortune: '运势',
        settings: '设置',
        censor: '屏蔽',
        donation: '赞助',
      },
    },
  },
} satisfies LocalizedMessages
