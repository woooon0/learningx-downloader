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
          await api('/download', {url: video.url, title, format: document.querySelector('#format').value});
          await refreshStatus();
        } catch (error) { status.textContent = `저장 요청 실패: ${error.message}`; }
        finally { button.disabled = false; }
      });
      row.append(label, button); list.append(row);
    }
    status.textContent = seen.size ? `${seen.size}개 영상을 찾았습니다.` : '저장 가능한 영상을 찾지 못했습니다. 강의를 재생하고 다시 시도하세요. 암호화 스트림은 지원하지 않습니다.';
  } catch (error) { status.textContent = error.message; }
  finally { scan.disabled = false; }
});

const connection = document.querySelector('#connection');
async function api(route, body) {
  const code = connection.value.trim();
  if (!code) throw new Error('다운로더 EXE에 표시된 연결 코드를 입력하세요.');
  const response = await fetch('http://127.0.0.1:52022' + route, {
    method: body ? 'POST' : 'GET',
    headers: {Authorization: 'Bearer ' + code, ...(body ? {'Content-Type':'application/json'} : {})},
    ...(body ? {body: JSON.stringify(body)} : {})
  }).catch(() => { throw new Error('다운로더 EXE를 먼저 실행하세요.'); });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '다운로드 요청 실패');
  await chrome.storage.local.set({connectionCode: code});
  return data;
}
async function refreshStatus() {
  const {job} = await api('/status');
  const output = document.querySelector('#progress');
  if (!job) { output.textContent = '다운로더 연결 완료'; return; }
  if (job.state === 'complete') output.textContent = '저장 완료: ' + (job.audio || job.video);
  else if (job.state === 'failed') output.textContent = '실패: ' + job.error + (job.video ? ' / 원본 영상: ' + job.video : '');
  else if (job.state === 'converting') output.textContent = 'MP3 변환 중…';
  else output.textContent = '다운로드 중: ' + (job.total ? Math.floor(job.bytes / job.total * 100) + '%' : Math.floor(job.bytes / 1048576) + ' MB');
}
document.querySelector('#connect').addEventListener('click', () => refreshStatus().catch(e => {document.querySelector('#progress').textContent = e.message;}));
chrome.storage.local.get('connectionCode').then(data => { connection.value = data.connectionCode || ''; if (connection.value) refreshStatus().catch(() => {}); });
setInterval(() => { if (connection.value.trim()) refreshStatus().catch(() => {}); }, 1500);
