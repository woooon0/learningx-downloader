const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { spawn } = require('node:child_process');

const root = process.env.HANYANG_OUTPUT_DIR || path.join(process.pkg ? path.dirname(process.execPath) : __dirname, 'downloads');
const ffmpeg = process.env.HANYANG_FFMPEG || path.join(process.pkg ? path.dirname(process.execPath) : __dirname, 'ffmpeg.exe');
const token = crypto.randomBytes(24).toString('hex');
let job = null;
fs.mkdirSync(root, { recursive: true });
function send(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
function validURL(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.hostname !== 'hanyang-cms-object.edge.naverncp.com' || url.port || url.username || url.password ||
      !/^\/contents_new\/hanyang101\/[a-zA-Z0-9]+\/contents\/media_files\/[^/]+\.mp4$/.test(url.pathname)) throw new Error('Unsupported Hanyang media URL');
  return url;
}
function title(raw) {
  const text = String(raw || 'lecture').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 100).replace(/[. ]+$/g, '');
  return '_' + (text || 'lecture');
}
async function run(current, url, name, format) {
  const base = path.join(root, `${title(name)}_${current.id}`);
  const partial = base + '.mp4.part';
  try {
    const response = await new Promise((resolve, reject) => {
      const request = https.get(url, { headers: { Referer: 'https://hycms.hanyang.ac.kr/' } }, resolve);
      request.setTimeout(60000, () => request.destroy(new Error('Download stalled')));
      request.on('error', reject);
    });
    if (response.statusCode !== 200 || !/^video\/mp4(?:;|$)/i.test(response.headers['content-type'] || '')) {
      response.resume(); throw new Error(`Server refused video: HTTP ${response.statusCode}, ${response.headers['content-type'] || 'unknown type'}`);
    }
    current.total = Number(response.headers['content-length']) || 0;
    response.on('data', chunk => { current.bytes += chunk.length; });
    await pipeline(response, fs.createWriteStream(partial, { flags: 'wx' }));
    if (!current.bytes || (current.total && current.total !== current.bytes)) throw new Error('Incomplete download');
    const handle = await fs.promises.open(partial, 'r');
    const header = Buffer.alloc(12);
    try { await handle.read(header, 0, 12, 0); } finally { await handle.close(); }
    if (header.toString('ascii', 4, 8) !== 'ftyp') throw new Error('Response is not an MP4 file');
    await fs.promises.rename(partial, base + '.mp4');
    current.video = base + '.mp4';
    if (format === 'mp3') {
      current.state = 'converting';
      await new Promise((resolve, reject) => {
        const child = spawn(ffmpeg, ['-nostdin', '-v', 'error', '-n', '-i', current.video, '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-q:a', '2', '-f', 'mp3', base + '.mp3.part'], { windowsHide: true });
        let errors = '';
        child.stderr.on('data', b => { errors = (errors + b).slice(-2000); });
        child.on('error', reject);
        child.on('close', code => code === 0 ? resolve() : reject(new Error(errors || `Audio conversion failed (${code})`)));
      });
      await fs.promises.rename(base + '.mp3.part', base + '.mp3');
      current.audio = base + '.mp3';
    }
    current.state = 'complete';
  } catch (error) {
    current.state = 'failed'; current.error = error.message;
    await fs.promises.rm(partial, { force: true });
    await fs.promises.rm(base + '.mp3.part', { force: true });
  }
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !/^chrome-extension:\/\/[a-p]{32}$/.test(origin)) return send(res, 403, { error: 'Extension origin required' });
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.headers.authorization !== `Bearer ${token}`) return send(res, 401, { error: 'Enter the connection code shown by the downloader' });
  if (req.method === 'GET' && req.url === '/status') return send(res, 200, { job });
  if (req.method !== 'POST' || req.url !== '/download') return send(res, 404, { error: 'Not found' });
  if (job && ['downloading', 'converting'].includes(job.state)) return send(res, 409, { error: 'Another download is in progress' });
  try {
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 8192) throw new Error('Request too large'); }
    const data = JSON.parse(body);
    const url = validURL(data.url);
    if (!['mp4', 'mp3'].includes(data.format)) throw new Error('Choose MP4 or MP3');
    if (data.format === 'mp3' && !fs.existsSync(ffmpeg)) throw new Error('ffmpeg.exe is missing beside the downloader');
    // Recheck after reading the body: two requests may have arrived together.
    if (job && ['downloading', 'converting'].includes(job.state)) return send(res, 409, { error: 'Another download is in progress' });
    job = { id: crypto.randomBytes(6).toString('hex'), state: 'downloading', bytes: 0, total: 0 };
    send(res, 202, { job });
    void run(job, url, data.title, data.format);
  } catch (error) { send(res, 400, { error: error.message }); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(52022, '127.0.0.1', () => {
  console.log('Hanyang LearningX Downloader');
  console.log(`Connection code: ${token}`);
  console.log(`Output folder: ${root}`);
  console.log('Keep this program running while downloading.');
});
