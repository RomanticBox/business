# Gmail API 연동 설정 가이드

Do Click 시스템에 Gmail API를 연동하여 행정실 이메일을 자동으로 모니터링하는 기능을 설정하는 방법입니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: `Do Click-gmail-integration` (예시)

### 1.2 Gmail API 활성화
1. 좌측 메뉴 → `API 및 서비스` → `라이브러리`
2. "Gmail API" 검색 후 선택
3. `사용` 버튼 클릭

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. 좌측 메뉴 → `API 및 서비스` → `사용자 인증 정보`
2. `+ 사용자 인증 정보 만들기` → `OAuth 클라이언트 ID`
3. 애플리케이션 유형: `웹 애플리케이션`
4. 이름: `Do Click Gmail Client`
5. 승인된 JavaScript 원본에 도메인 추가:
   - `http://localhost:3000` (개발용)
   - `https://yourdomain.com` (실제 도메인)
6. 승인된 리디렉션 URI:
   - `http://localhost:3000` (개발용)
   - `https://yourdomain.com` (실제 도메인)

### 1.4 API 키 생성
1. `+ 사용자 인증 정보 만들기` → `API 키`
2. API 키 제한 설정:
   - 애플리케이션 제한사항: `HTTP 리퍼러(웹사이트)`
   - 웹사이트 제한사항에 도메인 추가
   - API 제한사항: `Gmail API` 선택

## 2. 코드 설정

### 2.1 API 키 설정
`js/gmail-api.js` 파일의 `GOOGLE_CONFIG` 객체를 수정:

```javascript
const GOOGLE_CONFIG = {
    CLIENT_ID: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
    API_KEY: 'AIzaSyABC123def456GHI789jklmnop',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    SCOPES: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'
};
```

### 2.2 행정실 이메일 도메인 설정
`js/email-monitor.js` 파일의 `ADMIN_EMAIL_DOMAINS` 배열에 대학교 행정실 도메인 추가:

```javascript
const ADMIN_EMAIL_DOMAINS = [
    'admin.yonsei.ac.kr',
    'eng.yonsei.ac.kr',
    'cs.yonsei.ac.kr',
    // 추가 도메인들...
];
```

## 3. 사용 방법

### 3.1 Gmail 연동
1. 웹사이트 접속 후 사용자 정보 입력 완료
2. Gmail 연동 섹션에서 "Google 계정으로 로그인" 버튼 클릭
3. Google OAuth 팝업에서 권한 허용
4. Gmail 연동 완료 확인

### 3.2 자동 모니터링
- Gmail 연동 후 자동으로 이메일 모니터링 시작
- 5분마다 새로운 행정실 이메일 확인
- 새 업무 발견 시 체크리스트에 자동 추가
- 긴급 업무는 즉시 알림 표시

## 4. 문제 해결

### 4.1 API 키 오류
브라우저 콘솔에 `⚠️ Google API 키가 설정되지 않았습니다.` 메시지가 나타나면:
- `js/gmail-api.js`의 `GOOGLE_CONFIG` 확인
- 실제 API 키로 교체했는지 확인

### 4.2 OAuth 오류
`❌ Gmail 인증 실패: popup_blocked` 오류 시:
- 브라우저 팝업 차단 해제
- 시크릿 모드에서 테스트

---

더 자세한 설정 방법은 [Google Gmail API 문서](https://developers.google.com/gmail/api/quickstart/js)를 참고하세요. 