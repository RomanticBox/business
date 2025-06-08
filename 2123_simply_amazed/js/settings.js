// 사용자 설정 관리

// 설정 모달 표시
function showSettingsModal() {
    const settingsModal = createSettingsModal();
    $('body').append(settingsModal);
    $('#settings-modal').fadeIn();
    loadCurrentSettings();
}

// 설정 모달 HTML
function createSettingsModal() {
    return `
        <div id="settings-modal" class="settings-overlay">
            <div class="settings-container">
                <div class="settings-header">
                    <h2>Tel-U 설정</h2>
                    <button class="settings-close" onclick="closeSettingsModal()">&times;</button>
                </div>
                
                <div class="settings-content">
                    <div class="setting-section">
                        <h3>알림 설정</h3>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="notification-enabled"> 
                                정시 알림 활성화
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>알림 시간:</label>
                            <input type="time" id="notification-time" value="09:00">
                        </div>
                    </div>
                    
                    <div class="setting-section">
                        <h3>이메일 모니터링</h3>
                        <div class="setting-item">
                            <label>추가 행정실 이메일:</label>
                            <input type="email" id="additional-admin-email" placeholder="admin@department.ac.kr">
                            <button class="btn btn-sm btn-primary" onclick="addAdminEmail()">추가</button>
                        </div>
                        <div class="admin-emails-list" id="admin-emails-list"></div>
                    </div>
                    
                    <div class="setting-section">
                        <h3>Gmail 연동</h3>
                        <div class="setting-item">
                            <button class="btn btn-primary" onclick="requestGmailPermission()">
                                Gmail 권한 요청
                            </button>
                            <span id="gmail-status"></span>
                        </div>
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="btn btn-primary" onclick="saveSettings()">설정 저장</button>
                    <button class="btn btn-secondary" onclick="closeSettingsModal()">취소</button>
                </div>
            </div>
        </div>
    `;
}

// 현재 설정 로드
function loadCurrentSettings() {
    const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
    const adminEmails = JSON.parse(localStorage.getItem('admin_emails') || '[]');
    
    $('#notification-enabled').prop('checked', settings.enabled || false);
    $('#notification-time').val(settings.time || '09:00');
    
    // 행정실 이메일 목록 표시
    displayAdminEmails(adminEmails);
    
    // Gmail 상태 확인
    updateGmailStatus();
}

// 설정 저장
function saveSettings() {
    const notificationSettings = {
        enabled: $('#notification-enabled').is(':checked'),
        time: $('#notification-time').val()
    };
    
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    
    // 알림 스케줄 다시 설정
    setupNotificationSchedule();
    
    showNotification('설정이 저장되었습니다.', 'success');
    closeSettingsModal();
}

// 행정실 이메일 추가
function addAdminEmail() {
    const email = $('#additional-admin-email').val();
    if (!email) return;
    
    const adminEmails = JSON.parse(localStorage.getItem('admin_emails') || '[]');
    if (!adminEmails.includes(email)) {
        adminEmails.push(email);
        localStorage.setItem('admin_emails', JSON.stringify(adminEmails));
        displayAdminEmails(adminEmails);
        $('#additional-admin-email').val('');
    }
}

// 행정실 이메일 목록 표시
function displayAdminEmails(emails) {
    const container = $('#admin-emails-list');
    container.empty();
    
    emails.forEach(email => {
        container.append(`
            <div class="admin-email-item">
                <span>${email}</span>
                <button class="btn btn-sm btn-danger" onclick="removeAdminEmail('${email}')">삭제</button>
            </div>
        `);
    });
}

// 행정실 이메일 제거
function removeAdminEmail(email) {
    let adminEmails = JSON.parse(localStorage.getItem('admin_emails') || '[]');
    adminEmails = adminEmails.filter(e => e !== email);
    localStorage.setItem('admin_emails', JSON.stringify(adminEmails));
    displayAdminEmails(adminEmails);
}

// Gmail 상태 업데이트
function updateGmailStatus() {
    const hasToken = localStorage.getItem('gmail_access_token');
    const status = $('#gmail-status');
    
    if (hasToken) {
        status.html('<span class="text-success">✓ 연동됨</span>');
    } else {
        status.html('<span class="text-warning">연동 필요</span>');
    }
}

// 설정 모달 닫기
function closeSettingsModal() {
    $('#settings-modal').fadeOut(function() {
        $(this).remove();
    });
} 