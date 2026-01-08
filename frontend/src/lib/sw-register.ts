// 서비스워커 등록 (시크릿 모드 호환)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  // 시크릿 모드 감지 (가능한 경우)
  const isIncognito = () => {
    try {
      // 시크릿 모드에서는 localStorage가 제한될 수 있음
      const test = '__incognito_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return false;
    } catch (e) {
      return true;
    }
  };

  window.addEventListener("load", () => {
    // 시크릿 모드에서는 서비스 워커 등록을 시도하지 않거나, 실패해도 무시
    if (isIncognito()) {
      console.log("Incognito mode detected, skipping service worker registration");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        // 시크릿 모드나 기타 이유로 실패해도 앱은 정상 작동
        console.log("Service Worker registration failed (this is OK in incognito mode):", error);
      });
  });
}












