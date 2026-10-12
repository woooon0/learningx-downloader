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
