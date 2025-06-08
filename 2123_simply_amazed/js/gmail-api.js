// Gmail API 관련 기능

// ⚠️ 중요: 아래 값들을 실제 Google API 키로 교체해주세요
// Google Cloud Console (https://console.cloud.google.com)에서 프로젝트 생성 후 발급받으세요
const GOOGLE_CONFIG = {
    // CLIENT_ID: '',
    CLIENT_ID: '96805366744-nb6s5bh1089o5vh3020in2kv3atq92ug.apps.googleusercontent.com', // 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
    API_KEY: 'AIzaSyDCpc31NCAT5cagX4H9U1tErHgi1-Eyh_U',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    SCOPES: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'
};

// 행정사무실 이메일 설정
const ADMIN_EMAIL = 'ysadms@yonsei.ac.kr';
const ADMIN_EMAIL_DOMAINS = [
    'yonsei.ac.kr',
    'admin.yonsei.ac.kr',
    'eng.yonsei.ac.kr',
    'cs.yonsei.ac.kr'
];

// Gmail 연동 상태
let gmailAuth = {
    isGapiLoaded: false,
    isGisLoaded: false,
    isAuthorized: false,
    tokenClient: null,
    userProfile: null
};

// Gmail API 초기화
function initializeGapi() {
    console.log('📧 Gmail API 초기화 시작...');
    
    // API 키 설정 확인
    if (GOOGLE_CONFIG.CLIENT_ID === '' || 
        GOOGLE_CONFIG.API_KEY === 'AIzaSyDCpc31NCAT5cagX4H9U1tErHgi1-Eyh_U') {
        console.warn('⚠️ Google API 키가 설정되지 않았습니다.');
        showGmailSetupGuide();
        return;
    }
    
    if (typeof gapi !== 'undefined') {
        gapi.load('client', initializeGapiClient);
    } else {
        console.error('❌ Google API 스크립트가 로드되지 않았습니다.');
    }
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_CONFIG.API_KEY,
            discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
        });
        gmailAuth.isGapiLoaded = true;
        console.log('✅ GAPI 클라이언트 초기화 완료');
        checkGmailAPIReady();
    } catch (error) {
        console.error('❌ GAPI 초기화 실패:', error);
    }
}

function initializeGis() {
    try {
        if (typeof google !== 'undefined' && google.accounts) {
            gmailAuth.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CONFIG.CLIENT_ID,
                scope: GOOGLE_CONFIG.SCOPES,
                callback: handleGmailAuthResponse,
            });
            gmailAuth.isGisLoaded = true;
            console.log('✅ GIS 초기화 완료');
            checkGmailAPIReady();
        } else {
            console.error('❌ Google Identity Services가 로드되지 않았습니다.');
        }
    } catch (error) {
        console.error('❌ GIS 초기화 실패:', error);
    }
}

// API 준비 상태 확인
function checkGmailAPIReady() {
    if (gmailAuth.isGapiLoaded && gmailAuth.isGisLoaded) {
        console.log('🎉 Gmail API 준비 완료!');
        
        // 기존 토큰 확인
        const savedToken = localStorage.getItem('gmail_access_token');
        if (savedToken) {
            gapi.client.setToken({ access_token: savedToken });
            verifyGmailToken();
        }
        
        // Gmail 연동 버튼 활성화
        enableGmailLoginButton();
    }
}

// Gmail 인증 응답 처리
function handleGmailAuthResponse(response) {
    if (response.error !== undefined) {
        console.error('❌ Gmail 인증 실패:', response.error);
        showGmailAuthError(response.error);
        return;
    }
    
    console.log('✅ Gmail 인증 성공');
    
    // 토큰 저장
    localStorage.setItem('gmail_access_token', response.access_token);
    gapi.client.setToken(response);
    
    gmailAuth.isAuthorized = true;
    
    // 사용자 프로필 정보 가져오기
    getUserProfile().then(() => {
        onGmailAuthorized();
    });
}

// 사용자 프로필 정보 가져오기
async function getUserProfile() {
    try {
        const response = await gapi.client.gmail.users.getProfile({
            userId: 'me'
        });
        
        gmailAuth.userProfile = {
            emailAddress: response.result.emailAddress,
            messagesTotal: response.result.messagesTotal,
            threadsTotal: response.result.threadsTotal
        };
        
        console.log('👤 Gmail 프로필 정보:', gmailAuth.userProfile);
        return gmailAuth.userProfile;
        
    } catch (error) {
        console.error('❌ 프로필 정보 가져오기 실패:', error);
        return null;
    }
}

// Gmail 토큰 유효성 검증
async function verifyGmailToken() {
    try {
        await gapi.client.gmail.users.getProfile({
            userId: 'me'
        });
        
        gmailAuth.isAuthorized = true;
        console.log('✅ 기존 Gmail 토큰 유효함');
        onGmailAuthorized();
        
    } catch (error) {
        console.log('🔄 Gmail 토큰 만료됨, 재인증 필요');
        localStorage.removeItem('gmail_access_token');
        gmailAuth.isAuthorized = false;
    }
}

// Gmail 로그인 요청
function requestGmailLogin() {
    console.log('📧 Gmail 로그인 요청...');
    
    if (!gmailAuth.tokenClient) {
        console.error('❌ Gmail API가 초기화되지 않았습니다.');
        return;
    }
    
    // 기존 토큰이 있으면 갱신, 없으면 새로 인증
    if (gapi.client.getToken() === null) {
        gmailAuth.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        gmailAuth.tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Gmail 로그아웃
function logoutGmail() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    
    localStorage.removeItem('gmail_access_token');
    gmailAuth.isAuthorized = false;
    gmailAuth.userProfile = null;
    
    console.log('📧 Gmail 로그아웃 완료');
    updateGmailLoginButton();
}

// Gmail 인증 완료 처리
function onGmailAuthorized() {
    console.log('🎉 Gmail 연동 완료!');
    
    // UI 업데이트
    updateGmailLoginButton();
    showGmailConnectedStatus();
    
    // 이메일 모니터링 시작
    if (typeof startEmailMonitoring === 'function') {
        startEmailMonitoring();
    }
    
    // 성공 알림
    showInlineNotification('Gmail 연동이 완료되었습니다! 이제 ysadms@yonsei.ac.kr에서 오는 행정업무를 자동으로 모니터링합니다.', 'success');
}

// Gmail 설정 가이드 표시
function showGmailSetupGuide() {
    console.log('📖 Gmail API 설정 가이드 표시');
    
    const guide = `
    📧 Gmail API 설정 방법:
    
    1. Google Cloud Console (https://console.cloud.google.com) 접속
    2. 새 프로젝트 생성 또는 기존 프로젝트 선택
    3. Gmail API 활성화
    4. 사용자 인증 정보 생성 (OAuth 2.0 클라이언트 ID)
    5. 승인된 JavaScript 원본에 도메인 추가
    6. API 키 생성
    7. gmail-api.js 파일의 GOOGLE_CONFIG 값들 교체
    
    자세한 가이드: https://developers.google.com/gmail/api/quickstart/js
    `;
    
    console.log(guide);
}

// 인라인 알림 표시
function showInlineNotification(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    
    const notification = `
        <div class="alert ${alertClass} gmail-notification" style="position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
            <button type="button" class="close" onclick="$(this).parent().remove()">
                <span>&times;</span>
            </button>
        </div>
    `;
    
    $('body').append(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        $('.gmail-notification').fadeOut();
    }, 5000);
}

// Gmail 로그인 버튼 활성화
function enableGmailLoginButton() {
    if ($('#gmail-login-section').length === 0) {
        addGmailLoginSection();
    }
    
    $('#gmail-login-btn').prop('disabled', false);
    updateGmailLoginButton();
}

// Gmail 로그인 섹션 추가
function addGmailLoginSection() {
    const gmailSection = `
        <div id="gmail-login-section" class="section" style="background-color: #f8f9fa; padding: 60px 0; border-bottom: 1px solid #e9ecef;">
            <div class="container">
                <div class="title text-center mb-4">
                    <h2><i class="fab fa-google mr-3"></i>Gmail 연동</h2>
                    <p>Google 계정을 연결하여 ysadms@yonsei.ac.kr에서 오는 행정업무를 자동으로 모니터링하세요</p>
                </div>
                
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card shadow">
                            <div class="card-body text-center p-5">
                                <div id="gmail-status" class="mb-4">
                                    <div class="alert alert-warning">
                                        <i class="fas fa-unlink mr-2"></i>
                                        <span>Gmail 연결되지 않음</span>
                                    </div>
                                </div>
                                
                                <div class="gmail-actions mb-4">
                                    <button id="gmail-login-btn" class="btn btn-primary btn-lg mr-3" onclick="requestGmailLogin()" disabled>
                                        <i class="fab fa-google mr-2"></i>Google 계정으로 로그인
                                    </button>
                                    
                                    <button id="gmail-logout-btn" class="btn btn-outline-secondary" onclick="logoutGmail()" style="display: none;">
                                        <i class="fas fa-sign-out-alt mr-2"></i>연결 해제
                                    </button>
                                </div>
                                
                                <div id="gmail-profile" class="alert alert-info" style="display: none;">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <i class="fas fa-user-circle fa-2x mr-3"></i>
                                        <div class="text-left">
                                            <strong id="profile-email">-</strong><br>
                                            <small id="profile-stats">메시지: -개</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="gmail-features mt-4">
                                    <h6>연동 후 사용 가능한 기능:</h6>
                                    <div class="row text-left">
                                        <div class="col-md-6">
                                            <ul class="list-unstyled">
                                                <li><i class="fas fa-envelope-open-text text-primary mr-2"></i> ysadms@yonsei.ac.kr 이메일 자동 감지</li>
                                                <li><i class="fas fa-calendar-check text-primary mr-2"></i> 마감일 자동 추출</li>
                                            </ul>
                                        </div>
                                        <div class="col-md-6">
                                            <ul class="list-unstyled">
                                                <li><i class="fas fa-bell text-primary mr-2"></i> 긴급 업무 알림</li>
                                                <li><i class="fas fa-share text-primary mr-2"></i> 업무 포워딩</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 메인 콘텐츠의 체크리스트 섹션 앞에 추가
    $('#section-checklist').before(gmailSection);
}

// Gmail 로그인 버튼 상태 업데이트
function updateGmailLoginButton() {
    const loginBtn = $('#gmail-login-btn');
    const logoutBtn = $('#gmail-logout-btn');
    const status = $('#gmail-status');
    const profile = $('#gmail-profile');
    
    if (gmailAuth.isAuthorized) {
        // 연결됨 상태
        loginBtn.hide();
        logoutBtn.show();
        
        status.html(`
            <div class="alert alert-success">
                <i class="fas fa-check-circle mr-2"></i>
                <span>Gmail 연결됨 - ysadms@yonsei.ac.kr 모니터링 중</span>
            </div>
        `);
        
        if (gmailAuth.userProfile) {
            $('#profile-email').text(gmailAuth.userProfile.emailAddress);
            $('#profile-stats').text(`메시지: ${gmailAuth.userProfile.messagesTotal?.toLocaleString() || '-'}개`);
            profile.show();
        }
        
    } else {
        // 연결되지 않음 상태
        loginBtn.show();
        logoutBtn.hide();
        profile.hide();
        
        status.html(`
            <div class="alert alert-warning">
                <i class="fas fa-unlink mr-2"></i>
                <span>Gmail 연결되지 않음</span>
            </div>
        `);
    }
}

// Gmail 연결 상태 표시
function showGmailConnectedStatus() {
    updateGmailLoginButton();
    
    // 체크리스트에도 상태 표시
    if ($('#gmail-monitor-status').length === 0) {
        const statusBadge = `
            <div id="gmail-monitor-status" class="alert alert-success mt-3">
                <i class="fas fa-sync-alt fa-spin mr-2"></i>
                Gmail 모니터링 활성화됨 - ysadms@yonsei.ac.kr에서 오는 새로운 행정업무를 자동으로 감지합니다
            </div>
        `;
        $('.checklist-section .container .title').after(statusBadge);
    }
}

// Gmail 인증 오류 처리
function showGmailAuthError(error) {
    let errorMessage = 'Gmail 연동 중 오류가 발생했습니다.';
    
    switch (error) {
        case 'access_denied':
            errorMessage = 'Gmail 접근이 거부되었습니다. 권한을 허용해주세요.';
            break;
        case 'popup_blocked':
            errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
            break;
        default:
            errorMessage = `Gmail 연동 실패: ${error}`;
    }
    
    showInlineNotification(errorMessage, 'error');
} 