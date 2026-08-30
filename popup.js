document.addEventListener('DOMContentLoaded', () => {
  const zoomInput = document.getElementById('zoomInput');
  const status = document.getElementById('status');

  // 현재 활성화된 탭 정보 가져오기
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const currentTab = tabs[0];

    if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('edge://') || currentTab.url.startsWith('about:') || currentTab.url.startsWith('file://')) {
      document.getElementById('current-url').innerText = "이 페이지에서는 사용할 수 없습니다.";
      document.getElementById('saveBtn').disabled = true;
      document.getElementById('clearBtn').disabled = true;
      zoomInput.disabled = true;
      return;
    }

    document.getElementById('current-url').innerText = currentTab.url;

    chrome.tabs.getZoom(currentTab.id, (currentZoom) => {
      // 기존 저장된 값 있으면 불러오기
      chrome.storage.local.get(['zoomSettings'], (result) => {
        const settings = result.zoomSettings || {};
        
        const matchedKey = Object.keys(settings)
          .filter(key => currentTab.url.startsWith(key))
          .sort((a, b) => b.length - a.length)[0];

        if (matchedKey) {
          const factor = typeof settings[matchedKey] === 'number' ? settings[matchedKey] : settings[matchedKey].factor;
          zoomInput.value = Math.round(factor * 100);
        } else {
          zoomInput.value = Math.round(currentZoom * 100);
        }
      });
    });

    // 저장 버튼 클릭
    document.getElementById('saveBtn').addEventListener('click', () => {
      const factor = parseFloat(zoomInput.value) / 100;
      chrome.storage.local.get(['zoomSettings'], (result) => {
        const settings = result.zoomSettings || {};
        settings[currentTab.url] = { factor: factor, title: currentTab.title || '제목 없음' };
        
        chrome.storage.local.set({zoomSettings: settings}, () => {
          chrome.tabs.setZoomSettings(currentTab.id, {scope: 'per-tab'}, () => {
            chrome.tabs.setZoom(currentTab.id, factor);
          });
          status.innerText = "저장 완료! 리로드해도 유지됩니다.";
        });
      });
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      chrome.storage.local.get(['zoomSettings'], (result) => {
        const settings = result.zoomSettings || {};
        
        const matchedKey = Object.keys(settings)
          .filter(key => currentTab.url.startsWith(key))
          .sort((a, b) => b.length - a.length)[0];
          
        if (matchedKey) {
          delete settings[matchedKey];
        } else {
          delete settings[currentTab.url];
        }
        
        chrome.storage.local.set({zoomSettings: settings}, () => {
          chrome.tabs.setZoomSettings(currentTab.id, {scope: 'per-origin'});
          status.innerText = "설정이 삭제되었습니다.";
        });
      });
    });

    // 목록 관리 버튼 클릭
    document.getElementById('optionsBtn').addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  });
});