const status = document.querySelector('#status');
const list = document.querySelector('#wrapper');
const scan = document.querySelector('#scan');
const pageHosts = new Set(['learning.hanyang.ac.kr', 'hycms.hanyang.ac.kr']);
const mediaHosts = new Set(['hanyang-cms-object.edge.naverncp.com', 'hycms.hanyang.ac.kr']);
function supported(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password &&
      mediaHosts.has(url.hostname) && /\.(mp4|m4a|mp3)$/i.test(url.pathname) &&
      !/\/(preloader|intro)\.mp4$/i.test(url.pathname);
  } catch { return false; }
}
function filename(title, url) {
  const base = title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 120) || 'lecture';
  return 'Hanyang/' + (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base) ? '_' : '') + base + new URL(url).pathname.match(/\.[^.\/]+$/)[0];
}
scan.addEventListener('click', async () => {
  scan.disabled = true;
  list.replaceChildren();
  status.textContent = '영상 확인 중…';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !pageHosts.has(new URL(tab.url).hostname)) throw new Error('한양대 강의 페이지에서 실행하세요.');
    const frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => ({ title: document.title, videos: Array.from(document.querySelectorAll('video, audio')).map(v => ({ url: v.currentSrc || v.src, duration: v.duration })) })
    });
    const seen = new Set();
    for (const frame of frames) for (const video of frame.result?.videos || []) {
      if (!supported(video.url) || seen.has(video.url)) continue;
      seen.add(video.url);
      const title = frame.result.title || tab.title || 'lecture';
      const row = document.createElement('div');
      const label = document.createElement('p');
      label.textContent = title + (Number.isFinite(video.duration) ? ` (${Math.floor(video.duration / 60)}분 ${Math.floor(video.duration % 60)}초)` : '');
      const button = document.createElement('button');
      button.textContent = '파일 저장';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await chrome.downloads.download({ url: video.url, filename: filename(title, video.url), saveAs: true, conflictAction: 'uniquify' });
          status.textContent = '다운로드를 요청했습니다. Chrome 다운로드 목록에서 완료 여부를 확인하세요. 서버가 거부하면 저장되지 않습니다.';
        } catch (error) { status.textContent = `저장 요청 실패: ${error.message}`; }
        finally { button.disabled = false; }
      });
      row.append(label, button); list.append(row);
    }
    status.textContent = seen.size ? `${seen.size}개 영상을 찾았습니다.` : '저장 가능한 영상을 찾지 못했습니다. 강의를 재생하고 다시 시도하세요. 암호화 스트림은 지원하지 않습니다.';
  } catch (error) { status.textContent = error.message; }
  finally { scan.disabled = false; }
});
