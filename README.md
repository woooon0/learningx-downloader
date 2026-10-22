# Hanyang LearningX Downloader 0.5.1

한양대학교 LearningX 강의의 MP4 및 MP3 저장 도구입니다. 학교 공식 프로그램이 아닙니다.

## 0.5.1 수정
`contents14`에 저장된 기존 강의를 지원합니다. `Unsupported Hanyang media URL`이 발생했던 알고리즘 강의의 주소 검사 문제를 수정했습니다. 기존 0.5.0 사용자는 실행 중인 다운로더를 종료하고 EXE를 교체한 뒤 새 연결 코드를 입력하세요. 기존 확장 0.5.0과도 호환됩니다.

## 필수 구성
- Chrome 확장 프로그램
- HanyangDownloader.exe: 실제 다운로드 담당. 다운로드 중 계속 실행해야 합니다.
- MP3 변환 시 EXE 옆의 ffmpeg.exe

## 사용법
1. 기존 0.4.0 확장을 이 버전으로 교체하고 확장 관리 화면에서 새로고침합니다. 처음 설치할 때는 개발자 모드의 압축해제된 확장 프로그램 로드로 extension 폴더를 선택합니다.
2. HanyangDownloader.exe를 실행합니다. 표시되는 Connection code를 확장의 연결 코드에 입력하고 연결 확인을 누릅니다. EXE를 다시 실행하면 새 코드가 필요합니다.
3. 한양대 사이트에서 본인 계정으로 접근 가능한 강의를 재생합니다.
4. 확장에서 MP4 또는 MP3를 선택하고 영상 찾기, 파일 저장을 누릅니다.
5. 확장의 저장 완료 표시를 확인합니다. 파일은 EXE 옆 downloads 폴더에 저장됩니다. MP3 선택 시 원본 MP4도 보관합니다.

팝업을 닫아도 EXE의 다운로드는 계속됩니다. 다시 팝업을 열면 진행 상태를 확인할 수 있습니다. 한 번에 하나만 다운로드하며 진행 중 다른 요청은 거부합니다.

## 동작과 제한
정상 플레이어에서 관찰된 영상 URL과 강의 제목을 로컬 EXE에 전달합니다. EXE는 원본 프로젝트처럼 한양대 플레이어 출처 Referer를 포함합니다. 서버의 HTTP 상태, video/mp4 형식, 파일 길이와 MP4 헤더를 확인한 뒤 완료로 처리합니다. MP3는 FFmpeg 종료 성공 후 완성 파일로 전환합니다. 실패한 임시 파일은 제거하고 실패 이유를 표시합니다.

현재 확인한 hanyang-cms-object.edge.naverncp.com의 contents_new/hanyang101 및 contents14/hanyang101 MP4만 지원합니다. 인증이나 DRM을 해제하지 않으며 출석 상태를 조작하지 않습니다. 허용되지 않은 URL로의 전환도 자동으로 따라가지 않습니다.

EXE는 127.0.0.1:52022에서만 수신하고 실행마다 생성한 연결 코드로 요청을 인증합니다. 로그인 비밀번호나 브라우저 쿠키를 수집하지 않습니다.

## 소스 실행과 빌드
Node.js 22 이상에서 npm install 후 npm start로 실행합니다. npm run build:exe로 Windows x64 EXE를 만듭니다. MP3 변환은 backend 폴더(소스 실행) 또는 EXE 옆에 ffmpeg.exe가 필요합니다.

검증 상태는 VALIDATION.md를 확인하세요. Chrome에 설치된 확장 전체 동작은 별도로 확인해야 합니다.

## 출처
포크 원본: https://github.com/mechaminu/learningx-downloader
초기 프로젝트: https://github.com/zinirun/LMSDownloader
다운로드 구조 참고: https://github.com/mechaminu/learningx-backend
원본 LICENSE는 보존했습니다. 원본의 저작권 고지와 MIT 문구가 함께 있으므로 별도 재배포 시 원저작자 조건을 확인하세요.
FFmpeg 배포 출처: imageio-ffmpeg 0.6.0의 Windows FFmpeg 7.1 바이너리. https://github.com/imageio/imageio-ffmpeg 및 https://github.com/BtbN/FFmpeg-Builds 를 참조하세요. 배포물의 FFMPEG-LICENSE.txt도 함께 확인하세요.
