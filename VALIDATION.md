# Verification (2026-10-13)

- Built Windows x64 HanyangDownloader.exe from backend/server.cjs with @yao-pkg/pkg 6.23.0 using Node 24.19.0 build host and node22-win-x64 target.
- Executed the produced EXE on Windows and called its actual local download API.
- lec09_design_physical: MP4 1,097,506,635 bytes, MP3 53,942,492 bytes; complete MP3 decode passed. Audio duration 01:39:29.53.
- lec11_execution_relational_algebra2: MP4 414,312,684 bytes, MP3 26,958,584 bytes; complete MP3 decode passed. Audio duration 00:49:49.06. Audio track duration can differ from the video duration.
- Same known media URL without Referer returned HTTP 403 text/plain. With the authorized Hanyang player Referer it returned HTTP 206 video/mp4 for the initial range check; full backend downloads passed HTTP, MIME, length, and ftyp checks.
- Actual API rejected missing connection code (401), unrelated web origin (403), and three disallowed URL cases (400).
- JavaScript syntax and git diff whitespace checks passed.
- A timing-dependent concurrency probe ran after the first job had finished and legitimately started a second job. Its duplicate output was removed. Concurrent rejection has NOT been verified by a live overlapping test.
- Chrome extension 0.5.0 installation, pairing and UI download initiation have NOT yet been verified in Chrome. These require reloading the installed extension. EXE/API success is not an end-to-end Chrome claim.
- Source and binaries contain no user passwords, cookies or connection codes. Lecture files are local deliverables only and are not committed to GitHub.

## 0.5.1 verification (2026-10-22)
- Added exactly the observed contents14 path alongside contents_new; host and media constraints remain enforced.
- Six URL regression checks passed: both supported paths accepted; an unobserved path, deceptive hostname, HTTP URL and text extension rejected.
- Built and executed the actual 0.5.1 Windows EXE. Used HANYANG_PORT=52025 to avoid interfering with the user's default instance; production default remains 52022.
- Downloaded the requested Algorithm course item 8580873 (2. getting started) through the EXE's authenticated API. MP4 size: 573,415,315 bytes; MP3 size: 41,321,513 bytes. Backend state complete.
- Entire generated MP3 decoded with FFmpeg without errors. Syntax and whitespace checks passed.
- Existing extension payload/API is unchanged. Chrome popup initiation was not repeated; the reported backend rejection and resulting full download/conversion were verified directly with the new EXE.
