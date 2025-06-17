# 💼 Business  
**SW AI 비즈니스 응용 설계를 위한 Repository**
이성현(2020114010)의 작업물

## 📌 DoClick 사용 가이드

---

### 📥 Github Repository 클론하기

```bash
git clone https://github.com/RomanticBox/business
```

## 🔐 API Key 설정
1. Google Cloud Console 접속
2. API 및 서비스 > + 사용자 인증 정보 만들기 > API 키 생성
3. API 및 서비스 > 사용자 인증 정보 > 생성된 API 키 클릭
4. 아래와 같이 설정:
   애플리케이션 제한사항: 없음
   API 제한사항: 키 제한 → Gmail API
7. 키 표시 클릭 후 복사
8. .env.local 파일에 추가:
```env
API_KEY=여기에_복사한_API_키_입력
```

## 🔑 OAuth 2.0 클라이언트 ID 설정
1. API 및 서비스 > 사용자 인증 정보 > + 사용자 인증 정보 만들기 > OAuth 클라이언트 ID 만들기
2. 애플리케이션 유형: 웹 애플리케이션
3. 이름 입력
4. 승인된 JavaScript 원본 추가:
```cpp
http://localhost:8000
http://127.0.0.1:8000
(도메인 주소도 함께 입력)
```
5. 승인된 리디렉션 URI 추가:
```cpp
http://localhost:8000
http://127.0.0.1:8000
(도메인 주소도 함께 입력)
```
6. '만들기' 버튼 누르
7. API 및 서비스 > 사용자 인증 정보 > OAuth 2.0 클라이언트 ID에서 '클라이언트 ID' 복사
8. env.local의 CLIENT_ID에 붙여넣기
```env
CLIENT_ID=여기에_복사한_Client_ID_입력
```

## ✅ 사용 가능한 주요 기능
1. 기본 정보 입력 및 반영
2. 행정실 이메일 확인
3. 체크리스트를 통한 업무 관련 정보 확인
4. 이메일 포워딩
