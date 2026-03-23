package in.litomi.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    private static final long INITIAL_LOAD_TIMEOUT_MS = 15000L;
    private static final String REMOTE_ORIGIN = "https://litomi.in";

    private final Handler loadTimeoutHandler = new Handler(Looper.getMainLooper());
    private boolean hasVisibleContent;

    private final Runnable loadTimeoutRunnable = new Runnable() {
        @Override
        public void run() {
            if (!hasVisibleContent) {
                loadErrorPageIfNeeded();
            }
        }
    };

    private final WebViewListener remoteShellListener = new WebViewListener() {
        @Override
        public void onPageStarted(WebView webView) {
            if (shouldTrackTimeout(webView.getUrl())) {
                scheduleLoadTimeout();
                return;
            }

            cancelLoadTimeout();
        }

        @Override
        public void onPageCommitVisible(WebView webView, String url) {
            hasVisibleContent = true;
            cancelLoadTimeout();
        }

        @Override
        public void onPageLoaded(WebView webView) {
            hasVisibleContent = true;
            cancelLoadTimeout();
        }

        @Override
        public void onReceivedError(WebView webView) {
            hasVisibleContent = false;
            cancelLoadTimeout();
        }

        @Override
        public void onReceivedHttpError(WebView webView) {
            hasVisibleContent = false;
            cancelLoadTimeout();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        bridgeBuilder.addWebViewListener(remoteShellListener);
        super.onCreate(savedInstanceState);

        scheduleLoadTimeout();
        getOnBackPressedDispatcher()
            .addCallback(
                this,
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        if (bridge != null) {
                            WebView webView = bridge.getWebView();
                            if (webView != null && webView.canGoBack()) {
                                webView.goBack();
                                return;
                            }
                        }

                        finish();
                    }
                }
            );
    }

    @Override
    public void onDestroy() {
        cancelLoadTimeout();
        super.onDestroy();
    }

    private void scheduleLoadTimeout() {
        hasVisibleContent = false;
        cancelLoadTimeout();
        loadTimeoutHandler.postDelayed(loadTimeoutRunnable, INITIAL_LOAD_TIMEOUT_MS);
    }

    private void cancelLoadTimeout() {
        loadTimeoutHandler.removeCallbacks(loadTimeoutRunnable);
    }

    private void loadErrorPageIfNeeded() {
        if (bridge == null) {
            return;
        }

        String errorUrl = bridge.getErrorUrl();
        WebView webView = bridge.getWebView();
        if (errorUrl == null || webView == null) {
            return;
        }

        String currentUrl = webView.getUrl();
        if (currentUrl != null && currentUrl.startsWith(errorUrl)) {
            return;
        }

        webView.loadUrl(errorUrl);
    }

    private boolean shouldTrackTimeout(String url) {
        if (url == null || url.isBlank()) {
            return true;
        }

        if (bridge == null) {
            return url.startsWith(REMOTE_ORIGIN);
        }

        String errorUrl = bridge.getErrorUrl();
        if (errorUrl != null && url.startsWith(errorUrl)) {
            return false;
        }

        return url.startsWith(REMOTE_ORIGIN);
    }
}
