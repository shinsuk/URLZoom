// 페이지가 로드될 때 저장된 설정을 불러와 적용
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 로딩 시작 시점에 즉시 개입
  if (changeInfo.status === 'loading' && tab.url) {
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('file://')) {
      return;
    }

    // 현재 탭이 일시정지 상태인지 확인
    chrome.storage.session.get(['pausedTabs'], (sessionRes) => {
      const pausedTabs = (sessionRes && sessionRes.pausedTabs) || {};

      if (pausedTabs[tabId]) {
        // 일시정지 상태 배지 유지 및 줌 자동 적용 건너뜀
        chrome.action.setBadgeText({ tabId, text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#f57c00' });
        return;
      }

      chrome.storage.local.get(['zoomSettings'], (result) => {
        const settings = result.zoomSettings || {};
        
        // 현재 URL이 저장된 목록에 있는지 확인 (부분 일치 허용, 가장 긴 URL 우선 매칭)
        const matchedKey = Object.keys(settings)
          .filter(key => tab.url.startsWith(key))
          .sort((a, b) => b.length - a.length)[0];
        
        if (matchedKey) {
          const factor = typeof settings[matchedKey] === 'number' ? settings[matchedKey] : settings[matchedKey].factor;
          chrome.tabs.setZoomSettings(tabId, {scope: 'per-tab'}, () => {
            chrome.tabs.setZoom(tabId, factor);
          });
        } else {
          // 저장된 설정이 없으면 기존 도메인 시스템(per-origin)으로 권한을 넘김
          chrome.tabs.setZoomSettings(tabId, {scope: 'per-origin'});
        }
      });
    });
  }
});

// 탭이 닫힐 때 일시정지 세션 목록에서 정리
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.get(['pausedTabs'], (sessionRes) => {
    const pausedTabs = (sessionRes && sessionRes.pausedTabs) || {};
    if (pausedTabs[tabId]) {
      delete pausedTabs[tabId];
      chrome.storage.session.set({ pausedTabs });
    }
  });
});