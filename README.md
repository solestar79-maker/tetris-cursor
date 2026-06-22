# 테트리스 (교육용)

HTML, CSS, JavaScript만 사용하는 브라우저 테트리스 게임입니다.  
빌드 도구나 외부 라이브러리 없이 바로 실행할 수 있으며, 입문자가 게임 로직과 화면 렌더링을 단계별로 학습하기 위한 프로젝트입니다.

## 실행 방법

### 로컬에서 실행

1. 이 저장소를 클론하거나 폴더를 연다.
2. `index.html`을 더블 클릭하거나 브라우저로 드래그한다.

또는 VS Code / Cursor에서 **Live Server** 확장을 사용할 수 있다.

```
index.html 우클릭 → Open with Live Server
```

별도의 설치·빌드·번들링은 필요하지 않다.

### 온라인에서 실행

GitHub Pages로 배포한 경우, 저장소의 **Pages URL**에서 바로 플레이할 수 있다. (아래 [GitHub Pages 배포 방법](#github-pages-배포-방법) 참고)

## 조작법

게임 **시작** 후 키보드로 조작한다.

| 키 | 동작 |
|----|------|
| `←` (ArrowLeft) | 왼쪽 이동 |
| `→` (ArrowRight) | 오른쪽 이동 |
| `↓` (ArrowDown) | 한 칸 빠르게 내리기 (soft drop) |
| `↑` (ArrowUp) | 시계 방향 90° 회전 |
| `Space` | 즉시 낙하 (hard drop) |

- 충돌이 발생하는 이동·회전은 적용되지 않는다.
- **재시작** 버튼은 게임 진행 중 또는 게임 오버 후에 사용할 수 있다.

## 구현 기능

| 기능 | 설명 |
|------|------|
| 게임 보드 | 10열 × 20행 CSS Grid |
| 블록 | I, O, T, S, Z, J, L 7종 |
| 자동 낙하 | 약 0.8초 간격 |
| 키보드 조작 | 이동, 회전, soft/hard drop |
| 충돌 판정 | 벽·바닥·고정 블록 |
| 줄 삭제 | 가득 찬 행 제거 후 위 블록 하강 |
| 점수 | 줄 삭제 수에 따라 가산 |
| 게임 오버 | 새 블록 스폰 불가 시 종료 |
| 재시작 | 보드·점수·타이머·상태 초기화 |

### 점수 규칙

| 삭제 줄 수 | 점수 |
|-----------|------|
| 1줄 | 100 |
| 2줄 | 300 |
| 3줄 | 500 |
| 4줄 | 800 |

## 품질 점검 방법

배포 전 아래 순서로 수동 점검한다.

1. **로컬 실행** — `index.html`을 열어 보드·점수·상태 UI가 보이는지 확인한다.
2. **시작 / 재시작** — idle에서 시작, 진행 중·게임 오버 후 재시작이 동작하는지 확인한다.
3. **자동 낙하** — 키 입력 없이 블록이 아래로 내려가는지 확인한다.
4. **키보드** — ← → ↓ ↑ Space가 각각 동작하는지 확인한다.
5. **줄 삭제·점수** — 한 줄을 채워 삭제 후 점수가 오르는지 확인한다.
6. **게임 오버** — 상단까지 쌓았을 때 「게임 오버」 표시와 조작 비활성화를 확인한다.
7. **콘솔** — 브라우저 개발자 도구(F12) → Console에 빨간 에러가 없는지 확인한다.
8. **GitHub Pages** (배포 후) — Pages URL에서 CSS·JS가 로드되고 게임이 동일하게 동작하는지 확인한다.

프로젝트에 포함된 Cursor 커맨드(`/code-review`, `/qa-playtest` 등)로 코드·로직 리뷰를 보조할 수 있다.

## GitHub Pages 배포 방법

### 사전 조건

- GitHub 계정
- 이 프로젝트가 GitHub 저장소에 push되어 있어야 한다.

### 1. 저장소 초기화 및 push (최초 1회)

```bash
git init
git add index.html style.css script.js README.md
git commit -m "feat: 테트리스 게임 초기 배포"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

### 2. GitHub Pages 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: `main` / Folder: **`/ (root)`**
4. **Save**

몇 분 후 `https://<사용자명>.github.io/<저장소명>/` 에서 접속할 수 있다.

### 배포 시 참고

- `index.html`, `style.css`, `script.js`는 **저장소 루트**에 있어야 한다.
- 상대 경로(`style.css`, `script.js`)를 사용하므로 별도 base URL 설정이 필요 없다.
- Private 저장소는 GitHub Free 플랜에서 Pages 제한이 있을 수 있다. (계정·플랜 정책 확인)

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 게임 화면 구조 |
| `style.css` | 스타일 |
| `script.js` | 게임 로직 및 렌더링 |
| `.cursor/commands/` | Cursor 에이전트용 리뷰·QA 커맨드 (배포 불필요, 선택) |

## 아직 구현되지 않은 기능

- 다음 블록 미리보기
- 일시정지
- 모바일 터치 조작
