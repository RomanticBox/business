// 인증 및 온보딩 관련 JavaScript

// 전역 변수
let currentStep = 0;
let userInfo = {
    email: '',
    name: '',
    department: '',
    birthdate: '',
    adminEmail: '',
    advisorName: ''
};

// 구글 OAuth 초기화 (실제 구현 시 Google API 키 필요)
function initGoogleAuth() {
    // 실제 구현에서는 Google OAuth2 API를 사용
    console.log('Google Auth 초기화됨');
}

// 로그인/회원가입 팝업 표시
function showAuthModal() {
    const authOverlay = $('#auth-overlay');
    authOverlay.addClass('show');
    
    // 대학교 이메일 도메인 체크
    $('#email-input').on('blur', function() {
        const email = $(this).val();
        if (email && !isUniversityEmail(email)) {
            showEmailError('대학교 이메일을 사용해주세요.');
        }
    });
}

// 대학교 이메일 검증
function isUniversityEmail(email) {
    const universityDomains = [
        'yonsei.ac.kr',
        'student.yonsei.ac.kr',
        'snu.ac.kr',
        'kaist.ac.kr',
        'postech.ac.kr',
        'korea.ac.kr',
        'hanyang.ac.kr',
        'skku.edu',
        'cau.ac.kr',
        'khu.ac.kr'
    ];
    
    return universityDomains.some(domain => email.toLowerCase().endsWith('@' + domain));
}

// Google 로그인 처리
function handleGoogleLogin() {
    showLoadingButton('#google-login-btn', '<i class="fas fa-spinner fa-spin"></i> 로그인 중...');
    
    // 실제 Google OAuth 초기화
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            client_id: window.GOOGLE_ENV?.CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: false
        });
        
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // 수동으로 로그인 트리거
                google.accounts.id.renderButton(
                    document.getElementById('google-login-btn'),
                    { 
                        theme: 'outline', 
                        size: 'large',
                        width: '100%',
                        text: 'continue_with'
                    }
                );
            }
        });
    } else {
        // Google API 로드되지 않은 경우 시뮬레이션
        setTimeout(() => {
            const mockEmail = prompt('대학교 Gmail 주소를 입력하세요:');
            if (mockEmail && isUniversityEmail(mockEmail)) {
                const mockUser = {
                    email: mockEmail,
                    name: mockEmail.split('@')[0],
                    verified: true
                };
                processGoogleLogin(mockUser);
            } else {
                showAuthError('대학교 이메일로만 로그인 가능합니다.');
                resetButton('#google-login-btn', '<i class="fab fa-google"></i> Google로 로그인');
            }
        }, 1000);
    }
}

// Google 응답 처리
function handleGoogleResponse(response) {
    try {
        const credential = response.credential;
        const payload = parseJwt(credential);
        
        const user = {
            email: payload.email,
            name: payload.name,
            verified: payload.email_verified
        };
        
        processGoogleLogin(user);
    } catch (error) {
        console.error('Google 로그인 오류:', error);
        showAuthError('로그인 중 오류가 발생했습니다.');
        resetButton('#google-login-btn', '<i class="fab fa-google"></i> Google로 로그인');
    }
}

// JWT 파싱 함수
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Google 로그인 처리
function processGoogleLogin(user) {
    if (isUniversityEmail(user.email)) {
        userInfo.email = user.email;
        userInfo.name = user.name;
        
        // 로그인 완료 처리
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        hideAuthModal();
        startOnboarding();
    } else {
        showAuthError('대학교 이메일로만 로그인 가능합니다.');
        resetButton('#google-login-btn', '<i class="fab fa-google"></i> Google로 로그인');
    }
}

// 이메일 로그인 처리
function handleEmailLogin() {
    const email = $('#email-input').val();
    const password = $('#password-input').val();
    
    if (!email || !password) {
        showAuthError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (!isUniversityEmail(email)) {
        showAuthError('대학교 이메일을 사용해주세요.');
        return;
    }
    
    showLoadingButton('#email-login-btn', '로그인 중...');
    
    // 로그인 시뮬레이션
    setTimeout(() => {
        userInfo.email = email;
        hideAuthModal();
        startOnboarding();
        resetButton('#email-login-btn', '로그인');
    }, 1500);
}

// 회원가입 처리
function handleEmailSignup() {
    const email = $('#email-input').val();
    const password = $('#password-input').val();
    
    if (!email || !password) {
        showAuthError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (!isUniversityEmail(email)) {
        showAuthError('대학교 이메일을 사용해주세요.');
        return;
    }
    
    showLoadingButton('#email-signup-btn', '계정 생성 중...');
    
    // 회원가입 시뮬레이션
    setTimeout(() => {
        userInfo.email = email;
        hideAuthModal();
        startOnboarding();
        resetButton('#email-signup-btn', '계정 만들기');
    }, 1500);
}

// 온보딩 시작
function startOnboarding() {
    currentStep = 0;
    $('#onboarding-overlay').show();
    updateProgress();
    showStep(currentStep);
}

// 단계별 진행
function nextStep() {
    const currentStepData = getCurrentStepData();
    
    if (!validateCurrentStep(currentStepData)) {
        return;
    }
    
    saveCurrentStepData(currentStepData);
    
    if (currentStep < 4) {
        currentStep++;
        updateProgress();
        showStep(currentStep);
    } else {
        completeOnboarding();
    }
}

// 건너뛰기
function skipStep() {
    if (currentStep < 4) {
        currentStep++;
        updateProgress();
        showStep(currentStep);
    } else {
        completeOnboarding();
    }
}

// 현재 단계 데이터 가져오기
function getCurrentStepData() {
    switch(currentStep) {
        case 0:
            return $('#name-input').val();
        case 1:
            return $('#department-input').val();
        case 2:
            return $('#birthdate-input').val();
        case 3:
            return $('#admin-email-input').val();
        case 4:
            return $('#advisor-name-input').val();
        default:
            return '';
    }
}

// 현재 단계 검증
function validateCurrentStep(data) {
    if (!data.trim()) {
        showStepError('이 필드를 입력해주세요.');
        return false;
    }
    
    // 이메일 검증 (행정실 이메일)
    if (currentStep === 3) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data)) {
            showStepError('올바른 이메일 형식을 입력해주세요.');
            return false;
        }
    }
    
    return true;
}

// 현재 단계 데이터 저장
function saveCurrentStepData(data) {
    switch(currentStep) {
        case 0:
            userInfo.name = data;
            break;
        case 1:
            userInfo.department = data;
            break;
        case 2:
            userInfo.birthdate = data;
            break;
        case 3:
            userInfo.adminEmail = data;
            break;
        case 4:
            userInfo.advisorName = data;
            break;
    }
}

// 진행률 업데이트
function updateProgress() {
    const progress = ((currentStep + 1) / 5) * 100;
    $('.progress-fill').css('width', progress + '%');
    $('.progress-text').text(`${currentStep + 1} / 5 단계`);
}

// 단계 표시
function showStep(step) {
    $('.onboarding-step').removeClass('active');
    $(`.onboarding-step[data-step="${step}"]`).addClass('active');
    
    // 입력 필드에 포커스
    setTimeout(() => {
        $('.onboarding-step.active input').focus();
    }, 300);
}

// 온보딩 완료
function completeOnboarding() {
    // 폭죽 애니메이션 실행
    createConfetti();
    
    // 완료 메시지 표시
    $('.onboarding-step').removeClass('active');
    $('#completion-step').addClass('active');
    
    // 사용자 정보 저장 (로컬 스토리지)
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('isLoggedIn', 'true');
    
    // 2초 후 온보딩 종료
    setTimeout(() => {
        $('#onboarding-overlay').fadeOut();
        // 메인 페이지 업데이트
        updateUIWithUserInfo();
    }, 3000);
}

// 폭죽 애니메이션 생성
function createConfetti() {
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];
    const confettiContainer = $('<div class="confetti-container"></div>');
    $('body').append(confettiContainer);
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = $('<div class="confetti"></div>');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const animationDelay = Math.random() * 2;
            
            confetti.css({
                left: left + '%',
                backgroundColor: color,
                animationDelay: animationDelay + 's'
            });
            
            confettiContainer.append(confetti);
        }, i * 20);
    }
    
    // 3초 후 폭죽 제거
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000);
}

// UI 업데이트
function updateUIWithUserInfo() {
    const savedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (savedUserInfo) {
        // 환영 메시지 업데이트
        $('#user-name-display').text(savedUserInfo.name);
        
        // 다른 UI 요소들도 업데이트 가능
        console.log('사용자 정보 로드됨:', savedUserInfo);
    }
}

// 유틸리티 함수들
function showAuthError(message) {
    const errorDiv = $('#auth-error');
    errorDiv.text(message).show().delay(3000).fadeOut();
}

function showEmailError(message) {
    const errorDiv = $('#email-error');
    errorDiv.text(message).show().delay(3000).fadeOut();
}

function showStepError(message) {
    const errorDiv = $('.step-error');
    errorDiv.text(message).show().delay(3000).fadeOut();
}

function showLoadingButton(selector, text) {
    $(selector).prop('disabled', true).html(text);
}

function resetButton(selector, text) {
    $(selector).prop('disabled', false).html(text);
}

function hideAuthModal() {
    $('#auth-overlay').removeClass('show');
}

// 페이지 로드 시 로그인 상태 확인
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userInfo = localStorage.getItem('userInfo');
    
    // 항상 로그인 모달 표시 (로그인되지 않은 경우)
    if (!isLoggedIn || !userInfo) {
        setTimeout(showAuthModal, 500); // 빠르게 표시
    } else {
        updateUIWithUserInfo();
        console.log('로그인된 사용자:', JSON.parse(userInfo));
    }
}

// 로그아웃
function logout() {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    location.reload();
} 