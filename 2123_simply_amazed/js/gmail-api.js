// Gmail API 관련 기능

// 즉시 실행되는 초기 로그
console.log('📧 Gmail API 스크립트 로드됨 - 시작');

// ⚠️ 중요: 아래 값들을 실제 Google API 키로 교체해주세요
// Google Cloud Console (https://console.cloud.google.com)에서 프로젝트 생성 후 발급받으세요
const GOOGLE_CONFIG = {
    CLIENT_ID: window.GOOGLE_ENV?.CLIENT_ID,
    API_KEY: window.GOOGLE_ENV?.API_KEY,
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
    SCOPES: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'
};

console.log('🔧 API 설정 로드됨:', {
    CLIENT_ID: GOOGLE_CONFIG.CLIENT_ID ? GOOGLE_CONFIG.CLIENT_ID.substring(0, 20) + '...' : 'Not Set',
    API_KEY: GOOGLE_CONFIG.API_KEY ? GOOGLE_CONFIG.API_KEY.substring(0, 10) + '...' : 'Not Set'
});

// 행정사무실 이메일 설정
const ADMIN_EMAIL = 'computing@yonsei.ac.kr';
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

// 전역 상태 변수들 (window 객체에 할당하여 안전하게 접근)
window.gapiInitialized = false;
window.gisInitialized = false;
window.tokenClient = null;
window.isAuthenticated = false;
window.isDemoMode = false; // 기본값을 false로 설정
window.GOOGLE_CONFIG = GOOGLE_CONFIG; // GOOGLE_CONFIG도 window에 할당

// 편의를 위한 지역 변수 (하위 호환성)
let gapiInitialized = window.gapiInitialized;
let gisInitialized = window.gisInitialized;
let tokenClient = window.tokenClient;
let isAuthenticated = window.isAuthenticated;
let isDemoMode = window.isDemoMode;

console.log('📊 초기 상태 설정 완료:', {
    gapiInitialized: window.gapiInitialized,
    gisInitialized: window.gisInitialized,
    isAuthenticated: window.isAuthenticated,
    isDemoMode: window.isDemoMode
});

// ===========================================
// 브라우저 콘솔용 디버깅 함수들 (즉시 사용 가능)
// ===========================================

// 콘솔에서 직접 테스트할 수 있는 함수들
window.gmailDebug = {
    // Gmail API 상태 확인
    checkStatus: function() {
        console.log('=== Gmail API 상태 ===');
        console.log('스크립트 로드됨: Gmail API JS');
        console.log('데모 모드:', window.isDemoMode);
        console.log('GAPI 초기화:', window.gapiInitialized);
        console.log('GIS 초기화:', window.gisInitialized);
        console.log('인증 상태:', window.isAuthenticated);
        console.log('Google APIs 로드 상태:', {
            gapi: typeof gapi !== 'undefined',
            google: typeof google !== 'undefined'
        });
        console.log('API 키 설정:', {
            CLIENT_ID: window.GOOGLE_CONFIG?.CLIENT_ID ? 'Set' : 'Not Set',
            API_KEY: window.GOOGLE_CONFIG?.API_KEY ? 'Set' : 'Not Set'
        });
        console.log('토큰 클라이언트:', window.tokenClient ? 'Available' : 'Not Available');
        
        return {
            scriptLoaded: true,
            demoMode: window.isDemoMode,
            gapiReady: window.gapiInitialized,
            gisReady: window.gisInitialized,
            authenticated: window.isAuthenticated,
            googleApisLoaded: typeof gapi !== 'undefined' && typeof google !== 'undefined'
        };
    },
    
    // 강제 로그인 시도
    forceLogin: function() {
        console.log('=== 강제 Gmail 로그인 시도 ===');
        if (typeof requestGmailLogin === 'function') {
            requestGmailLogin(true); // 강제 모드로 실행
        } else {
            console.error('❌ requestGmailLogin 함수가 정의되지 않았습니다.');
        }
    },
    
    // 데모 모드 토글
    toggleDemo: function() {
        window.isDemoMode = !window.isDemoMode;
        console.log('데모 모드 변경:', window.isDemoMode);
        if (typeof updateGmailStatus === 'function') updateGmailStatus();
        if (typeof addGmailLoginSection === 'function') addGmailLoginSection();
        return window.isDemoMode;
    },
    
    // API 재초기화
    reinit: function() {
        console.log('=== Gmail API 재초기화 ===');
        window.gapiInitialized = false;
        window.gisInitialized = false;
        window.isAuthenticated = false;
        window.tokenClient = null;
        
        setTimeout(() => {
            if (typeof initializeGapi === 'function') initializeGapi();
            if (typeof initializeGis === 'function') initializeGis();
        }, 1000);
    },
    
    // 데모 로그인 시뮬레이션
    simulateLogin: function() {
        console.log('=== 데모 로그인 시뮬레이션 ===');
        window.isAuthenticated = true;
        window.isDemoMode = true;
        if (typeof onGmailAuthorized === 'function') {
            onGmailAuthorized();
        } else {
            console.log('✅ 데모 로그인 완료 (UI 업데이트 함수 대기 중)');
        }
    },
    
    // 로그인 버튼 강제 표시
    showLoginButton: function() {
        console.log('=== 로그인 버튼 강제 표시 ===');
        if (typeof addGmailLoginSection === 'function') {
            addGmailLoginSection();
        } else {
            console.error('❌ addGmailLoginSection 함수가 정의되지 않았습니다.');
        }
    },
    
    // Google API 스크립트 강제 로드
    loadGoogleScripts: function() {
        console.log('=== Google API 스크립트 강제 로드 ===');
        
        // GAPI 스크립트 확인
        if (typeof gapi === 'undefined') {
            console.log('📥 GAPI 스크립트 로드 중...');
            const script1 = document.createElement('script');
            script1.src = 'https://apis.google.com/js/api.js';
            script1.async = true;
            script1.defer = true;
            document.head.appendChild(script1);
        } else {
            console.log('✅ GAPI 이미 로드됨');
        }
        
        // Google Identity Services 스크립트 확인
        if (typeof google === 'undefined') {
            console.log('📥 Google Identity Services 스크립트 로드 중...');
            const script2 = document.createElement('script');
            script2.src = 'https://accounts.google.com/gsi/client';
            script2.async = true;
            script2.defer = true;
            document.head.appendChild(script2);
        } else {
            console.log('✅ Google Identity Services 이미 로드됨');
        }
    }
};

console.log('🔧 gmailDebug 객체 생성 완료!');

// 사용법 안내
console.log(`
🔧 Gmail 디버깅 함수 사용법:
- gmailDebug.checkStatus() : 현재 상태 확인
- gmailDebug.forceLogin() : 강제 로그인 시도
- gmailDebug.toggleDemo() : 데모 모드 토글
- gmailDebug.reinit() : API 재초기화  
- gmailDebug.simulateLogin() : 데모 로그인 시뮬레이션
- gmailDebug.showLoginButton() : 로그인 버튼 강제 표시
- gmailDebug.loadGoogleScripts() : Google API 스크립트 강제 로드
`);

// Google API 스크립트 로드 확인 및 대기
function waitForGoogleAPIs() {
    return new Promise((resolve) => {
        const checkAPIs = () => {
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                console.log('✅ Google API 스크립트 로드 완료');
                resolve();
            } else {
                console.log('⏳ Google API 스크립트 로드 대기 중...');
                setTimeout(checkAPIs, 500);
            }
        };
        checkAPIs();
    });
}

// Gmail API 초기화 (개선된 버전)
async function initializeGapi() {
    console.log('📧 Gmail API 초기화 시작...');
    
    try {
        // Google API 스크립트 로드 대기
        await waitForGoogleAPIs();
        
        // API 키 설정 확인 (실제 키가 있는지 확인) - 전역 변수 안전하게 접근
        const clientId = window.GOOGLE_CONFIG ? window.GOOGLE_CONFIG.CLIENT_ID : GOOGLE_CONFIG.CLIENT_ID;
        const apiKey = window.GOOGLE_CONFIG ? window.GOOGLE_CONFIG.API_KEY : GOOGLE_CONFIG.API_KEY;
        
        const hasRealClientId = clientId && 
                               clientId.includes('.apps.googleusercontent.com') &&
                               clientId.length > 50;
                               
        const hasRealApiKey = apiKey && 
                             apiKey.startsWith('AIza') &&
                             apiKey.length > 30;
        
        if (!hasRealClientId || !hasRealApiKey) {
            console.warn('⚠️ Google API 키가 올바르게 설정되지 않았습니다.');
            console.warn('💡 데모 모드로 전환합니다. 실제 Gmail 연동을 위해서는 Google Cloud Console에서 API 키를 발급받아 설정해주세요.');
            
            // 데모 모드 활성화
            window.isDemoMode = true;
            window.gapiInitialized = true; // 데모 모드에서는 초기화 완료로 처리
            if (typeof showGmailSetupGuide === 'function') showGmailSetupGuide();
            if (typeof updateGmailStatus === 'function') updateGmailStatus();
            return true; // 데모 모드에서는 성공으로 처리
        }
        
        console.log('🔑 실제 API 키 감지됨:', {
            clientId: clientId.substring(0, 20) + '...',
            apiKey: apiKey.substring(0, 10) + '...'
        });
        
        // 데모 모드 비활성화
        window.isDemoMode = false;
        
        // GAPI 초기화
        await gapi.load('client', initializeGapiClient);
        return true;
        
    } catch (error) {
        console.error('❌ Gmail API 초기화 실패:', error);
        console.warn('🔄 데모 모드로 전환합니다...');
        window.isDemoMode = true;
        window.gapiInitialized = true;
        if (typeof showGmailAuthError === 'function') showGmailAuthError(error);
        if (typeof updateGmailStatus === 'function') updateGmailStatus();
        return true; // 데모 모드로 폴백
    }
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_CONFIG.API_KEY,
            discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
        });
        
        gapiInitialized = true;
        console.log('✅ GAPI 클라이언트 초기화 완료');
        updateGmailStatus();
        return true;
    } catch (error) {
        console.error('❌ GAPI 클라이언트 초기화 실패:', error);
        gapiInitialized = false;
        showGmailAuthError(error);
        return false;
    }
}

// Google Identity Services 초기화 (개선된 버전)
async function initializeGis() {
    console.log('🔐 Google Identity Services 초기화 시작...');
    
    try {
        // 데모 모드에서는 가상 초기화
        if (isDemoMode) {
            gisInitialized = true;
            console.log('✅ Google Identity Services 초기화 완료 (데모 모드)');
            updateGmailStatus();
            return true;
        }
        
        // Google API 스크립트 로드 대기
        await waitForGoogleAPIs();
        
        if (!google?.accounts?.oauth2) {
            throw new Error('Google Identity Services가 로드되지 않았습니다.');
        }
        
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CONFIG.CLIENT_ID,
            scope: GOOGLE_CONFIG.SCOPES,
            callback: handleGmailAuthResponse,
        });
        
        gisInitialized = true;
        console.log('✅ Google Identity Services 초기화 완료');
        updateGmailStatus();
        return true;
        
    } catch (error) {
        console.error('❌ Google Identity Services 초기화 실패:', error);
        gisInitialized = false;
        showGmailAuthError(error);
        return false;
    }
}

// Gmail API 준비 상태 확인 (강화된 버전)
function checkGmailAPIReady() {
    // 데모 모드에서는 항상 준비됨으로 처리
    if (isDemoMode) {
        console.log('🔍 Gmail API 준비 상태: 데모 모드 활성화됨');
        return true;
    }
    
    const ready = gapiInitialized && gisInitialized && tokenClient !== null;
    const apiStatus = {
        gapiInitialized,
        gisInitialized,
        tokenClient: tokenClient !== null,
        overall: ready
    };
    
    console.log('🔍 Gmail API 준비 상태:', apiStatus);
    
    // API가 준비되지 않았지만 Google 스크립트는 로드된 경우 자동 재초기화 시도
    if (!ready && typeof gapi !== 'undefined' && typeof google !== 'undefined') {
        console.log('⚠️ API 상태 불일치 감지, 자동 재초기화 시도...');
        
        // 중복 재초기화 방지
        if (!window.gmailAutoReinitializing) {
            window.gmailAutoReinitializing = true;
            
            setTimeout(async () => {
                try {
                    console.log('🔄 Gmail API 자동 재초기화 시작...');
                    
                    if (!gapiInitialized) {
                        await initializeGapi();
                    }
                    if (!gisInitialized) {
                        await initializeGis();
                    }
                    
                    console.log('✅ Gmail API 자동 재초기화 완료');
                    updateGmailStatus();
                    
                    // 재초기화 후에도 문제가 있으면 강제 로그인 시도
                    if (!isAuthenticated && checkGmailAPIReady()) {
                        console.log('🚀 자동 로그인 시도...');
                        setTimeout(() => {
                            if (typeof requestGmailLogin === 'function') {
                                requestGmailLogin();
                            }
                        }, 2000);
                    }
                    
                } catch (error) {
                    console.warn('⚠️ 자동 재초기화 실패:', error);
                } finally {
                    window.gmailAutoReinitializing = false;
                }
            }, 1000);
        }
    }
    
    return ready;
}

// Gmail 상태 업데이트
function updateGmailStatus() {
    const statusElement = document.getElementById('gmail-status-indicator');
    if (!statusElement) return;
    
    if (isDemoMode) {
        statusElement.innerHTML = '<span class="badge badge-warning">데모 모드</span>';
        return;
    }
    
    if (checkGmailAPIReady()) {
        if (isAuthenticated) {
            statusElement.innerHTML = '<span class="badge badge-success">Gmail 연결됨</span>';
        } else {
            statusElement.innerHTML = '<span class="badge badge-warning">로그인 필요</span>';
        }
    } else {
        statusElement.innerHTML = '<span class="badge badge-secondary">초기화 중...</span>';
    }
}

// Gmail 인증 응답 처리
function handleGmailAuthResponse(response) {
    console.log('🎫 Gmail 인증 응답 수신:', {
        access_token: response.access_token ? 'received' : 'missing',
        error: response.error || 'none'
    });
    
    if (response.error) {
        console.error('❌ Gmail 인증 실패:', response.error, response.error_description);
        
        // 오류 메시지 개선
        let errorMessage = 'Gmail 로그인에 실패했습니다.';
        switch (response.error) {
            case 'popup_closed_by_user':
                errorMessage = '로그인 팝업이 닫혔습니다. 다시 시도해주세요.';
                handlePopupBlocked();
                break;
            case 'access_denied':
                errorMessage = '로그인이 거부되었습니다. 권한을 허용해주세요.';
                break;
            case 'popup_blocked_by_browser':
                errorMessage = '브라우저에서 팝업을 차단했습니다.';
                handlePopupBlocked();
                break;
            default:
                errorMessage = `로그인 오류: ${response.error_description || response.error}`;
        }
        
        showInlineNotification(errorMessage, 'error', 8000);
        
        // 버튼 상태 복구
        resetLoginButtons();
        return;
    }
    
    if (!response.access_token) {
        console.error('❌ 액세스 토큰을 받지 못했습니다.');
        showInlineNotification('인증 토큰을 받지 못했습니다. 다시 시도해주세요.', 'error');
        resetLoginButtons();
        return;
    }
    
    console.log('✅ Gmail 액세스 토큰 수신 성공');
    
    // 토큰 설정
    gapi.client.setToken({ access_token: response.access_token });
    isAuthenticated = true;
    
    // 인증 성공 처리
    onGmailAuthorized();
}

// 로그인 버튼 상태 초기화
function resetLoginButtons() {
    const buttons = [
        document.querySelector('#google-signin-btn'),
        document.querySelector('#gmail-login-section button'),
        document.querySelector('.workspace-forwarding button[onclick*="requestGmailLogin"]')
    ];
    
    buttons.forEach(btn => {
        if (btn) {
            btn.disabled = false;
            if (btn.id === 'google-signin-btn') {
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 로그인`;
            } else {
                btn.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>다시 로그인';
            }
        }
    });
}

// Gmail 인증 성공 시 호출
function onGmailAuthorized() {
    console.log('✅ Gmail 인증 완료');
    
    showInlineNotification(
        isDemoMode ? 
            '데모 로그인이 완료되었습니다! 이제 포워딩 시뮬레이션을 사용할 수 있습니다.' :
            'Gmail 로그인이 완료되었습니다! 이제 포워딩 기능을 사용할 수 있습니다.',
        'success',
        5000
    );
    
    // UI 업데이트
    updateGmailStatus();
    updateGmailLoginButton();
    updateForwardingUIForLoggedIn();
    
    // 포워딩 폼 활성화
    enableForwardingForm();
}

// 포워딩 폼 활성화
function enableForwardingForm() {
    const forwardingInputs = [
        '#forwarding-email',
        '#forwarding-name', 
        '#forwarding-reason',
        '#forwarding-preview-btn',
        '#forwarding-submit'
    ];
    
    forwardingInputs.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.disabled = false;
            
            // 플레이스홀더 텍스트 업데이트
            if (element.placeholder) {
                element.placeholder = element.placeholder.replace(' (로그인 필요)', '');
            }
        }
    });
}

// 사용자 프로필 가져오기
async function getUserProfile() {
    if (!checkGmailAPIReady() || !isAuthenticated) {
        throw new Error('Gmail API가 준비되지 않았거나 인증되지 않았습니다.');
    }
    
    try {
        const response = await gapi.client.gmail.users.getProfile({
            userId: 'me'
        });
        return response.result;
    } catch (error) {
        console.error('❌ 사용자 프로필 가져오기 실패:', error);
        throw error;
    }
}

// Gmail 토큰 검증
async function verifyGmailToken() {
    try {
        const token = gapi.client.getToken();
        if (!token) {
            isAuthenticated = false;
            return false;
        }
        
        // 토큰 유효성 검사
        const profile = await getUserProfile();
        if (profile) {
            isAuthenticated = true;
            return true;
        }
    } catch (error) {
        console.error('❌ 토큰 검증 실패:', error);
        isAuthenticated = false;
    }
    
    updateGmailStatus();
    return false;
}

// Gmail 로그인 요청 (강화된 버전)
async function requestGmailLogin(forceMode = false) {
    console.log('🔐 Gmail 로그인 요청...', forceMode ? '(강제 모드)' : '');
    
    // 데모 모드에서는 가상 로그인 시뮬레이션
    if (isDemoMode) {
        console.log('🧪 데모 모드: 가상 Gmail 로그인 시뮬레이션');
        showInlineNotification('데모 모드입니다. 가상 로그인을 진행합니다...', 'info', 3000);
        
        // 버튼 상태 변경
        const loginBtn = document.querySelector('#gmail-login-section button');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>로그인 중...';
        }
        
        // 가상 인증 성공 처리
        setTimeout(() => {
            isAuthenticated = true;
            onGmailAuthorized();
        }, 2000);
        return;
    }
    
    // 강제 모드가 아닌 경우에만 API 준비 상태 체크
    if (!forceMode && !checkGmailAPIReady()) {
        console.warn('⚠️ Gmail API가 준비되지 않음, 강제 모드로 재시도...');
        
        // API 강제 재초기화 시도
        setTimeout(async () => {
            try {
                console.log('🔄 API 강제 재초기화 시도...');
                
                if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                    await initializeGapi();
                    await initializeGis();
                    
                    // 재초기화 후 강제 모드로 다시 시도
                    setTimeout(() => requestGmailLogin(true), 1000);
                } else {
                    showInlineNotification('Google API 스크립트가 로드되지 않았습니다. 페이지를 새로고침해주세요.', 'error');
                }
            } catch (error) {
                console.error('❌ 강제 재초기화 실패:', error);
                showInlineNotification('API 초기화에 실패했습니다. 페이지를 새로고침해주세요.', 'error');
            }
        }, 500);
        return;
    }
    
    // 토큰 클라이언트 재확인
    if (!tokenClient && typeof google !== 'undefined') {
        console.warn('⚠️ 토큰 클라이언트 재초기화 시도...');
        try {
            await initializeGis();
        } catch (error) {
            console.error('❌ 토큰 클라이언트 재초기화 실패:', error);
        }
    }
    
    if (!tokenClient) {
        console.error('❌ 토큰 클라이언트가 초기화되지 않았습니다.');
        showInlineNotification('인증 시스템이 준비되지 않았습니다. 페이지를 새로고침해주세요.', 'error');
        return;
    }
    
    try {
        console.log('🚀 Google OAuth 팝업 시작...');
        
        // 버튼 상태 변경
        const loginBtn = document.querySelector('#google-signin-btn') || 
                         document.querySelector('#gmail-login-section button') ||
                         document.querySelector('.workspace-forwarding button[onclick*="requestGmailLogin"]');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Google 로그인 중...';
        }
        
        // 팝업 차단 경고
        if (!forceMode) {
            showInlineNotification('팝업이 차단된 경우 브라우저 설정에서 팝업을 허용해주세요.', 'info', 5000);
        }
        
        tokenClient.requestAccessToken({ 
            prompt: forceMode ? 'consent' : 'select_account',
            hint: 'Gmail 포워딩을 위한 권한이 필요합니다',
            include_granted_scopes: true
        });
        
    } catch (error) {
        console.error('❌ Gmail 로그인 요청 실패:', error);
        showGmailAuthError(error);
        
        // 버튼 상태 복구
        const loginBtn = document.querySelector('#google-signin-btn') || 
                         document.querySelector('#gmail-login-section button') ||
                         document.querySelector('.workspace-forwarding button');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = isDemoMode ? 
                '<i class="fas fa-play mr-1"></i>데모 로그인' : 
                '<svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google로 로그인';
        }
    }
}

// Gmail 로그아웃
function logoutGmail() {
    try {
        // 데모 모드에서는 단순히 상태만 변경
        if (isDemoMode) {
            isAuthenticated = false;
            console.log('✅ Gmail 로그아웃 완료 (데모 모드)');
            updateGmailStatus();
            updateGmailLoginButton();
            return;
        }
        
        const token = gapi.client.getToken();
        if (token) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
        }
        isAuthenticated = false;
        console.log('✅ Gmail 로그아웃 완료');
        updateGmailStatus();
    } catch (error) {
        console.error('❌ Gmail 로그아웃 실패:', error);
    }
}

// Gmail 설정 가이드 표시
function showGmailSetupGuide() {
    if (isDemoMode) {
        const guideMessage = `
            <div class="alert alert-warning">
                <h6><i class="fas fa-exclamation-triangle"></i> 데모 모드 안내</h6>
                <p>현재 Google API 키가 설정되지 않아 데모 모드로 동작합니다.</p>
                <p><strong>실제 Gmail 연동을 위해서는:</strong></p>
                <ol>
                    <li><a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a>에서 새 프로젝트 생성</li>
                    <li>Gmail API 활성화</li>
                    <li>OAuth 2.0 클라이언트 ID 생성</li>
                    <li>API 키 생성</li>
                    <li>개발자에게 API 키 정보 전달</li>
                </ol>
                <p><small>지금은 포워딩 시뮬레이션만 가능합니다.</small></p>
            </div>
        `;
        
        showInlineNotification(guideMessage, 'warning', 10000);
    } else {
        // 실제 API 키가 있는 경우의 안내
        const loginGuide = `
            <div class="alert alert-info">
                <h6><i class="fab fa-google"></i> Google 로그인 필요</h6>
                <p>Gmail 포워딩 기능을 사용하려면 Google 계정으로 로그인해주세요.</p>
                <div class="text-center mt-3">
                    <button class="btn btn-primary" onclick="requestGmailLogin()">
                        <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right: 8px;">
                            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        지금 Google로 로그인
                    </button>
                </div>
                <p class="mt-2 mb-0"><small>
                    <i class="fas fa-shield-alt"></i> 
                    안전한 OAuth 2.0 인증을 사용하며, Gmail 읽기 및 전송 권한만 요청합니다.
                </small></p>
            </div>
        `;
        
        showInlineNotification(loginGuide, 'info', 15000);
    }
}

// 별도 함수: 팝업 차단 시 대안 제시
function handlePopupBlocked() {
    const alternativeGuide = `
        <div class="alert alert-warning">
            <h6><i class="fas fa-window-close"></i> 팝업이 차단되었나요?</h6>
            <p>브라우저에서 팝업을 차단한 것 같습니다. 다음 방법을 시도해보세요:</p>
            <ol>
                <li>브라우저 주소창 오른쪽의 팝업 차단 아이콘을 클릭</li>
                <li>이 사이트의 팝업을 항상 허용으로 설정</li>
                <li>아래 버튼을 다시 클릭</li>
            </ol>
            <div class="text-center mt-3">
                <button class="btn btn-primary" onclick="requestGmailLogin()">
                    <i class="fab fa-google mr-2"></i>다시 Google 로그인 시도
                </button>
            </div>
        </div>
    `;
    
    showInlineNotification(alternativeGuide, 'warning', 20000);
}

// 인라인 알림 표시
function showInlineNotification(message, type = 'info', duration = 5000) {
    const container = document.querySelector('.workspace-forwarding');
    if (!container) return;
    
    // 기존 알림 제거
    const existingNotification = container.querySelector('.gmail-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} gmail-notification`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="close" onclick="this.parentElement.remove()">
            <span>&times;</span>
        </button>
    `;
    
    container.insertBefore(notification, container.firstChild);
    
    // 자동 제거
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
}

// Gmail 로그인 버튼 활성화
function enableGmailLoginButton() {
    const loginButtons = document.querySelectorAll('[onclick*="requestGmailLogin"]');
    loginButtons.forEach(button => {
        button.disabled = false;
        button.textContent = '로그인';
    });
}

// Gmail 로그인 섹션 추가 (포워딩 영역에)
function addGmailLoginSection() {
    const forwardingContainer = document.querySelector('.workspace-forwarding');
    if (!forwardingContainer || document.getElementById('gmail-login-section')) return;
    
    const loginSection = document.createElement('div');
    loginSection.id = 'gmail-login-section';
    
    // 데모 모드와 실제 모드에 따라 다른 UI 표시
    if (isDemoMode) {
        loginSection.className = 'mb-3 p-3 bg-warning text-dark rounded';
        loginSection.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1"><i class="fas fa-exclamation-triangle mr-2"></i>데모 모드</h6>
                    <small>Google API 키가 설정되지 않아 데모 모드로 동작합니다.</small>
                </div>
                <button class="btn btn-outline-dark btn-sm" onclick="requestGmailLogin()">
                    <i class="fas fa-play mr-1"></i>데모 로그인
                </button>
            </div>
        `;
    } else {
        loginSection.className = 'mb-3 p-4 bg-primary text-white rounded';
        loginSection.innerHTML = `
            <div class="text-center">
                <h5 class="mb-3"><i class="fab fa-google mr-2"></i>Google 계정으로 로그인</h5>
                <p class="mb-3">포워딩 기능을 사용하려면 Gmail에 연결이 필요합니다.</p>
                <button id="google-signin-btn" class="btn btn-light btn-lg" onclick="requestGmailLogin()">
                    <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px;">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 로그인
                </button>
                <div class="mt-2">
                    <small>안전한 OAuth 2.0 인증을 사용합니다</small>
                </div>
            </div>
        `;
    }
    
    // 포워딩 컨테이너 맨 위에 추가
    forwardingContainer.insertBefore(loginSection, forwardingContainer.firstChild);
}

// Gmail 로그인 버튼 업데이트
function updateGmailLoginButton() {
    const loginSection = document.getElementById('gmail-login-section');
    
    if (!loginSection) {
        // 로그인 섹션이 없으면 추가
        addGmailLoginSection();
        return;
    }
    
    if (isAuthenticated) {
        loginSection.className = 'mb-3 p-3 bg-success text-white rounded';
        loginSection.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">
                        <i class="fas fa-check-circle mr-2"></i>
                        ${isDemoMode ? '데모 로그인 완료' : 'Gmail 연결 완료'}
                    </h6>
                    <small>이제 포워딩 기능을 사용할 수 있습니다.</small>
                </div>
                <button class="btn btn-light btn-sm" onclick="logoutGmail()">
                    <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                </button>
            </div>
        `;
    } else {
        // 로그인 필요 상태 - 섹션 다시 추가
        loginSection.remove();
        addGmailLoginSection();
    }
}

// Gmail 연결 상태 표시
function showGmailConnectedStatus() {
    const statusElement = document.getElementById('gmail-status-indicator');
    if (statusElement) {
        if (isAuthenticated) {
            statusElement.innerHTML = `
                <span class="badge badge-success">
                    <i class="fas fa-check-circle mr-1"></i>
                    ${isDemoMode ? '데모 로그인 완료' : 'Gmail 연결됨'}
                </span>
            `;
        } else {
            statusElement.innerHTML = `
                <span class="badge badge-warning">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    로그인 필요
                </span>
            `;
        }
    }
}

// Gmail 인증 오류 표시
function showGmailAuthError(error) {
    console.error('Gmail 인증 오류:', error);
    const errorMessage = error?.message || error || 'Gmail 인증 중 오류가 발생했습니다.';
    showInlineNotification(`Gmail 인증 오류: ${errorMessage}`, 'error', 8000);
}

// 스크립트 로드 완료 알림
console.log('📧 Gmail API 스크립트 로드 완료!');

// 현재 API 키 설정 확인 및 피드백 (스크립트 로드 완료 시점)
(function checkApiKeySetup() {
    const hasRealClientId = GOOGLE_CONFIG.CLIENT_ID && 
                           GOOGLE_CONFIG.CLIENT_ID.includes('.apps.googleusercontent.com') &&
                           GOOGLE_CONFIG.CLIENT_ID.length > 50;
                           
    const hasRealApiKey = GOOGLE_CONFIG.API_KEY && 
                         GOOGLE_CONFIG.API_KEY.startsWith('AIza') &&
                         GOOGLE_CONFIG.API_KEY.length > 30;
    
    if (hasRealClientId && hasRealApiKey) {
        console.log('✅ 실제 Google API 키가 설정되어 있습니다.');
        console.log('📧 Gmail 로그인을 시도하려면 작업실 섹션의 "Google로 로그인" 버튼을 클릭하세요.');
        console.log('🔧 또는 콘솔에서 gmailDebug.forceLogin()을 실행하세요.');
        window.isDemoMode = false;
    } else {
        console.log('⚠️ Google API 키가 설정되지 않아 데모 모드로 동작합니다.');
        console.log('🧪 포워딩 시뮬레이션은 gmailDebug.simulateLogin()으로 테스트할 수 있습니다.');
        window.isDemoMode = true;
    }
    
    console.log('🎯 최종 데모 모드 설정:', window.isDemoMode);
})();

// 즉시 초기화 시도 (Google API 스크립트가 로드된 후)
setTimeout(() => {
    console.log('⏰ 자동 초기화 시작...');
    
    // Google API 스크립트 로드 확인
    if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
        console.log('✅ Google API 스크립트 이미 로드됨, 초기화 진행...');
        initializeGapi().then(() => {
            return initializeGis();
        }).then(() => {
            console.log('🎉 Gmail API 자동 초기화 완료!');
        }).catch(error => {
            console.error('❌ 자동 초기화 실패:', error);
        });
    } else {
        console.log('⏳ Google API 스크립트 대기 중...');
        // 추가 대기 후 재시도
        setTimeout(() => {
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                console.log('✅ Google API 스크립트 로드 완료, 초기화 진행...');
                initializeGapi().then(() => {
                    return initializeGis();
                }).then(() => {
                    console.log('🎉 Gmail API 지연 초기화 완료!');
                }).catch(error => {
                    console.error('❌ 지연 초기화 실패:', error);
                });
            } else {
                console.warn('⚠️ Google API 스크립트 로드 실패 - 수동 초기화 필요');
                console.log('💡 gmailDebug.loadGoogleScripts()를 실행해보세요.');
            }
        }, 3000);
    }
}, 1000); 