let currentSort = { key: 'url', dir: 'asc' };

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  
  document.getElementById('sort-title').addEventListener('click', () => changeSort('title'));
  document.getElementById('sort-url').addEventListener('click', () => changeSort('url'));
  document.getElementById('sort-zoom').addEventListener('click', () => changeSort('zoom'));
});

function changeSort(key) {
  if (currentSort.key === key) {
    currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.key = key;
    currentSort.dir = 'asc';
  }
  restoreOptions();
}

function updateHeaders() {
  const headers = {
    title: document.getElementById('sort-title'),
    url: document.getElementById('sort-url'),
    zoom: document.getElementById('sort-zoom')
  };
  
  const labels = {
    title: '제목',
    url: 'URL',
    zoom: 'Zoom (%)'
  };

  for (const [key, el] of Object.entries(headers)) {
    if (currentSort.key === key) {
      el.innerText = `${labels[key]} ${currentSort.dir === 'asc' ? '↑' : '↓'}`;
    } else {
      el.innerText = `${labels[key]} ↕`;
    }
  }
}

function restoreOptions() {
  updateHeaders();
  chrome.storage.local.get(['zoomSettings'], (result) => {
    const settings = result.zoomSettings || {};
    const tbody = document.getElementById('urlList');
    tbody.innerHTML = ''; // 초기화

    let list = Object.entries(settings).map(([url, data]) => {
      const factor = typeof data === 'number' ? data : data.factor;
      const title = typeof data === 'number' ? '' : (data.title || '');
      return { url, factor, title };
    });

    list.sort((a, b) => {
      let valA, valB;
      if (currentSort.key === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (currentSort.key === 'url') {
        valA = a.url.toLowerCase();
        valB = b.url.toLowerCase();
      } else if (currentSort.key === 'zoom') {
        valA = a.factor;
        valB = b.factor;
      }
      
      if (valA < valB) return currentSort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return currentSort.dir === 'asc' ? 1 : -1;
      return 0;
    });

    for (const { url, factor, title } of list) {
      const tr = document.createElement('tr');
      
      const titleTd = document.createElement('td');
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = title;
      titleInput.className = 'title-input';
      titleTd.appendChild(titleInput);
      tr.appendChild(titleTd);

      const urlTd = document.createElement('td');
      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.value = url;
      urlInput.className = 'url-input';
      urlTd.appendChild(urlInput);
      tr.appendChild(urlTd);

      const zoomTd = document.createElement('td');
      const zoomInput = document.createElement('input');
      zoomInput.type = 'number';
      zoomInput.className = 'zoom-input';
      zoomInput.step = '5';
      zoomInput.value = Math.round(factor * 100);
      zoomTd.appendChild(zoomInput);
      zoomTd.appendChild(document.createTextNode(' %'));
      tr.appendChild(zoomTd);

      const actionTd = document.createElement('td');
      
      const saveBtn = document.createElement('button');
      saveBtn.textContent = '저장';
      saveBtn.className = 'edit-btn';
      saveBtn.addEventListener('click', () => {
        saveSetting(url, urlInput.value, titleInput.value, parseFloat(zoomInput.value) / 100);
      });
      actionTd.appendChild(saveBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '삭제';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => {
        deleteSetting(url);
        tr.remove();
      });
      actionTd.appendChild(deleteBtn);

      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    }

    if (Object.keys(settings).length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = '저장된 URL이 없습니다.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  });
}

function saveSetting(oldUrl, newUrl, newTitle, newFactor) {
  chrome.storage.local.get(['zoomSettings'], (result) => {
    const settings = result.zoomSettings || {};
    
    if (oldUrl !== newUrl) {
      delete settings[oldUrl];
    }
    
    settings[newUrl] = { factor: newFactor, title: newTitle };
    
    chrome.storage.local.set({zoomSettings: settings}, () => {
      const status = document.getElementById('status');
      status.textContent = '저장되었습니다.';
      setTimeout(() => { status.textContent = ''; }, 2000);
      
      if (oldUrl !== newUrl) {
        restoreOptions();
      }
    });
  });
}

function deleteSetting(url) {
  chrome.storage.local.get(['zoomSettings'], (result) => {
    const settings = result.zoomSettings || {};
    delete settings[url];
    chrome.storage.local.set({zoomSettings: settings}, () => {
      const status = document.getElementById('status');
      status.textContent = '삭제되었습니다.';
      setTimeout(() => { status.textContent = ''; }, 2000);
      
      if (Object.keys(settings).length === 0) {
        restoreOptions();
      }
    });
  });
}
