import UIKit
import Capacitor
import WebKit

private final class RemoteShellNavigationDelegate: NSObject, WKNavigationDelegate {
    private let remoteURL = URL(string: "https://litomi.in")!
    private let timeoutInterval: TimeInterval = 15

    weak var bridgeViewController: CAPBridgeViewController?
    weak var webView: WKWebView?
    var loadTimeoutWorkItem: DispatchWorkItem?
    var hasVisibleContent = false

    func attach(to bridgeViewController: CAPBridgeViewController) {
        self.bridgeViewController = bridgeViewController
        bridgeViewController.loadViewIfNeeded()

        guard let webView = bridgeViewController.webView else {
            return
        }

        self.webView = webView
        webView.navigationDelegate = self
        scheduleTimeoutIfNeeded(for: bridgeViewController.bridge?.config.appStartServerURL)
    }

    private func isSameOrigin(_ url: URL) -> Bool {
        guard let remoteComponents = URLComponents(url: remoteURL, resolvingAgainstBaseURL: false),
              let urlComponents = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return false
        }

        return remoteComponents.scheme == urlComponents.scheme &&
            remoteComponents.host == urlComponents.host &&
            remoteComponents.port == urlComponents.port
    }

    private func isLocalErrorPage(_ url: URL?) -> Bool {
        guard let url, let errorURL = bridgeViewController?.bridge?.config.errorPathURL else {
            return false
        }

        return url.absoluteString == errorURL.absoluteString
    }

    private func scheduleTimeoutIfNeeded(for url: URL?) {
        guard let url else {
            scheduleTimeout()
            return
        }

        guard isSameOrigin(url), !isLocalErrorPage(url) else {
            cancelTimeout()
            return
        }

        scheduleTimeout()
    }

    private func scheduleTimeout() {
        hasVisibleContent = false
        cancelTimeout()

        let workItem = DispatchWorkItem { [weak self] in
            guard let self, !self.hasVisibleContent else {
                return
            }

            self.showErrorPageIfNeeded()
        }

        loadTimeoutWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + timeoutInterval, execute: workItem)
    }

    private func cancelTimeout() {
        loadTimeoutWorkItem?.cancel()
        loadTimeoutWorkItem = nil
    }

    private func showErrorPageIfNeeded() {
        cancelTimeout()

        guard let bridgeViewController,
              let errorURL = bridgeViewController.bridge?.config.errorPathURL,
              let webView else {
            return
        }

        if webView.url?.absoluteString == errorURL.absoluteString {
            return
        }

        webView.load(URLRequest(url: errorURL))
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        scheduleTimeoutIfNeeded(for: webView.url)
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        hasVisibleContent = true
        cancelTimeout()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        hasVisibleContent = true
        cancelTimeout()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        hasVisibleContent = false
        showErrorPageIfNeeded()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        hasVisibleContent = false
        showErrorPageIfNeeded()
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        hasVisibleContent = false
        showErrorPageIfNeeded()
    }

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let isTopLevelNavigation = navigationAction.targetFrame == nil || navigationAction.targetFrame?.isMainFrame == true
        let isSameOriginNavigation = isSameOrigin(url)

        if isSameOriginNavigation && navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
            decisionHandler(.cancel)
            return
        }

        if !isSameOriginNavigation && isTopLevelNavigation {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
            decisionHandler(.cancel)
            return
        }

        decisionHandler(.allow)
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private let remoteShellNavigationDelegate = RemoteShellNavigationDelegate()

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DispatchQueue.main.async { [weak self] in
            self?.attachRemoteShellNavigationDelegate()
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func attachRemoteShellNavigationDelegate() {
        guard let rootViewController = window?.rootViewController else {
            return
        }

        if let bridgeViewController = bridgeViewController(in: rootViewController) {
            remoteShellNavigationDelegate.attach(to: bridgeViewController)
        }
    }

    private func bridgeViewController(in viewController: UIViewController) -> CAPBridgeViewController? {
        if let bridgeViewController = viewController as? CAPBridgeViewController {
            return bridgeViewController
        }

        for child in viewController.children {
            if let bridgeViewController = bridgeViewController(in: child) {
                return bridgeViewController
            }
        }

        if let navigationController = viewController as? UINavigationController,
           let visibleViewController = navigationController.visibleViewController {
            return bridgeViewController(in: visibleViewController)
        }

        if let tabBarController = viewController as? UITabBarController,
           let selectedViewController = tabBarController.selectedViewController {
            return bridgeViewController(in: selectedViewController)
        }

        if let presentedViewController = viewController.presentedViewController {
            return bridgeViewController(in: presentedViewController)
        }

        return nil
    }
}
