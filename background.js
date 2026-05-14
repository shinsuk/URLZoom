// 페이지가 로드될 때 저장된 설정을 불러와 적용
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 로딩 시작 시점에 즉시 개입
  if (changeInfo.status === 'loading' && tab.url) {
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('file://')) {
      return;
    }

    chrome.storage.local.get(['zoomSettings'], (result) => {
      const settings = result.zoomSettings || {};
      
      // 현재 URL이 저장된 목록에 있는지 확인 (전체 일치)
      if (settings[tab.url]) {
        const factor = typeof settings[tab.url] === 'number' ? settings[tab.url] : settings[tab.url].factor;
        chrome.tabs.setZoomSettings(tabId, {scope: 'per-tab'}, () => {
          chrome.tabs.setZoom(tabId, factor);
        });
      } else {
        // 저장된 설정이 없으면 기존 도메인 시스템(per-origin)으로 권한을 넘김
        chrome.tabs.setZoomSettings(tabId, {scope: 'per-origin'});
      }
    });
  }
});