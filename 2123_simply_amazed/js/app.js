// 전역 변수
let customDate = new Date();
let dndMode = false;

// 개발/테스트 모드 설정
const DEVELOPMENT_MODE = true; // true로 설정하면 매번 사용자 정보 입력 화면이 나옵니다

// 팝업 방지를 위한 안전장치 설정
(function() {
    console.log('🛡️ 팝업 방지 안전장치 활성화');
    
    // 개발 모드에서는 기존 사용자 정보 자동 삭제
    if (DEVELOPMENT_MODE) {
        console.log('🔧 개발 모드: 기존 사용자 정보 자동 삭제');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('isLoggedIn');
    }
    
    // Notification API 오버라이드 (팝업 방지)
    if (typeof window.Notification !== 'undefined') {
        const originalRequestPermission = window.Notification.requestPermission;
        window.Notification.requestPermission = function() {
            console.log('❌ Notification.requestPermission 호출 차단됨');
            return Promise.resolve('denied');
        };
    }
    
    // 기타 팝업 발생 가능한 API들 오버라이드
    if (typeof window.alert !== 'undefined') {
        const originalAlert = window.alert;
        window.safeAlert = originalAlert; // 백업
        window.alert = function(message) {
            console.log('🔔 Alert 메시지:', message);
            // alert 대신 콘솔에만 로그
        };
    }
    
    console.log('✅ 팝업 방지 안전장치 설정 완료');
})();

// 업무 데이터 정의
const taskData = {
    "대표 연구실적 증빙자료": {
        samplePdf: "sample1.pdf",
        process: `
            <h5>1. 연구실적 정리</h5>
            <p>최근 3년간의 주요 연구 성과를 시간순으로 정리합니다.</p>
            <ul>
                <li>논문 발표 목록 작성</li>
                <li>학회 발표 자료 정리</li>
                <li>연구 프로젝트 참여 내역 작성</li>
            </ul>
            
            <h5>2. 증빙자료 수집</h5>
            <p>각 연구실적에 대한 증빙자료를 수집합니다.</p>
            <ul>
                <li>논문 게재 확인서</li>
                <li>학회 발표 확인서</li>
                <li>프로젝트 참여 확인서</li>
            </ul>
            
            <h5>3. 서류 작성 및 제출</h5>
            <p>정해진 양식에 맞춰 서류를 작성하고 제출합니다.</p>
        `
    },
    "연구실 안전 교육 이수증 제출": {
        samplePdf: "safety-education.pdf",
        process: `
            <h5>1. 온라인 안전교육 수강</h5>
            <p>대학 LMS 시스템에서 필수 안전교육을 수강합니다.</p>
            
            <h5>2. 이수증 발급</h5>
            <p>교육 완료 후 이수증을 다운로드합니다.</p>
            
            <h5>3. 제출</h5>
            <p>이수증을 지정된 양식으로 제출합니다.</p>
        `
    }
};

// 날짜 관련 함수들
function getTodayString() {
    const now = new Date(customDate);
    const year = now.getFullYear().toString().substr(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `20${year}-${month}-${day}`;
}

function getDaysRemaining(deadlineStr) {
    if (!deadlineStr) return '';
    
    const deadline = new Date(formatDate(deadlineStr));
    const today = new Date(customDate);
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `<span class="text-danger">${Math.abs(diffDays)}일 지남</span>`;
    } else if (diffDays === 0) {
        return '<span class="text-warning">오늘 마감</span>';
    } else if (diffDays <= 3) {
        return `<span class="text-warning">${diffDays}일 남음</span>`;
    } else {
        return `<span class="text-success">${diffDays}일 남음</span>`;
    }
}

// 업무 요약 업데이트 함수 수정
function updateTaskSummary() {
    const checkboxes = $('.checkbox-img');
    let totalTasks = checkboxes.length;
    let completedTasks = 0;
    let importantTasks = 0;
    let newTasksToday = 0;

    checkboxes.each(function() {
        const status = $(this).data('status');
        const isImportant = $(this).closest('tr').find('.task-important').length > 0;
        const receiptDate = $(this).closest('tr').find('.receipt-date').data('receipt');
        
        if (status === 'checked') {
            completedTasks++;
        }
        
        if (isImportant && status !== 'checked') {
            importantTasks++;
        }
        
        // 오늘 접수된 업무 확인
        if (receiptDate) {
            const receiptDateObj = new Date(receiptDate);
            const today = new Date();
            if (isSameDay(receiptDateObj, today)) {
                newTasksToday++;
            }
        }
    });

    const remainingTasks = totalTasks - completedTasks;
    
    const taskSummaryHtml = `
        <strong>Do Click</strong><br>
        언제 다하지? 하기도 전에 끝나요!<br>
        새로운 업무 : <strong>${newTasksToday}개</strong><br>
        남은 업무 : <strong>${remainingTasks}개</strong><br>
        중요 업무 : <strong>${importantTasks}개</strong><br><br>
        행정업무는 Do Click이이 처리했으니 안심하라구!
    `;
    
    $('#task-summary').html(taskSummaryHtml);
}

// 같은 날인지 확인하는 함수 추가
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 새 업무 알림 팝업 함수들
function showNewTaskPopup(taskCount) {
    removeNewTaskPopup();
    
    const popupHTML = `
        <div class="new-task-popup">
            <div class="popup-header">
                <span>
                    <i class="fas fa-bell popup-icon"></i>
                    새 업무 알림
                </span>
                <button class="popup-close">&times;</button>
            </div>
            <div class="popup-content">
                <p>오늘 <strong>${taskCount}</strong>개의 새로운 업무가 생겼습니다!</p>
                <p>빠른 확인이 필요합니다.</p>
            </div>
            <button class="popup-button" id="check-new-tasks">
                업무 확인하기
            </button>
        </div>
    `;
    
    $('body').append(popupHTML);
    
    setTimeout(function() {
        $('.new-task-popup').addClass('show');
    }, 100);
    
    $('.popup-close').on('click', function() {
        removeNewTaskPopup();
    });
    
    $('#check-new-tasks').on('click', function() {
        $('html, body').animate({
            scrollTop: $('#section-checklist').offset().top
        }, 800);
        removeNewTaskPopup();
    });
    
    setTimeout(removeNewTaskPopup, 10000);
}

function removeNewTaskPopup() {
    const popup = $('.new-task-popup');
    if (popup.length) {
        popup.removeClass('show');
        setTimeout(function() {
            popup.remove();
        }, 500);
    }
}

// 체크박스 상태 토글 함수
function toggleCheckbox(element) {
    const currentStatus = $(element).data('status');
    const newStatus = currentStatus === 'checked' ? 'unchecked' : 'checked';
    const newSrc = newStatus === 'checked' ? 'img/checkbox-checked.png' : 'img/checkbox-unchecked.png';
    
    $(element).attr('src', newSrc);
    $(element).data('status', newStatus);
    
    updateTaskSummary();
}

// 작업실 컨텐츠 표시 함수
function showWorkspaceContent(taskContent, status, deadline, receiptDate, assignee, forwarding) {
    $('#workspace-initial-message').hide();
    $('#workspace-content').show();
    
    $('#ws-status').text(status === 'checked' ? '완료' : '미완료');
    $('#ws-deadline').html(getDaysRemaining(deadline));
    $('#ws-receipt-date').text(formatDate(receiptDate));
    $('#ws-task-content').text(taskContent);
    $('#ws-assignee').text(assignee);
    $('#ws-forwarding').text(forwarding || '-');
    
    const task = taskData[taskContent];
    if (task) {
        $('#sample-pdf').attr('src', `samples/${task.samplePdf}`);
        $('#process-container').html(task.process);
    } else {
        $('#sample-pdf').attr('src', '');
        $('#process-container').html('<p>해당 업무에 대한 프로세스 정보가 준비 중입니다.</p>');
    }
}

// 작업실 기본 컨텐츠 표시 함수 추가
function showDefaultWorkspaceContent() {
    $('#workspace-initial-message').hide();
    $('#workspace-content').show();
    
    // 기본 정보 표시
    $('#ws-status').text('업무를 선택해주세요');
    $('#ws-deadline').text('-');
    $('#ws-receipt-date').text('-');
    $('#ws-task-content').text('체크리스트에서 업무를 클릭하면 상세 정보가 표시됩니다');
    $('#ws-assignee').text('-');
    $('#ws-forwarding').text('-');
    
    // 기본 샘플 문서와 프로세스 표시
    $('#sample-pdf').attr('src', '');
    $('#process-container').html(`
        <div class="default-process-info">
            <h5><i class="fas fa-info-circle"></i> 업무 처리 가이드</h5>
            <div class="process-steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h6>체크리스트 확인</h6>
                        <p>할당된 업무 목록을 확인하고 우선순위를 정하세요.</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h6>업무 선택</h6>
                        <p>처리할 업무를 클릭하여 상세 정보와 양식을 확인하세요.</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h6>양식 작성</h6>
                        <p>제공된 샘플을 참고하여 필요한 서류를 작성하세요.</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h6>업무 완료</h6>
                        <p>작업 완료 후 체크박스를 클릭하여 완료 표시하세요.</p>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// Gmail을 통한 실제 포워딩 기능
function handleForwarding() {
    const email = $('#forwarding-email').val().trim();
    const name = $('#forwarding-name').val().trim();
    const reason = $('#forwarding-reason').val().trim();
    const notifyOriginal = $('#notify-original-assignee').is(':checked');
    const taskContent = $('#ws-task-content').text().trim();
    
    console.log('🚀 Gmail 포워딩 시작:', { email, name, reason, notifyOriginal, taskContent });
    
    // 입력값 검증
    if (!email || !name || !reason) {
        showForwardingResult('danger', '모든 필드를 입력해주세요.');
        return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showForwardingResult('danger', '올바른 이메일 형식을 입력해주세요.');
        return;
    }
    
    // 업무 내용 확인
    if (!taskContent || taskContent === '체크리스트에서 업무를 클릭하면 상세 정보가 표시됩니다') {
        showForwardingResult('danger', '포워딩할 업무를 먼저 선택해주세요.');
        return;
    }
    
    // Google 로그인 상태 확인
    console.log('🔍 Gmail API 상태 확인:', {
        gapiExists: typeof gapi !== 'undefined',
        clientExists: typeof gapi !== 'undefined' && !!gapi.client,
        gmailExists: typeof gapi !== 'undefined' && !!gapi.client && !!gapi.client.gmail,
        token: typeof gapi !== 'undefined' && gapi.client ? gapi.client.getToken() : null
    });
    
    if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.gmail) {
        showForwardingResult('danger', 'Gmail 연동이 필요합니다. 위의 "로그인" 버튼을 클릭해주세요.');
        return;
    }
    
    // 토큰 확인
    const token = gapi.client.getToken();
    if (!token || !token.access_token) {
        showForwardingResult('danger', 'Gmail 접근 권한이 없습니다. 위의 "권한 요청" 버튼을 클릭해주세요.');
        return;
    }
    
    // 버튼 비활성화 및 로딩 표시
    $('#forwarding-submit').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 이메일 전송 중...');
    
    // 포워딩 상태 메시지 표시
    showForwardingProgress('Gmail을 통해 이메일을 전송하고 있습니다...');
    
    // 실제 Gmail 이메일 전송
    sendForwardingEmail(email, name, reason, taskContent, notifyOriginal);
}

// Gmail API를 통한 이메일 전송
async function sendForwardingEmail(toEmail, toName, reason, taskContent, notifyOriginal) {
    try {
        console.log('📧 Gmail API를 통한 이메일 전송 시작...');
        showForwardingProgress('사용자 정보를 확인하고 있습니다...');
        
        // 현재 로그인된 사용자 정보 가져오기
        const userInfo = await getCurrentUserInfo();
        const fromEmail = userInfo.email;
        const fromName = userInfo.name || '사용자';
        
        console.log('👤 발신자 정보:', { fromEmail, fromName });
        console.log('📮 수신자 정보:', { toEmail, toName });
        
        showForwardingProgress('이메일 내용을 작성하고 있습니다...');
        
        // 이메일 제목 생성
        const subject = `[업무 포워딩] ${taskContent}`;
        
        // 이메일 본문 생성
        const emailBody = createForwardingEmailBody(fromName, toName, taskContent, reason);
        
        // RFC 2822 형식으로 이메일 메시지 생성
        const rawMessage = createRawMessage(fromEmail, toEmail, subject, emailBody);
        
        console.log('📝 이메일 메시지 생성 완료');
        showForwardingProgress('Gmail API를 통해 이메일을 전송하고 있습니다...');
        
        // Gmail API로 이메일 전송
        const response = await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: rawMessage
            }
        });
        
        console.log('✅ 이메일 전송 성공:', response);
        showForwardingProgress('이메일 전송이 완료되었습니다!');
        
        // 0.5초 지연 후 성공 처리 (사용자가 완료 메시지를 볼 수 있도록)
        setTimeout(() => {
            hideForwardingProgress();
            handleForwardingSuccess(toName, taskContent, toEmail);
        }, 500);
        
    } catch (error) {
        console.error('❌ 이메일 전송 실패:', error);
        hideForwardingProgress();
        handleForwardingError(error);
    }
}

// 현재 로그인된 사용자 정보 가져오기
async function getCurrentUserInfo() {
    try {
        console.log('📋 사용자 정보 확인 중...');
        
        // 1. localStorage에서 사용자 정보 먼저 확인
        const savedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        console.log('💾 localStorage 사용자 정보:', savedUserInfo);
        
        if (savedUserInfo.email && savedUserInfo.name) {
            console.log('✅ localStorage에서 사용자 정보 사용:', savedUserInfo);
            return {
                email: savedUserInfo.email,
                name: savedUserInfo.name
            };
        }
        
        // 2. Gmail API 토큰 상태 확인
        const token = gapi.client.getToken();
        console.log('🔑 현재 Gmail 토큰 상태:', token);
        
        if (!token || !token.access_token) {
            console.warn('⚠️ Gmail 토큰이 없습니다. Google 로그인이 필요합니다.');
            throw new Error('Gmail API 토큰이 없습니다.');
        }
        
        // 3. Google API에서 사용자 정보 가져오기
        console.log('🌐 Google API에서 사용자 정보 요청 중...');
        const response = await gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v2/userinfo'
        });
        
        console.log('✅ Google API 응답:', response.result);
        
        const userInfo = {
            email: response.result.email,
            name: response.result.name || response.result.email
        };
        
        // localStorage에 저장
        const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const updatedUserInfo = { ...currentUserInfo, ...userInfo };
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        console.log('💾 사용자 정보 localStorage에 업데이트:', updatedUserInfo);
        
        return userInfo;
        
    } catch (error) {
        console.error('❌ 사용자 정보 가져오기 실패:', error);
        
        // 에러 발생 시 localStorage에서라도 이메일 정보 시도
        const savedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (savedUserInfo.email) {
            console.log('🔄 에러 시 localStorage 정보 사용:', savedUserInfo);
            return {
                email: savedUserInfo.email,
                name: savedUserInfo.name || savedUserInfo.email
            };
        }
        
        // 완전히 실패한 경우
        throw new Error(`사용자 정보를 가져올 수 없습니다: ${error.message}`);
    }
}

// 포워딩 이메일 본문 생성
function createForwardingEmailBody(fromName, toName, taskContent, reason) {
    const currentDate = new Date().toLocaleDateString('ko-KR');
    const currentTime = new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // 업무 상세 정보 추출
    const deadlineInfo = $('#ws-deadline').text() || '확인 필요';
    const receiptDate = $('#ws-receipt-date').text() || '정보 없음';
    const assignee = $('#ws-assignee').text() || '정보 없음';
    
    return `
안녕하세요, ${toName}님

${fromName}님께서 다음 업무를 귀하에게 포워딩하였습니다.

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   📋 업무 포워딩 정보                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📌 업무 내용: ${taskContent}

📅 포워딩 일시: ${currentDate} ${currentTime}
👤 포워딩자: ${fromName}
👥 수신자: ${toName}

📋 기존 업무 정보:
├─ 마감일: ${deadlineInfo}
├─ 접수일: ${receiptDate}
└─ 원 할당자: ${assignee}

📝 포워딩 사유:
${reason}

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    ⚠️ 중요 안내                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. 본 업무는 Do Click 시스템을 통해 포워딩된 것입니다.
2. 업무 수행 후 시스템에서 완료 처리해주시기 바랍니다.
3. 문의사항은 ${fromName}님께 직접 연락해주세요.

▶ Do Click 시스템 접속: https://your-domain.com
▶ 업무 관리 가이드: https://help.do-click.com

감사합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do Click - 대학원생 행정업무 도우미
언제 다하지? 하기도 전에 끝나요!

본 메일은 자동으로 발송된 메일입니다.
회신하지 마시고, 문의사항은 포워딩자에게 직접 연락바랍니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
}

// RFC 2822 형식의 이메일 메시지 생성
function createRawMessage(from, to, subject, body) {
    const messageParts = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(body)))
    ];
    
    const message = messageParts.join('\r\n');
    return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 포워딩 성공 처리
function handleForwardingSuccess(toName, taskContent, toEmail) {
    console.log('🎉 포워딩 성공 처리');
    
    // 성공 메시지 표시
    showForwardingResult('success', `${toName}님(${toEmail})에게 "${taskContent}" 업무가 성공적으로 포워딩되었습니다!`);
    
    // 체크리스트 업데이트
    updateForwardingInChecklist(toName);
    
    // 폼 초기화
    resetForwardingForm();
    
    // 포워딩 기록 저장
    saveForwardingRecord({
        email: toEmail,
        name: toName,
        taskContent: taskContent,
        timestamp: new Date().toISOString(),
        status: 'sent_via_gmail'
    });
    
    // 버튼 상태 복구
    $('#forwarding-submit').prop('disabled', false).html('<i class="fas fa-paper-plane mr-2"></i>포워딩 신청');
}

// 포워딩 실패 처리
function handleForwardingError(error) {
    console.error('💥 포워딩 실패 처리:', error);
    console.error('💥 오류 상세:', {
        status: error.status,
        message: error.message,
        result: error.result
    });
    
    let errorMessage = '이메일 전송 중 오류가 발생했습니다.';
    let actionButton = '';
    
    if (error.message && error.message.includes('Gmail API 토큰이 없습니다')) {
        errorMessage = 'Gmail 로그인이 필요합니다.';
        actionButton = '<button class="btn btn-sm btn-primary mt-2" onclick="requestGmailLogin()">Gmail 로그인</button>';
    } else if (error.message && error.message.includes('사용자 정보를 가져올 수 없습니다')) {
        errorMessage = '사용자 정보 확인에 실패했습니다. Gmail 권한을 다시 요청해주세요.';
        actionButton = '<button class="btn btn-sm btn-warning mt-2" onclick="requestGmailPermission()">권한 재요청</button>';
    } else if (error.status === 403) {
        errorMessage = 'Gmail 전송 권한이 없습니다. 권한을 다시 요청해주세요.';
        actionButton = '<button class="btn btn-sm btn-warning mt-2" onclick="requestGmailPermission()">권한 재요청</button>';
    } else if (error.status === 401) {
        errorMessage = 'Google 로그인이 만료되었습니다. 다시 로그인해주세요.';
        actionButton = '<button class="btn btn-sm btn-primary mt-2" onclick="requestGmailLogin()">다시 로그인</button>';
    } else if (error.result && error.result.error) {
        errorMessage = `Gmail 오류: ${error.result.error.message}`;
        if (error.result.error.code === 400) {
            errorMessage += ' (이메일 형식을 확인해주세요)';
        }
    } else if (error.message) {
        errorMessage = `오류: ${error.message}`;
    }
    
    showForwardingResult('danger', errorMessage + actionButton);
    
    // 버튼 상태 복구
    $('#forwarding-submit').prop('disabled', false).html('<i class="fas fa-paper-plane mr-2"></i>Gmail로 전송');
}

// 포워딩 폼 초기화
function resetForwardingForm() {
    $('#forwarding-email').val('');
    $('#forwarding-name').val('');
    $('#forwarding-reason').val('');
    $('#notify-original-assignee').prop('checked', false);
}

// 포워딩 진행 상황 표시
function showForwardingProgress(message) {
    const progressHtml = `
        <div id="forwarding-progress" class="alert alert-info" style="margin-top: 15px;">
            <i class="fas fa-paper-plane fa-spin"></i> ${message}
        </div>
    `;
    
    // 기존 진행 상황 메시지 제거
    $('#forwarding-progress').remove();
    
    // 새 진행 상황 메시지 추가
    $('#forwarding-submit').after(progressHtml);
}

// 포워딩 진행 상황 숨기기
function hideForwardingProgress() {
    $('#forwarding-progress').fadeOut(function() {
        $(this).remove();
    });
}

// Gmail 연결 상태 확인
async function checkGmailConnectionStatus() {
    const statusIndicator = $('#gmail-status-indicator');
    const infoBox = $('.gmail-info-box');
    
    console.log('🔍 Gmail 연결 상태 확인 중...');
    
    if (typeof gapi === 'undefined' || !gapi.client) {
        // Gmail API가 로드되지 않음
        console.log('⚠️ Gmail API가 로드되지 않음');
        statusIndicator.html('<span class="badge badge-warning">Gmail API 로딩 중...</span>');
        infoBox.show();
        
        // 3초 후 다시 확인
        setTimeout(checkGmailConnectionStatus, 3000);
        return;
    }
    
    // 로그인 상태 확인
    const token = gapi.client.getToken();
    console.log('🔑 현재 토큰 상태:', token);
    
    if (token && token.access_token) {
        try {
            // Gmail API 접근 테스트
            console.log('📧 Gmail API 접근 테스트 중...');
            await gapi.client.gmail.users.getProfile({
                userId: 'me'
            });
            
            // 성공 - Gmail 연동됨
            console.log('✅ Gmail API 접근 성공');
            const userInfo = await getCurrentUserInfo();
            statusIndicator.html(`
                <span class="badge badge-success">
                    <i class="fas fa-check-circle mr-1"></i>Gmail 연동됨 (${userInfo.email})
                </span>
            `);
            infoBox.hide();
            updateForwardingUIForLoggedIn();
            
        } catch (error) {
            console.error('❌ Gmail API 접근 실패:', error);
            statusIndicator.html(`
                <span class="badge badge-warning">
                    <i class="fas fa-exclamation-triangle mr-1"></i>Gmail 권한 필요
                </span>
                <button class="btn btn-sm btn-outline-primary ml-2" onclick="requestGmailPermission()">
                    권한 요청
                </button>
            `);
            infoBox.show();
            updateForwardingUIForLoggedOut();
        }
    } else {
        // 로그인 안됨
        console.log('🔐 Gmail 토큰 없음');
        statusIndicator.html(`
            <span class="badge badge-danger">
                <i class="fas fa-exclamation-circle mr-1"></i>Gmail 로그인 필요
            </span>
            <button class="btn btn-sm btn-outline-primary ml-2" onclick="requestGmailLogin()">
                로그인
            </button>
        `);
        infoBox.show();
        updateForwardingUIForLoggedOut();
    }
}

// Gmail 로그인 상태일 때 UI 업데이트
function updateForwardingUIForLoggedIn() {
    $('#forwarding-submit').prop('disabled', false).removeClass('btn-secondary').addClass('btn-primary');
    $('#forwarding-preview-btn').prop('disabled', false);
}

// Gmail 로그아웃 상태일 때 UI 업데이트
function updateForwardingUIForLoggedOut() {
    $('#forwarding-submit').prop('disabled', true).removeClass('btn-primary').addClass('btn-secondary');
    $('#forwarding-preview-btn').prop('disabled', true);
}

// 포워딩 미리보기 표시
async function showForwardingPreview() {
    const toEmail = $('#forwarding-email').val().trim();
    const toName = $('#forwarding-name').val().trim();
    const taskContent = $('#ws-task-content').text().trim();
    
    if (!toEmail || !toName) {
        showForwardingResult('warning', '수신자 정보를 먼저 입력해주세요.');
        return;
    }
    
    if (!taskContent || taskContent === '체크리스트에서 업무를 클릭하면 상세 정보가 표시됩니다') {
        showForwardingResult('warning', '포워딩할 업무를 먼저 선택해주세요.');
        return;
    }
    
    try {
        // 사용자 정보 가져오기
        const userInfo = await getCurrentUserInfo();
        const fromEmail = userInfo.email;
        const fromName = userInfo.name || '사용자';
        
        // 미리보기 정보 업데이트
        const subject = `[업무 포워딩] ${taskContent}`;
        $('#preview-subject').text(subject);
        $('#preview-from').text(`${fromName} <${fromEmail}>`);
        $('#preview-to').text(`${toName} <${toEmail}>`);
        
        // 미리보기 영역 표시
        $('#forwarding-preview').slideDown();
        
        // 스크롤 이동
        $('html, body').animate({
            scrollTop: $('#forwarding-preview').offset().top - 100
        }, 500);
        
    } catch (error) {
        console.error('미리보기 생성 실패:', error);
                 showForwardingResult('danger', '미리보기를 생성할 수 없습니다. Gmail 로그인을 확인해주세요.');
     }
}

// Gmail 로그인 요청 (포워딩용)
function requestGmailLogin() {
    console.log('🔐 Gmail 로그인 요청 (포워딩용)...');
    
    // 먼저 gmail-api.js의 함수가 있는지 확인
    if (typeof window.requestGmailLogin === 'function' && window.requestGmailLogin !== requestGmailLogin) {
        console.log('📧 gmail-api.js의 로그인 함수 사용');
        window.requestGmailLogin();
        return;
    }
    
    // 직접 구현
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        console.log('🔐 직접 OAuth 토큰 요청...');
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: '96805366744-nb6s5bh1089o5vh3020in2kv3atq92ug.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
            callback: handleGmailAuthForForwarding,
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        showForwardingResult('danger', 'Google API가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
    }
}

// Gmail 권한 재요청
function requestGmailPermission() {
    console.log('🔑 Gmail 권한 재요청...');
    requestGmailLogin(); // 같은 로직 사용
}

// Gmail 인증 응답 처리 (포워딩용)
function handleGmailAuthForForwarding(response) {
    if (response.error) {
        console.error('❌ Gmail 인증 실패:', response.error);
        showForwardingResult('danger', `Gmail 인증 실패: ${response.error}`);
        return;
    }
    
    console.log('✅ Gmail 인증 성공');
    
    // 토큰 저장
    localStorage.setItem('gmail_access_token', response.access_token);
    gapi.client.setToken(response);
    
    // 상태 업데이트
    checkGmailConnectionStatus();
    
    showForwardingResult('success', 'Gmail 연동이 완료되었습니다! 이제 포워딩을 사용할 수 있습니다.');
}

// Gmail 연결 테스트
async function testGmailConnection() {
    console.log('🧪 Gmail 연결 테스트 시작...');
    
    try {
        showForwardingProgress('Gmail 연결을 테스트하고 있습니다...');
        
        // 1. GAPI 로드 확인
        if (typeof gapi === 'undefined') {
            throw new Error('Google API가 로드되지 않았습니다.');
        }
        
        // 2. 클라이언트 초기화 확인
        if (!gapi.client) {
            throw new Error('Google API 클라이언트가 초기화되지 않았습니다.');
        }
        
        // 3. Gmail API 로드 확인
        if (!gapi.client.gmail) {
            throw new Error('Gmail API가 로드되지 않았습니다.');
        }
        
        // 4. 토큰 확인
        const token = gapi.client.getToken();
        if (!token || !token.access_token) {
            throw new Error('Gmail 접근 토큰이 없습니다.');
        }
        
        console.log('🔑 토큰 확인 완료:', {
            hasToken: !!token,
            hasAccessToken: !!(token && token.access_token),
            tokenType: token ? typeof token.access_token : 'undefined'
        });
        
        // 5. Gmail API 호출 테스트
        showForwardingProgress('Gmail API 호출을 테스트하고 있습니다...');
        const response = await gapi.client.gmail.users.getProfile({
            userId: 'me'
        });
        
        console.log('📧 Gmail 프로필 응답:', response.result);
        
        // 6. 사용자 정보 확인
        showForwardingProgress('사용자 정보를 확인하고 있습니다...');
        const userInfo = await getCurrentUserInfo();
        
        console.log('👤 사용자 정보 확인 완료:', userInfo);
        
        // 7. 테스트 완료
        hideForwardingProgress();
        
        const testResults = `
            <div class="gmail-test-results">
                <h6><i class="fas fa-check-circle text-success"></i> Gmail 연결 테스트 성공!</h6>
                <ul class="list-unstyled">
                    <li>✅ Gmail 계정: ${userInfo.email}</li>
                    <li>✅ 사용자명: ${userInfo.name}</li>
                    <li>✅ 총 메시지: ${response.result.messagesTotal || 'N/A'}개</li>
                    <li>✅ Gmail 전송 권한: 확인됨</li>
                </ul>
                <small class="text-muted">포워딩 기능을 사용할 준비가 완료되었습니다!</small>
            </div>
        `;
        
        showForwardingResult('success', testResults);
        
        // 상태 업데이트
        checkGmailConnectionStatus();
        
    } catch (error) {
        console.error('❌ Gmail 연결 테스트 실패:', error);
        hideForwardingProgress();
        
        const errorResults = `
            <div class="gmail-test-results">
                <h6><i class="fas fa-times-circle text-danger"></i> Gmail 연결 테스트 실패</h6>
                <div class="alert alert-danger mt-2">
                    <strong>오류:</strong> ${error.message}
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary" onclick="requestGmailLogin()">Gmail 로그인</button>
                    <button class="btn btn-sm btn-warning ml-2" onclick="requestGmailPermission()">권한 재요청</button>
                </div>
            </div>
        `;
        
        showForwardingResult('danger', errorResults);
    }
}

function showForwardingResult(type, message) {
    // 기존 결과 메시지 제거
    $('#forwarding-result').remove();
    
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    const resultDiv = `
        <div id="forwarding-result" class="alert ${alertClass} mt-3" role="alert">
            <i class="fas fa-${icon}"></i> ${message}
        </div>
    `;
    
    $('#forwarding-submit').after(resultDiv);
    
    // 3초 후 자동 제거
    setTimeout(function() {
        $('#forwarding-result').fadeOut(function() {
            $(this).remove();
        });
    }, 3000);
}

function updateForwardingInChecklist(newForwardingName) {
    const taskContent = $('#ws-task-content').text();
    $('.task-content').each(function() {
        const rowTaskContent = $(this).text().trim();
        if (rowTaskContent === taskContent.trim()) {
            $(this).closest('tr').find('td:eq(5)').text(newForwardingName);
        }
    });
}

function saveForwardingRecord(data) {
    const records = JSON.parse(localStorage.getItem('forwarding_records') || '[]');
    records.push(data);
    localStorage.setItem('forwarding_records', JSON.stringify(records));
    console.log('포워딩 기록 저장됨:', data);
}

// 방해금지모드 관련 함수들 비활성화
function toggleDNDMode() {
    // 방해금지모드 기능 비활성화
    return;
}

// 마감일 업데이트 함수
function updateDeadlines() {
    $('.deadline-date').each(function() {
        const deadlineStr = $(this).data('deadline');
        $(this).html(getDaysRemaining(deadlineStr));
    });
}

// 초기화 함수들
function initNavigation() {
    $('.navbar-button').on('click', function() {
        $('.navbar .single-page-nav').toggleClass('show');
    });
    
    $('.navbar-nav .nav-link').on('click', function() {
        $('.navbar .single-page-nav').removeClass('show');
    });
    
    $(document).on('click', function(event) {
        if (!$('.navbar').is(event.target) && 
            $('.navbar').has(event.target).length === 0 && 
            !$('.navbar-button').is(event.target) && 
            $('.navbar-button').has(event.target).length === 0 && 
            $('.navbar .single-page-nav').hasClass('show')) {
            $('.navbar .single-page-nav').removeClass('show');
        }
    });
}

function initDateFunctions() {
    const today = new Date();
    $('#custom-date').val(today.toISOString().split('T')[0]);
    
    $('#custom-date').on('change', function() {
        customDate = new Date($(this).val());
        updateTaskSummary();
        updateDeadlines();
    });
    
    $('#reset-date').on('click', function() {
        const today = new Date();
        $('#custom-date').val(today.toISOString().split('T')[0]);
        customDate = today;
        updateTaskSummary();
        updateDeadlines();
    });
}

function initChecklistFunctions() {
    $('.checkbox-img').on('click', function() {
        toggleCheckbox(this);
    });
    
    $('tbody tr').on('click', function() {
        const checkbox = $(this).find('.checkbox-img');
        const status = checkbox.data('status');
        const deadline = $(this).find('.deadline-date').data('deadline');
        const receiptDate = $(this).find('.receipt-date').data('receipt');
        const taskContent = $(this).find('.task-content').text();
        const assignee = $(this).find('td:eq(4)').text();
        const forwarding = $(this).find('td:eq(5)').text();
        
        showWorkspaceContent(taskContent, status, deadline, receiptDate, assignee, forwarding);
        
        $('html, body').animate({
            scrollTop: $('#section-workspace').offset().top
        }, 800);
    });
}

function initWorkspaceFunctions() {
    // 기본 작업실 컨텐츠 표시
    showDefaultWorkspaceContent();
}

function initForwardingFunctions() {
    console.log('포워딩 기능 초기화 중...');
    
    // 기존 이벤트 제거
    $('#forwarding-submit').off('click');
    $('#forwarding-preview-btn').off('click');
    
    // 포워딩 전송 이벤트 바인딩
    $('#forwarding-submit').on('click', function(e) {
        e.preventDefault();
        console.log('Gmail 포워딩 버튼 클릭됨');
        handleForwarding();
    });
    
    // 미리보기 이벤트 바인딩
    $('#forwarding-preview-btn').on('click', function(e) {
        e.preventDefault();
        console.log('포워딩 미리보기 버튼 클릭됨');
        showForwardingPreview();
    });
    
    // Gmail 상태 확인 (주기적으로)
    checkGmailConnectionStatus();
    setInterval(checkGmailConnectionStatus, 10000); // 10초마다 확인
    
    console.log('포워딩 기능 초기화 완료');
}

function initSubmitFunctions() {
    $("#submit").on("click", function () {
        const email = $("#submit-email").val();
        const advice = $("#submit-advice").val();

        function validateEmail(email) {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(email);
        }

        if (email == '' || !validateEmail(email)) {
            alert("이메일이 유효하지 않아 알림을 드릴 수가 없습니다. ");
            return;
        }

        var finalData = JSON.stringify({
            "id": getUVfromCookie(),
            "email": email,
            "advice": advice
        })

        axios.get('https://script.google.com/macros/s/AKfycbzizOOhpr__UIANizUSF1ErlPJnXpM3EWyxOO2WRBjfD2JpzNrWAkK8IyZwz6f_nBcX/exec?action=insert&table=tab_final&data=' + finalData)
            .then(response => {
                console.log(response.data.data);
                // alert(JSON.stringify(response));
                $('#submit-email').val('');
                $('#submit-advice').val('');
                
                // simple-popup으로 성공 메시지 표시
                // $.fn.simplePopup({ type: "html", htmlSelector: "#popup" });
                $.fn.simplePopup({ type: "html", htmlSelector: "#popup" });
            })
            .catch(error => {
                console.error('제출 실패:', error);
                alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
            })
            .finally(() => {
                // 버튼 상태 복구
                $('#submit').prop('disabled', false).text('지금 제출!');
            });
    });
}

// 기존 submitToGoogleScript 함수는 새로운 axios 방식으로 교체됨

// 로컬 스토리지에 제출 데이터 저장
function saveSubmissionLocally(data) {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    submissions.push(data);
    localStorage.setItem('submissions', JSON.stringify(submissions));
}

// 쿠키에서 값을 가져오는 함수
function getCookieValue(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
}

// 쿠키에 값을 저장하는 함수
function setCookieValue(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getUVfromCookie() {
    // 6자리 임의의 문자열 생성
    const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
    // 쿠키에서 기존 해시 값을 가져옴
    const existingHash = getCookieValue("user");
    // 기존 해시 값이 없으면, 새로운 해시 값을 쿠키에 저장
    if (!existingHash) {
        setCookieValue("user", hash, 180); // 쿠키 만료일은 6개월 
        return hash;
    } else {
        // 기존 해시 값이 있으면, 기존 값을 반환
        return existingHash;
    }
}

// 인증 모드 전환 함수 추가
function toggleAuthMode() {
    const loginForm = $('#login-form');
    const signupForm = $('#signup-form');
    
    if (loginForm.is(':visible')) {
        loginForm.hide();
        signupForm.show();
    } else {
        signupForm.hide();
        loginForm.show();
    }
}

// Sam pading value to start with 0. eg: 01, 02, .. 09, 10, ..
function padValue(value) {
    return (value < 10) ? "0" + value : value;
}

function getTimeStamp() {
    const date = new Date();

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formattedDate = `${padValue(year)}-${padValue(month)}-${padValue(day)} ${padValue(hours)}:${padValue(minutes)}:${padValue(seconds)}`;

    return formattedDate;
}

// UTM 가져오기
function getUTMParams() {
    var queryString = location.search;
    const urlParams = new URLSearchParams(queryString);
    const utm = urlParams.get("utm");
    return utm || 'none';
}

// Device 가져오기
function getDeviceType() {
    var mobile = 'desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // true for mobile device
        mobile = 'mobile';
    }
    return mobile;
}

// 인라인 사용자 정보 입력 관련 변수
let inlineCurrentStep = 0;
let inlineUserInfo = {
    name: '',
    email: '',
    department: '',
    birthdate: '',
    adminEmail: '',
    advisorName: ''
};

// 인라인 다음 단계
function nextInlineStep() {
    console.log(`🚶‍♂️ 다음 단계로 이동 시작 - 현재 단계: ${inlineCurrentStep}`);
    
    const currentStepData = getInlineCurrentStepData();
    console.log(`📝 현재 단계 입력 데이터:`, currentStepData);
    
    if (!validateInlineCurrentStep(currentStepData)) {
        console.log('❌ 입력 데이터 검증 실패');
        return;
    }
    
    console.log('✅ 입력 데이터 검증 성공');
    saveInlineCurrentStepData(currentStepData);
    
    if (inlineCurrentStep < 5) {
        inlineCurrentStep++;
        console.log(`➡️ 다음 단계로 이동: ${inlineCurrentStep}`);
        updateInlineProgress();
        showInlineStep(inlineCurrentStep);
    } else {
        console.log('🎯 모든 단계 완료 - 온보딩 마무리');
        completeInlineOnboarding();
    }
}

// 인라인 건너뛰기
function skipInlineStep() {
    if (inlineCurrentStep < 5) {
        inlineCurrentStep++;
        updateInlineProgress();
        showInlineStep(inlineCurrentStep);
    } else {
        completeInlineOnboarding();
    }
}

// 현재 단계 데이터 가져오기
function getInlineCurrentStepData() {
    switch(inlineCurrentStep) {
        case 0:
            return $('#inline-name-input').val();
        case 1:
            return $('#inline-email-input').val();
        case 2:
            return $('#inline-department-input').val();
        case 3:
            return $('#inline-birthdate-input').val();
        case 4:
            return $('#inline-admin-email-input').val();
        case 5:
            return $('#inline-advisor-name-input').val();
        default:
            return '';
    }
}

// 현재 단계 검증
function validateInlineCurrentStep(data) {
    if (!data.trim()) {
        showInlineStepError('이 필드를 입력해주세요.');
        return false;
    }
    
    // 이메일 검증 (사용자 이메일과 행정실 이메일)
    if (inlineCurrentStep === 1 || inlineCurrentStep === 4) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data)) {
            showInlineStepError('올바른 이메일 형식을 입력해주세요.');
            return false;
        }
    }
    
    return true;
}

// 현재 단계 데이터 저장
function saveInlineCurrentStepData(data) {
    console.log(`💾 단계 ${inlineCurrentStep} 데이터 저장:`, data);
    
    switch(inlineCurrentStep) {
        case 0:
            inlineUserInfo.name = data;
            console.log('✅ 이름 저장됨:', inlineUserInfo.name);
            break;
        case 1:
            inlineUserInfo.email = data;
            console.log('✅ 이메일 저장됨:', inlineUserInfo.email);
            break;
        case 2:
            inlineUserInfo.department = data;
            console.log('✅ 학과 저장됨:', inlineUserInfo.department);
            break;
        case 3:
            inlineUserInfo.birthdate = data;
            console.log('✅ 생년월일 저장됨:', inlineUserInfo.birthdate);
            break;
        case 4:
            inlineUserInfo.adminEmail = data;
            console.log('✅ 행정실 이메일 저장됨:', inlineUserInfo.adminEmail);
            break;
        case 5:
            inlineUserInfo.advisorName = data;
            console.log('✅ 지도교수 저장됨:', inlineUserInfo.advisorName);
            break;
    }
    
    console.log('📋 현재 inlineUserInfo 전체:', inlineUserInfo);
}

// 진행률 업데이트
function updateInlineProgress() {
    const progress = ((inlineCurrentStep + 1) / 6) * 100;
    $('.user-info-progress .progress-fill').css('width', progress + '%');
    $('.user-info-progress .progress-text').text(`${inlineCurrentStep + 1} / 6 단계`);
}

// 단계 표시
function showInlineStep(step) {
    $('.user-info-step').removeClass('active');
    $(`.user-info-step[data-step="${step}"]`).addClass('active');
    
    // Google 로그인으로 얻은 정보 자동 입력
    if (step === 1 && inlineUserInfo.email) {
        $('#inline-email-input').val(inlineUserInfo.email);
    }
    
    // 생년월일 단계에서 자동 진행 설정
    if (step === 3) {
        setupBirthdateAutoProgress();
    }
    
    // 입력 필드에 포커스
    setTimeout(() => {
        $('.user-info-step.active input').focus();
    }, 300);
}

// 인라인 온보딩 완료
function completeInlineOnboarding() {
    console.log('🎯 completeInlineOnboarding 함수 실행 시작');
    console.log('📋 현재 inlineUserInfo:', inlineUserInfo);
    
    try {
        // 완료 메시지 표시
        $('.user-info-step').removeClass('active');
        $('#inline-completion-step').addClass('active');
        
        // 사용자 정보 저장 (개발 모드 관계없이)
        console.log('💾 사용자 정보 저장 시작...');
        localStorage.setItem('userInfo', JSON.stringify(inlineUserInfo));
        localStorage.setItem('isLoggedIn', 'true');
        console.log('✅ 사용자 정보 저장 완료:', inlineUserInfo);
        
        // 저장된 정보 즉시 확인
        const savedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        console.log('🔍 저장된 정보 확인:', savedUserInfo);
        console.log('📧 행정실 이메일 확인:', savedUserInfo.adminEmail);
        
        console.log('📊 localStorage 전체 상태:', {
            userInfo: localStorage.getItem('userInfo'),
            isLoggedIn: localStorage.getItem('isLoggedIn'),
            developmentMode: DEVELOPMENT_MODE
        });
        
        // 완료 단계가 제대로 표시되었는지 확인
        const completionStep = $('#inline-completion-step');
        if (completionStep.length > 0 && completionStep.hasClass('active')) {
            console.log('✅ 완료 단계 표시 성공');
        } else {
            console.error('❌ 완료 단계 표시 실패');
        }
        
    } catch (error) {
        console.error('❌ completeInlineOnboarding 실행 중 오류:', error);
    }
}

// Do Click 서비스 시작 (Gmail 검색 포함)
function startDoClickService() {
    console.log('🚀 Do Click 서비스 시작...');
    
    try {
        // localStorage 전체 상태 확인
        console.log('💾 localStorage 전체 상태 확인:');
        console.log('- userInfo:', localStorage.getItem('userInfo'));
        console.log('- isLoggedIn:', localStorage.getItem('isLoggedIn'));
        
        // 사용자 정보 확인
        const savedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        console.log('📋 파싱된 사용자 정보:', savedUserInfo);
        console.log('📋 사용자 정보 키 목록:', Object.keys(savedUserInfo));
        
        // 행정실 이메일 확인 - 더 자세한 로깅
        const adminEmail = savedUserInfo.adminEmail;
        console.log('📧 행정실 이메일 추출 결과:', {
            adminEmail: adminEmail,
            type: typeof adminEmail,
            length: adminEmail ? adminEmail.length : 0,
            trimmed: adminEmail ? adminEmail.trim() : '',
            isEmpty: !adminEmail,
            isEmptyAfterTrim: !adminEmail || !adminEmail.trim()
        });
        
        // 메인 콘텐츠 표시
        showMainContentWithoutSearch();
        
        // 행정실 이메일이 있으면 Gmail 검색 시작
        if (adminEmail && adminEmail.trim()) {
            console.log('✅ 행정실 이메일이 유효함 - Gmail 검색 시작:', adminEmail);
            setTimeout(() => {
                startAdminEmailSearchFromStart(adminEmail);
            }, 1000); // 메인 콘텐츠 표시 후 1초 뒤 검색 시작
        } else {
            console.log('❌ 행정실 이메일이 없거나 비어있음');
            console.log('⚠️ 사용자 정보 전체:', savedUserInfo);
            console.log('⚠️ 행정실 이메일이 설정되지 않아서 Gmail 검색을 건너뜁니다.');
            showNoAdminEmailMessage();
        }
        
    } catch (error) {
        console.error('❌ Do Click 서비스 시작 중 오류:', error);
        console.error('❌ 오류 상세:', error.message);
        forceShowMainContent();
    }
}

// 메인 콘텐츠 표시 (검색 없이)
function showMainContentWithoutSearch() {
    console.log('📱 메인 콘텐츠 표시 시작...');
    
    try {
        // 사용자 정보 확인
        const savedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        // 확실하게 요소들이 존재하는지 확인
        if ($('#user-info-section').length === 0) {
            console.error('user-info-section 요소를 찾을 수 없습니다');
            return;
        }
        
        if ($('#main-content').length === 0) {
            console.error('main-content 요소를 찾을 수 없습니다');
            return;
        }
        
        console.log('🎬 페이드아웃 시작...');
        $('#user-info-section').fadeOut(500, function() {
            console.log('✨ 페이드인 시작...');
            $('#main-content').fadeIn(500);
            $('#tm-header').show();
            
            // 사용자 이름으로 환영 메시지 업데이트
            if (savedUserInfo && savedUserInfo.name) {
                const taskSummaryElement = $('#task-summary');
                if (taskSummaryElement.length > 0) {
                    const currentSummary = taskSummaryElement.html();
                    const newSummary = currentSummary.replace('좋은 하루에요!', `${savedUserInfo.name}님, 좋은 하루에요!`);
                    taskSummaryElement.html(newSummary);
                    console.log('👋 환영 메시지 업데이트 완료');
                }
            }
            
            // 페이지 최상단으로 스크롤
            $('html, body').animate({ scrollTop: 0 }, 500);
            console.log('✅ 메인 콘텐츠 표시 완료');
        });
        
    } catch (error) {
        console.error('❌ 메인 콘텐츠 표시 중 오류:', error);
        forceShowMainContent();
    }
}

// 메인 콘텐츠 표시 (기존 함수 - 호환성 유지)
function showMainContent() {
    console.log('📱 showMainContent 호출됨 (호환성 모드)');
    showMainContentWithoutSearch();
}

// 생년월일 자동 진행 설정
function setupBirthdateAutoProgress() {
    const birthdateInput = $('#inline-birthdate-input');
    
    // 기존 이벤트 리스너 제거
    birthdateInput.off('change.autoProgress input.autoProgress');
    
    // 날짜 입력 완료 시 자동 진행
    birthdateInput.on('change.autoProgress', function() {
        const value = $(this).val();
        console.log('생년월일 입력값:', value);
        
        // 값이 있고 올바른 형식이면 자동으로 다음 단계로
        if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log('유효한 날짜 입력 감지, 자동 진행 시작...');
            
            // 약간의 지연 후 자동 진행
            setTimeout(() => {
                if (validateInlineCurrentStep(value)) {
                    console.log('유효성 검증 통과, 다음 단계로 이동');
                    nextInlineStep();
                } else {
                    console.log('유효성 검증 실패');
                }
            }, 500);
        }
    });
    
    // 키보드 입력으로도 체크 (일부 브라우저에서는 change 이벤트가 늦게 발생)
    birthdateInput.on('input.autoProgress', function() {
        const value = $(this).val();
        if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // input 이벤트에서는 더 짧은 지연
            setTimeout(() => {
                if (validateInlineCurrentStep(value)) {
                    nextInlineStep();
                }
            }, 300);
        }
    });
}

// 인라인 단계 에러 표시
function showInlineStepError(message) {
    const errorDiv = $('.user-info-step.active .step-error');
    // 줄바꿈 지원을 위해 html() 사용하고 \n을 <br>로 변환
    const htmlMessage = message.replace(/\n/g, '<br>');
    errorDiv.html(htmlMessage).show().delay(5000).fadeOut();
}

// 개발용: 사용자 정보 초기화 함수 (브라우저 콘솔에서 resetUserInfo() 실행)
function resetUserInfo() {
    console.log('🔄 사용자 정보 초기화 시작...');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    console.log('✅ localStorage 정리 완료');
    console.log('🔄 페이지 새로고침...');
    location.reload();
}

// 강제 사용자 정보 섹션 표시 (디버깅용)
function forceShowUserSection() {
    console.log('🔧 강제 사용자 정보 섹션 표시');
    showUserInfoSection();
}

// 강제 메인 콘텐츠 표시 (디버깅용)
function forceShowMain() {
    console.log('🔧 강제 메인 콘텐츠 표시');
    showMainContent();
}

// Google 로그인 처리
function handleGoogleLogin() {
    console.log('🔐 Google 로그인 시작...');
    console.log('📍 현재 URL:', window.location.href);
    console.log('📍 현재 Origin:', window.location.origin);
    
    // file:// 프로토콜 체크
    if (window.location.protocol === 'file:') {
        showInlineStepError('Google 로그인은 로컬 서버에서만 작동합니다. 다음 명령어로 서버를 실행해주세요:\n\npython -m http.server 8000\n또는\nnpx serve .');
        return;
    }
    
    // 버튼 로딩 상태
    const btn = document.getElementById('google-login-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 로그인 중...';
    btn.disabled = true;
    
    // Google API 초기화 확인
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('❌ Google API가 로드되지 않았습니다.');
        showInlineStepError('Google API를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
        resetGoogleLoginButton(btn, originalText);
        return;
    }
    
    try {
        // Google Identity Services 초기화
        google.accounts.id.initialize({
            client_id: '96805366744-nb6s5bh1089o5vh3020in2kv3atq92ug.apps.googleusercontent.com',
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: false
        });
        
        // 로그인 프롬프트 표시
        google.accounts.id.prompt((notification) => {
            console.log('🔔 Google One Tap 알림:', notification);
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log('🔐 Google One Tap이 표시되지 않음, 수동 로그인으로 전환');
                console.log('🔐 One Tap 실패 이유:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || 'Unknown');
                // One Tap이 실패한 경우 OAuth2로 전환
                initiateGoogleOAuth();
            }
            resetGoogleLoginButton(btn, originalText);
        });
        
    } catch (error) {
        console.error('❌ Google 로그인 초기화 실패:', error);
        showInlineStepError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        resetGoogleLoginButton(btn, originalText);
    }
}

// Google OAuth2 인증 시작
function initiateGoogleOAuth() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        console.error('❌ Google OAuth2 API가 로드되지 않았습니다.');
        return;
    }
    
    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '96805366744-nb6s5bh1089o5vh3020in2kv3atq92ug.apps.googleusercontent.com',
        scope: 'openid email profile',
        callback: handleGoogleOAuthResponse,
    });
    
    tokenClient.requestAccessToken({prompt: 'consent'});
}

// Google Sign-In 응답 처리 (ID Token)
function handleGoogleSignIn(response) {
    try {
        console.log('✅ Google Sign-In 응답 받음:', response);
        
        if (response.error) {
            console.error('❌ Google Sign-In 오류:', response.error);
            showInlineStepError(`Google 로그인 실패: ${response.error}`);
            return;
        }
        
        console.log('✅ Google Sign-In 성공');
        
        // JWT 토큰 파싱
        const credential = response.credential;
        const payload = parseJwt(credential);
        
        console.log('👤 사용자 정보:', payload);
        
        // 사용자 정보 추출
        const userInfo = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            verified: payload.email_verified
        };
        
        processGoogleLoginSuccess(userInfo);
        
    } catch (error) {
        console.error('❌ Google Sign-In 처리 실패:', error);
        showInlineStepError('로그인 정보 처리 중 오류가 발생했습니다.');
    }
}

// Google OAuth2 응답 처리 (Access Token)
function handleGoogleOAuthResponse(response) {
    if (response.error) {
        console.error('❌ Google OAuth 실패:', response.error);
        
        // 구체적인 오류 메시지 제공
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        
        if (response.error === 'invalid_request') {
            errorMessage = '잘못된 요청입니다. redirect_uri_mismatch 오류일 가능성이 높습니다.';
        } else if (response.error === 'access_denied') {
            errorMessage = '로그인이 취소되었습니다.';
        } else if (response.error === 'unauthorized_client') {
            errorMessage = 'OAuth 클라이언트 설정을 확인해주세요.';
        } else if (response.error === 'redirect_uri_mismatch') {
            errorMessage = 'redirect_uri_mismatch: Google Cloud Console에서 Authorized URIs 설정을 확인해주세요.\n\n' +
                          '다음 URI들을 추가해야 합니다:\n' +
                          '• http://localhost:8000\n' +
                          '• http://127.0.0.1:8000\n' +
                          '• http://localhost:3000';
        }
        
        showInlineStepError(errorMessage);
        return;
    }
    
    console.log('✅ Google OAuth 성공');
    
    // 사용자 정보 가져오기
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${response.access_token}`
        }
    })
    .then(response => response.json())
    .then(userInfo => {
        console.log('👤 OAuth 사용자 정보:', userInfo);
        processGoogleLoginSuccess(userInfo);
    })
    .catch(error => {
        console.error('❌ 사용자 정보 가져오기 실패:', error);
        showInlineStepError('사용자 정보를 가져오는데 실패했습니다.');
    });
}

// Google 로그인 성공 처리
function processGoogleLoginSuccess(userInfo) {
    console.log('🎉 Google 로그인 처리 완료:', userInfo);
    
    // 이메일 도메인 검증 (선택사항)
    if (userInfo.email && !isValidUniversityEmail(userInfo.email)) {
        const proceed = confirm(`${userInfo.email}은 대학교 이메일이 아닙니다. 계속 진행하시겠습니까?`);
        if (!proceed) {
            showInlineStepError('대학교 이메일 사용을 권장합니다.');
            return;
        }
    }
    
    // 인라인 사용자 정보에 자동 입력
    inlineUserInfo.name = userInfo.name || '';
    inlineUserInfo.email = userInfo.email || '';
    
    // 입력 필드 업데이트
    $('#inline-name-input').val(inlineUserInfo.name);
    
    // 이메일은 다음 단계에서 자동으로 입력될 예정임을 표시
    if (inlineUserInfo.email) {
        showInlineStepSuccess(`환영합니다, ${userInfo.name}님! Google 계정 정보가 자동으로 입력됩니다.`);
    }
    
    // 성공 메시지 표시
    showInlineStepSuccess(`환영합니다, ${userInfo.name}님! 정보가 자동으로 입력되었습니다.`);
    
    // 2초 후 자동으로 다음 단계로 진행
    setTimeout(() => {
        nextInlineStep();
    }, 2000);
}

// JWT 토큰 파싱
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT 파싱 실패:', error);
        return {};
    }
}

// 대학교 이메일 검증
function isValidUniversityEmail(email) {
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
        'khu.ac.kr',
        'ac.kr' // 일반적인 대학교 도메인
    ];
    
    return universityDomains.some(domain => email.toLowerCase().endsWith('@' + domain));
}

// Google 로그인 버튼 리셋
function resetGoogleLoginButton(btn, originalText) {
    btn.innerHTML = originalText;
    btn.disabled = false;
}

// 성공 메시지 표시
function showInlineStepSuccess(message) {
    const successDiv = $('.user-info-step.active .step-error');
    successDiv.removeClass('text-danger').addClass('text-success');
    successDiv.text(message).show().delay(3000).fadeOut(() => {
        successDiv.removeClass('text-success').addClass('text-danger');
    });
}

// 개발 모드 토글 (콘솔에서 사용)
function toggleDevelopmentMode() {
    window.DEVELOPMENT_MODE = !DEVELOPMENT_MODE;
    console.log(`🔧 개발 모드 ${DEVELOPMENT_MODE ? '활성화' : '비활성화'}됨`);
    console.log('🔄 페이지를 새로고침하면 변경사항이 적용됩니다.');
}

// 현재 저장된 사용자 정보 확인 (콘솔에서 사용)
function checkStoredUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    console.log('📊 현재 저장된 정보:');
    console.log('- 로그인 상태:', isLoggedIn);
    console.log('- 사용자 정보:', userInfo ? JSON.parse(userInfo) : '없음');
    console.log('- 개발 모드:', DEVELOPMENT_MODE);
}

// 개발자용 도움말 (콘솔에서 help() 실행)
function help() {
    console.log('🔧 개발자용 명령어:');
    console.log('- resetUserInfo(): 사용자 정보 초기화');
    console.log('- forceShowUserSection(): 사용자 정보 입력 화면 표시');
    console.log('- forceShowMain(): 메인 콘텐츠 표시');
    console.log('- toggleDevelopmentMode(): 개발 모드 토글');
    console.log('- checkStoredUserInfo(): 저장된 정보 확인');
    console.log('- checkAdminEmail(): 행정실 이메일 상세 확인');
    console.log('- testGmailSearch(): Gmail 검색 테스트');
    console.log('- help(): 이 도움말 표시');
}

// 행정실 이메일 상세 확인 (디버깅용)
function checkAdminEmail() {
    console.log('📧 행정실 이메일 상세 확인:');
    
    // localStorage 확인
    const userInfoString = localStorage.getItem('userInfo');
    console.log('- localStorage userInfo (문자열):', userInfoString);
    
    if (userInfoString) {
        try {
            const userInfo = JSON.parse(userInfoString);
            console.log('- 파싱된 userInfo:', userInfo);
            console.log('- userInfo.adminEmail:', userInfo.adminEmail);
            console.log('- adminEmail 타입:', typeof userInfo.adminEmail);
            console.log('- adminEmail 길이:', userInfo.adminEmail ? userInfo.adminEmail.length : 0);
            console.log('- adminEmail trim 후:', userInfo.adminEmail ? userInfo.adminEmail.trim() : '');
        } catch (error) {
            console.error('- JSON 파싱 오류:', error);
        }
    } else {
        console.log('- localStorage에 userInfo가 없음');
    }
    
    // inlineUserInfo 확인
    console.log('- 현재 inlineUserInfo:', inlineUserInfo);
    console.log('- inlineUserInfo.adminEmail:', inlineUserInfo.adminEmail);
}

// Gmail 검색 테스트 (디버깅용)
function testGmailSearch() {
    console.log('🧪 Gmail 검색 테스트 시작...');
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const adminEmail = userInfo.adminEmail;
    
    if (adminEmail && adminEmail.trim()) {
        console.log('✅ 테스트용 Gmail 검색 시작:', adminEmail);
        startAdminEmailSearchFromStart(adminEmail);
    } else {
        console.log('❌ 행정실 이메일이 없어서 테스트할 수 없음');
        console.log('💡 checkAdminEmail() 함수로 상세 정보를 확인하세요');
    }
}

// 인라인 로그인 상태 확인 (팝업 없는 안전 모드)
function checkInlineLoginStatus() {
    console.log('🔍 인라인 로그인 상태 확인 시작 (팝업 방지 모드)');
    
    try {
        // 개발 모드에서는 항상 사용자 정보 입력 화면 표시
        if (DEVELOPMENT_MODE) {
            console.log('🔧 개발 모드: 사용자 정보 입력 화면 강제 표시');
            showUserInfoSection();
            return;
        }
        
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userInfo = localStorage.getItem('userInfo');
        
        console.log('📊 저장된 상태:', { 
            isLoggedIn: !!isLoggedIn, 
            hasUserInfo: !!userInfo 
        });
        
        if (isLoggedIn === 'true' && userInfo) {
            // 기존 사용자 - 메인 콘텐츠 바로 표시
            console.log('✅ 기존 사용자 감지 - 메인 콘텐츠 표시');
            try {
                const userData = JSON.parse(userInfo);
                console.log('👤 사용자 정보:', userData.name || '이름 없음');
            } catch (e) {
                console.warn('사용자 정보 파싱 오류:', e);
            }
            showMainContent();
        } else {
            // 새 사용자 - 인라인 정보 입력 표시
            console.log('📝 새 사용자 - 인라인 정보 입력 모드');
            showUserInfoSection();
        }
        
    } catch (error) {
        console.error('❌ 로그인 상태 확인 중 오류:', error);
        // 오류 시 안전하게 정보 입력 섹션 표시
        showUserInfoSection();
    }
}

// 사용자 정보 섹션 표시 (안전 모드)
function showUserInfoSection() {
    try {
        console.log('📋 사용자 정보 입력 섹션 표시');
        
        // jQuery 방식 시도
        if (typeof $ !== 'undefined') {
            $('#user-info-section').show().css('display', 'flex');
            $('#main-content').hide();
            $('#tm-header').hide();
            
            // 포커스 설정
            setTimeout(() => {
                const nameInput = $('#inline-name-input');
                if (nameInput.length > 0) {
                    nameInput.focus();
                    console.log('✏️ 입력 필드 포커스 설정 완료');
                }
            }, 300);
        } else {
            // 순수 JavaScript 백업
            const userSection = document.getElementById('user-info-section');
            const mainContent = document.getElementById('main-content');
            const header = document.getElementById('tm-header');
            
            if (userSection) userSection.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'none';
            if (header) header.style.display = 'none';
            
            // 포커스 설정
            setTimeout(() => {
                const nameInput = document.getElementById('inline-name-input');
                if (nameInput) nameInput.focus();
            }, 300);
        }
        
    } catch (error) {
        console.error('❌ 사용자 정보 섹션 표시 중 오류:', error);
    }
}

// 방문자 추적 함수
function trackVisitor() {
    // 모든 field가 들어 있는 데이터 생성
    var data = JSON.stringify({
        "id": getUVfromCookie(),
        "landingUrl": window.location.href,
        "ip": ip, // 전역 변수 ip 사용
        "referer": document.referrer || 'Direct',
        "time_stamp": getTimeStamp(),
        "utm": getUTMParams(),
        "device": getDeviceType()
    });

    console.log('방문자 데이터:', data);

    // Google Apps Script로 데이터 전송
    axios.get('https://script.google.com/macros/s/AKfycbzizOOhpr__UIANizUSF1ErlPJnXpM3EWyxOO2WRBjfD2JpzNrWAkK8IyZwz6f_nBcX/exec?action=insert&table=visitors&data=' + data)
        .then(response => {
            console.log('방문자 추적 성공:', response.data);
        })
        .catch(error => {
            console.error('방문자 추적 실패:', error);
        });
}

// 고유 ID 생성 함수
function generateUniqueId() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

// 페이지 로드 시 로그인 상태 확인 추가 (비활성화됨)
// 인라인 방식으로 대체되어 모든 팝업 관련 기능 비활성화됨

// Google API 로드 (안전 모드)
function loadGoogleAPIs() {
    console.log('Google API 로드 건너뜀 (안전 모드)');
    return;
}

// 설정 버튼 추가 (안전 모드)
function addSettingsButton() {
    console.log('설정 버튼 추가 건너뜀 (안전 모드)');
    return;
}

// 알림 권한 요청 (완전 비활성화)
function requestNotificationPermission() {
    console.log('❌ 알림 권한 요청 완전 비활성화 (팝업 방지)');
    // 절대로 Notification.requestPermission() 호출하지 않음
    return Promise.resolve('default');
}

// 알림 스케줄 설정 (완전 비활성화)
function setupNotificationSchedule() {
    console.log('❌ 알림 스케줄 설정 완전 비활성화 (팝업 방지)');
    return;
}

// 브라우저 알림 관련 모든 함수 비활성화
function showNotification() {
    console.log('❌ 브라우저 알림 비활성화');
    return;
}

function scheduleNotification() {
    console.log('❌ 알림 스케줄링 비활성화');
    return;
}

// 안전한 함수 호출을 위한 헬퍼
function safeCall(funcName, ...args) {
    try {
        if (typeof window[funcName] === 'function') {
            return window[funcName](...args);
        } else {
            console.log(`함수 ${funcName}는 사용할 수 없습니다 (안전 모드).`);
            return null;
        }
    } catch (error) {
        console.error(`함수 ${funcName} 호출 중 오류:`, error);
        return null;
    }
}

// 시작하기 버튼에서 호출되는 행정실 이메일 검색
function startAdminEmailSearchFromStart(adminEmail) {
    console.log('🚀 시작하기 버튼에서 행정실 이메일 검색 시작:', adminEmail);
    
    // 즉시 로딩 오버레이 표시
    showGmailSearchLoading();
    
    // 10초 타임아웃 설정
    const searchTimeout = setTimeout(() => {
        console.log('⏰ Gmail 검색 타임아웃 (10초 초과)');
        hideGmailSearchLoading();
        skipGmailSearchWithMessage('Gmail 검색이 너무 오래 걸려서 건너뜁니다. 수동으로 업무를 추가해주세요.');
    }, 10000); // 10초 타임아웃
    
    // 검색 성공/실패 시 타임아웃 클리어하는 함수
    window.clearGmailSearchTimeout = () => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            console.log('⏰ Gmail 검색 타임아웃 클리어됨');
        }
    };
    
    // 강제로 3초간 로딩 화면 표시 (사용자가 볼 수 있도록)
    setTimeout(() => {
        console.log('🔍 Gmail API 상태 확인 중...');
        console.log('gapi 존재:', typeof gapi !== 'undefined');
        console.log('gapi.client 존재:', typeof gapi !== 'undefined' && !!gapi.client);
        console.log('gmail API 존재:', typeof gapi !== 'undefined' && !!gapi.client && !!gapi.client.gmail);
        
        // Gmail API가 준비되어 있는지 확인
        if (typeof gapi === 'undefined' || !gapi.client) {
            console.warn('⚠️ Gmail API가 준비되지 않았습니다. 초기화 시도...');
            
            // Gmail API 초기화 재시도
            if (typeof initializeGapi === 'function') {
                console.log('📧 Gmail API 재초기화 시도...');
                initializeGapi().then(() => {
                    console.log('✅ Gmail API 재초기화 성공');
                    setTimeout(() => searchAdminEmailsFromStart(adminEmail), 1000);
                }).catch(error => {
                    console.error('❌ Gmail API 재초기화 실패:', error);
                    window.clearGmailSearchTimeout();
                    hideGmailSearchLoading();
                    skipGmailSearchWithMessage('Gmail API 초기화에 실패했습니다. 수동으로 업무를 추가해주세요.');
                });
            } else {
                console.error('❌ Gmail API 초기화 함수를 찾을 수 없습니다.');
                console.log('🧪 데모 모드로 전환...');
                
                // 데모 모드 - 샘플 이메일 데이터 생성
                updateGmailSearchProgress('데모 모드: 샘플 업무를 생성하고 있습니다...');
                setTimeout(() => {
                    const demoEmails = generateDemoEmailsForStart(adminEmail);
                    updateGmailSearchProgress('체크리스트에 업무를 추가하고 있습니다...');
                    setTimeout(() => {
                        window.clearGmailSearchTimeout();
                        hideGmailSearchLoading();
                        replaceChecklistWithEmails(demoEmails);
                        showGmailSearchResult('데모 모드: 행정실에서 발견된 업무가 체크리스트에 추가되었습니다. 실제 Gmail 연동을 위해서는 Google 로그인이 필요합니다.');
                    }, 1000);
                }, 2000);
            }
            return;
        }
        
        // Gmail API가 준비되어 있으면 바로 검색
        searchAdminEmailsFromStart(adminEmail);
    }, 3000); // 3초 지연으로 로딩 화면이 확실히 보이도록
}

// 행정실 이메일 검색 시작 (기존 호환성)
function startAdminEmailSearch(adminEmail) {
    console.log('🏃‍♂️ 행정실 이메일 검색 시작 (기존):', adminEmail);
    startAdminEmailSearchFromStart(adminEmail);
}

// 시작하기 버튼에서 호출되는 Gmail 검색
async function searchAdminEmailsFromStart(adminEmail) {
    try {
        console.log('🔍 시작하기 버튼에서 Gmail 검색 중:', adminEmail);
        console.log('📧 검색 쿼리:', `from:${adminEmail}`);
        
        // 사용자에게 진행 상황 업데이트
        updateGmailSearchProgress('Gmail 계정에서 행정실 이메일을 검색하고 있습니다...');
        
        // Gmail API로 검색 (최근 50개 이메일)
        const response = await gapi.client.gmail.users.messages.list({
            userId: 'me',
            q: `from:${adminEmail}`,
            maxResults: 50
        });
        
        const messages = response.result.messages || [];
        console.log(`📧 발견된 이메일 수: ${messages.length}개`);
        
        if (messages.length === 0) {
            // 다른 검색 방법도 시도
            console.log('🔄 다른 검색 조건으로 재시도...');
            updateGmailSearchProgress('다른 검색 조건으로 재시도 중...');
            
            // 이메일 도메인으로도 검색
            const domain = adminEmail.split('@')[1];
            const domainResponse = await gapi.client.gmail.users.messages.list({
                userId: 'me',
                q: `from:@${domain}`,
                maxResults: 30
            });
            
            const domainMessages = domainResponse.result.messages || [];
            console.log(`📧 도메인 검색으로 발견된 이메일 수: ${domainMessages.length}개`);
            
            if (domainMessages.length === 0) {
                window.clearGmailSearchTimeout();
                hideGmailSearchLoading();
                skipGmailSearchWithMessage(`해당 행정실(${adminEmail})에서 온 이메일이 없습니다. 수동으로 업무를 추가해주세요.`);
                return;
            } else {
                // 도메인 검색 결과 사용
                processFoundEmailsFromStart(domainMessages.slice(0, 10), adminEmail);
                return;
            }
        }
        
        // 발견된 이메일 처리
        processFoundEmailsFromStart(messages.slice(0, 20), adminEmail); // 최대 20개 처리
        
    } catch (error) {
        console.error('❌ Gmail 검색 실패:', error);
        window.clearGmailSearchTimeout();
        hideGmailSearchLoading();
        
        // 빠르게 넘어가기 - 긴 오류 메시지 대신 간단한 안내
        skipGmailSearchWithMessage('Gmail 검색 중 오류가 발생했습니다. 수동으로 업무를 추가해주세요.');
    }
}

// Gmail에서 행정실 이메일 검색 (기존 호환성)
async function searchAdminEmails(adminEmail) {
    console.log('🔍 Gmail 검색 (기존 호환성):', adminEmail);
    return searchAdminEmailsFromStart(adminEmail);
}

// 시작하기 버튼에서 발견된 이메일들 처리
async function processFoundEmailsFromStart(messages, adminEmail) {
    updateGmailSearchProgress(`${messages.length}개의 이메일을 분석하고 있습니다...`);
    
    const emailDetails = [];
    for (let i = 0; i < messages.length; i++) {
        try {
            updateGmailSearchProgress(`이메일 ${i + 1}/${messages.length} 처리 중...`);
            
            const messageResponse = await gapi.client.gmail.users.messages.get({
                userId: 'me',
                id: messages[i].id
            });
            
            const messageData = messageResponse.result;
            const headers = messageData.payload.headers;
            
            // 이메일 정보 추출
            const subject = headers.find(h => h.name === 'Subject')?.value || '제목 없음';
            const date = headers.find(h => h.name === 'Date')?.value || '';
            const from = headers.find(h => h.name === 'From')?.value || adminEmail;
            
            // 발신자 이름 추출
            const senderName = extractSenderName(from);
            
            // 본문 추출 (간단한 버전)
            let body = '';
            try {
                if (messageData.payload.body && messageData.payload.body.data) {
                    body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                } else if (messageData.payload.parts) {
                    const textPart = messageData.payload.parts.find(part => part.mimeType === 'text/plain');
                    if (textPart && textPart.body && textPart.body.data) {
                        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                    }
                }
            } catch (decodeError) {
                console.warn('본문 디코딩 실패:', decodeError);
                body = '본문을 읽을 수 없습니다.';
            }
            
            emailDetails.push({
                id: messageData.id,
                subject: subject,
                date: new Date(date),
                from: from,
                senderName: senderName,
                body: body.substring(0, 200) + (body.length > 200 ? '...' : '') // 본문 미리보기
            });
            
            console.log(`📧 처리 완료 ${i + 1}/${messages.length}: ${subject}`);
            
        } catch (error) {
            console.error(`메시지 ${i + 1} 상세 정보 가져오기 실패:`, error);
            continue; // 오류가 있어도 계속 진행
        }
    }
    
    console.log('📨 이메일 상세 정보 수집 완료:', emailDetails);
    updateGmailSearchProgress('체크리스트에 업무를 추가하고 있습니다...');
    
    // 1초 지연 후 결과 표시 (사용자가 진행 상황을 볼 수 있도록)
    setTimeout(() => {
        window.clearGmailSearchTimeout();
        hideGmailSearchLoading();
        replaceChecklistWithEmails(emailDetails);
        showGmailSearchResult(`${emailDetails.length}개의 행정실 업무가 체크리스트에 추가되었습니다!`);
    }, 1000);
}

// 발견된 이메일들 처리 (기존 호환성)
async function processFoundEmails(messages, adminEmail) {
    console.log('📧 이메일 처리 (기존 호환성):', messages.length);
    return processFoundEmailsFromStart(messages, adminEmail);
}

// Gmail 검색 진행 상황 업데이트
function updateGmailSearchProgress(message) {
    const progressElement = $('#gmail-search-loading .gmail-search-content p');
    if (progressElement.length > 0) {
        progressElement.text(message);
        console.log('🔄 진행 상황:', message);
    }
}

// 발신자 이름 추출
function extractSenderName(fromEmail) {
    try {
        // "이름 <email@domain.com>" 형식에서 이름 추출
        const nameMatch = fromEmail.match(/^(.+?)\s*<.*>$/);
        if (nameMatch) {
            return nameMatch[1].trim().replace(/['"]/g, ''); // 따옴표 제거
        }
        
        // 이메일만 있는 경우 @ 앞부분 사용
        const emailMatch = fromEmail.match(/([^@]+)@/);
        if (emailMatch) {
            return emailMatch[1];
        }
        
        return '행정실';
    } catch (error) {
        console.warn('발신자 이름 추출 실패:', error);
        return '행정실';
    }
}

// 체크리스트를 이메일 데이터로 교체
function replaceChecklistWithEmails(emails) {
    console.log('📋 체크리스트를 이메일 데이터로 교체:', emails);
    
    if (emails.length === 0) {
        showGmailSearchResult('검색된 이메일이 없습니다.');
        return;
    }
    
    // 기존 체크리스트 테이블 body 찾기
    const checklistBody = $('#checklist-body');
    if (checklistBody.length === 0) {
        console.error('체크리스트 테이블을 찾을 수 없습니다.');
        return;
    }
    
    // 기존 내용을 모두 지우고 새로운 데이터로 교체
    checklistBody.empty();
    
    emails.forEach((email, index) => {
        // 접수일 포맷 (이메일 받은 날짜)
        const receiptDate = email.date.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',  
            day: '2-digit'
        }).replace(/\./g, '-').replace(/ /g, '');
        
        // 마감일 계산 (이메일 받은 날짜 + 7일)
        const deadlineDate = new Date(email.date);
        deadlineDate.setDate(deadlineDate.getDate() + 7);
        const deadlineStr = deadlineDate.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '-').replace(/ /g, '');
        
        // 오늘 받은 이메일인지 확인
        const isToday = isEmailFromToday(email.date);
        const receiptDateClass = isToday ? 'receipt-date-today' : '';
        
        // 이메일 제목에서 업무 내용 추출
        const taskContent = extractTaskFromSubject(email.subject);
        const isImportant = isImportantTask(email.subject);
        const taskClass = isImportant ? 'task-content task-important' : 'task-content';
        
        // 마감일까지 남은 일수 계산
        const daysRemaining = getDaysRemainingFromDate(email.date);
        
        const newRow = `
            <tr class="gmail-imported-task ${isToday ? 'new-task-highlight' : ''}" data-email-id="${email.id}">
                <td><img src="img/checkbox-unchecked.png" alt="체크박스" class="checkbox-img" data-status="unchecked" style="width: 25px; height: 25px; cursor: pointer;"></td>
                <td class="${taskClass}" title="${email.subject}">${taskContent}</td>
                <td class="deadline-date" data-deadline="${deadlineStr}">${daysRemaining}</td>
                <td class="receipt-date ${receiptDateClass}" data-receipt="${receiptDate}">${receiptDate}</td>
                <td>${email.senderName || '행정실'}</td>
                <td>-</td>
            </tr>
        `;
        
        checklistBody.append(newRow);
    });
    
    // 체크박스 이벤트 다시 바인딩
    $('.checkbox-img').off('click').on('click', function() {
        toggleCheckbox(this);
    });
    
    // 행 클릭 이벤트 다시 바인딩
    $('tbody tr').off('click').on('click', function() {
        const checkbox = $(this).find('.checkbox-img');
        const status = checkbox.data('status');
        const deadline = $(this).find('.deadline-date').data('deadline');
        const receiptDate = $(this).find('.receipt-date').data('receipt');
        const taskContent = $(this).find('.task-content').text();
        const assignee = $(this).find('td:eq(4)').text();
        const forwarding = $(this).find('td:eq(5)').text();
        
        showWorkspaceContent(taskContent, status, deadline, receiptDate, assignee, forwarding);
        
        $('html, body').animate({
            scrollTop: $('#section-workspace').offset().top
        }, 800);
    });
    
    // 업무 요약 업데이트
    updateTaskSummary();
    
    console.log(`✅ ${emails.length}개의 업무가 체크리스트에 추가되었습니다.`);
    
    // 체크리스트 섹션으로 스크롤 (2초 후)
    setTimeout(() => {
        $('html, body').animate({
            scrollTop: $('#section-checklist').offset().top
        }, 1000);
    }, 2000);
}

// 이메일 날짜로부터 마감일까지 남은 일수 계산
function getDaysRemainingFromDate(emailDate) {
    const deadline = new Date(emailDate);
    deadline.setDate(deadline.getDate() + 7); // 이메일 받은 날짜 + 7일
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `<span class="text-danger">${Math.abs(diffDays)}일 지남</span>`;
    } else if (diffDays === 0) {
        return '<span class="text-warning">오늘 마감</span>';
    } else if (diffDays <= 3) {
        return `<span class="text-warning">${diffDays}일 남음</span>`;
    } else {
        return `<span class="text-success">${diffDays}일 남음</span>`;
    }
}

// 시작하기용 데모 이메일 생성
function generateDemoEmailsForStart(adminEmail) {
    const sampleSubjects = [
        '졸업논문 심사 신청서 제출 안내',
        '학위수여식 참석 확인서 제출 요청', 
        '연구윤리교육 이수 확인서 제출',
        '학적 변동 신청서 제출 안내',
        '장학금 신청 마감 공지',
        '세미나 참석 확인서 제출',
        '연구실 안전교육 이수증 제출 요청',
        '대학원 등록금 납부 안내',
        '연구과제 중간보고서 제출',
        '학회 발표 신청서 제출 요청'
    ];
    
    const senderNames = ['김행정', '이서무', '박학적', '최교무', '정연구', '한학과', '조서기'];
    
    const demoEmails = [];
    const today = new Date();
    
    sampleSubjects.forEach((subject, index) => {
        const emailDate = new Date(today);
        emailDate.setDate(today.getDate() - (index + 1)); // 1일부터 10일 전까지 분산
        
        const senderName = senderNames[index % senderNames.length];
        
        demoEmails.push({
            id: `demo_start_${index}`,
            subject: subject,
            date: emailDate,
            from: `${senderName} <${adminEmail}>`,
            senderName: senderName,
            body: `${subject}에 관한 상세 안내사항입니다. 마감일까지 제출해주시기 바랍니다.`
        });
    });
    
    console.log('🧪 시작하기용 데모 이메일 생성 완료:', demoEmails);
    return demoEmails;
}

// 데모용 샘플 이메일 생성 (기존 호환성)
function generateDemoEmails(adminEmail) {
    console.log('🧪 데모 이메일 생성 (기존 호환성)');
    return generateDemoEmailsForStart(adminEmail);
}

// Gmail 검색 로딩 화면 표시
function showGmailSearchLoading() {
    const loadingHtml = `
        <div id="gmail-search-loading" class="gmail-search-overlay">
            <div class="gmail-search-content">
                <div class="loading-animation">
                    <div class="running-icon">🏃‍♂️</div>
                    <div class="loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
                <h3>두클릭이 행정실로 달려가는 중이에요!!</h3>
                <p>설정하신 행정실에서 온 이메일을 수집하고 있습니다...</p>
                <div class="progress-bar-loading">
                    <div class="progress-fill-loading"></div>
                </div>
                <div class="loading-timeout-info">
                    <small>⏰ 10초 후 자동으로 건너뜁니다</small>
                </div>
                <button class="btn btn-sm btn-outline-light mt-3" onclick="skipGmailSearchManually()">
                    <i class="fas fa-forward mr-1"></i>건너뛰기
                </button>
            </div>
        </div>
    `;
    
    $('body').append(loadingHtml);
    
    // 애니메이션 시작
    setTimeout(() => {
        $('#gmail-search-loading').addClass('show');
    }, 100);
    
    // 5초 후 건너뛰기 버튼 강조
    setTimeout(() => {
        $('.loading-timeout-info').html('<small class="text-warning">⏰ 5초 후 자동으로 건너뜁니다</small>');
    }, 5000);
}

// Gmail 검색 로딩 화면 숨기기
function hideGmailSearchLoading() {
    $('#gmail-search-loading').removeClass('show');
    setTimeout(() => {
        $('#gmail-search-loading').remove();
    }, 500);
}

// Gmail 검색 오류 표시
function showGmailSearchError(message) {
    console.error('Gmail 검색 오류:', message);
    // 간단한 알림으로 표시
    const errorDiv = `
        <div class="alert alert-warning gmail-notification" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;">
            <button type="button" class="close" onclick="$(this).parent().remove();">
                <span>&times;</span>
            </button>
            <strong>Gmail 검색 알림</strong><br>
            ${message}
        </div>
    `;
    $('body').append(errorDiv);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        $('.gmail-notification').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
}

// Gmail 검색 결과 표시
function showGmailSearchResult(message) {
    const resultDiv = `
        <div class="alert alert-info gmail-notification" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;">
            <button type="button" class="close" onclick="$(this).parent().remove();">
                <span>&times;</span>
            </button>
            <strong>Gmail 검색 완료</strong><br>
            ${message}
        </div>
    `;
    $('body').append(resultDiv);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        $('.gmail-notification').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
}

// 체크리스트에 이메일 정보 표시 (기존 호환성 - 추가 모드)
function displayEmailsInChecklist(emails) {
    console.log('📋 체크리스트에 이메일 표시 (추가 모드):', emails);
    
    if (emails.length === 0) {
        showGmailSearchResult('검색된 이메일이 없습니다.');
        return;
    }
    
    // 기존 체크리스트 테이블 body 찾기
    const checklistBody = $('#checklist-body');
    if (checklistBody.length === 0) {
        console.error('체크리스트 테이블을 찾을 수 없습니다.');
        return;
    }
    
    // 기존 샘플 데이터는 유지하고 새로운 데이터 추가
    emails.forEach((email, index) => {
        // 접수일 포맷 개선
        const receiptDate = email.date.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',  
            day: '2-digit'
        }).replace(/\./g, '-').replace(/ /g, '');
        
        const isToday = isEmailFromToday(email.date);
        const receiptDateClass = isToday ? 'receipt-date-today' : '';
        
        // 이메일 제목에서 업무 내용 추출
        const taskContent = extractTaskFromSubject(email.subject);
        const isImportant = isImportantTask(email.subject);
        const taskClass = isImportant ? 'task-content task-important' : 'task-content';
        
        // 마감일 계산 개선
        const deadlineDate = new Date(email.date);
        deadlineDate.setDate(deadlineDate.getDate() + 7);
        const deadlineStr = deadlineDate.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '-').replace(/ /g, '');
        
        // 발신자 이름 처리
        const senderName = email.senderName || extractSenderName(email.from) || '행정실';
        
        const newRow = `
            <tr class="gmail-imported-task ${isToday ? 'new-task-highlight' : ''}" data-email-id="${email.id}">
                <td><img src="img/checkbox-unchecked.png" alt="체크박스" class="checkbox-img" data-status="unchecked" style="width: 25px; height: 25px; cursor: pointer;"></td>
                <td class="${taskClass}" title="${email.subject}">${taskContent}</td>
                <td class="deadline-date" data-deadline="${deadlineStr}">${getDaysRemainingFromDate(email.date)}</td>
                <td class="receipt-date ${receiptDateClass}" data-receipt="${receiptDate}">${receiptDate}</td>
                <td>${senderName}</td>
                <td>-</td>
            </tr>
        `;
        
        checklistBody.append(newRow);
    });
    
    // 체크박스 이벤트 다시 바인딩
    $('.checkbox-img').off('click').on('click', function() {
        toggleCheckbox(this);
    });
    
    // 행 클릭 이벤트 다시 바인딩
    $('tbody tr').off('click').on('click', function() {
        const checkbox = $(this).find('.checkbox-img');
        const status = checkbox.data('status');
        const deadline = $(this).find('.deadline-date').data('deadline');
        const receiptDate = $(this).find('.receipt-date').data('receipt');
        const taskContent = $(this).find('.task-content').text();
        const assignee = $(this).find('td:eq(4)').text();
        const forwarding = $(this).find('td:eq(5)').text();
        
        showWorkspaceContent(taskContent, status, deadline, receiptDate, assignee, forwarding);
        
        $('html, body').animate({
            scrollTop: $('#section-workspace').offset().top
        }, 800);
    });
    
    // 업무 요약 업데이트
    updateTaskSummary();
    
    // 성공 알림
    showGmailSearchResult(`${emails.length}개의 행정실 업무가 체크리스트에 추가되었습니다!`);
    
    // 체크리스트 섹션으로 스크롤 (2초 후)
    setTimeout(() => {
        $('html, body').animate({
            scrollTop: $('#section-checklist').offset().top
        }, 1000);
    }, 2000);
}

// 이메일 제목에서 업무 내용 추출
function extractTaskFromSubject(subject) {
    // 일반적인 행정 업무 키워드들
    const keywords = [
        '서류', '제출', '신청', '확인', '증명', '등록', '수강', '학적', '성적', '졸업', '논문', 
        '연구', '장학', '등록금', '휴학', '복학', '전과', '부전공', '교환학생', '인턴십',
        '세미나', '발표', '보고서', '과제', '시험', '평가', '심사', '면담', '상담'
    ];
    
    // 키워드가 포함된 경우 해당 부분을 강조
    for (const keyword of keywords) {
        if (subject.includes(keyword)) {
            return subject.length > 30 ? subject.substring(0, 30) + '...' : subject;
        }
    }
    
    // 키워드가 없으면 제목을 그대로 사용 (길이 제한)
    return subject.length > 30 ? subject.substring(0, 30) + '...' : subject;
}

// 중요 업무 판별
function isImportantTask(subject) {
    const importantKeywords = ['긴급', '중요', '마감', '필수', '즉시', '우선', '신청', '등록', '졸업'];
    return importantKeywords.some(keyword => subject.includes(keyword));
}

// 오늘 날짜 이메일인지 확인
function isEmailFromToday(emailDate) {
    const today = new Date();
    return emailDate.toDateString() === today.toDateString();
}

// 백업용 메인 콘텐츠 표시 함수 (순수 JavaScript)
function forceShowMainContent() {
    console.log('forceShowMainContent 실행 (백업 모드)');
    
    try {
        // 순수 JavaScript로 요소 조작
        const userInfoSection = document.getElementById('user-info-section');
        const mainContent = document.getElementById('main-content');
        const header = document.getElementById('tm-header');
        
        if (userInfoSection) {
            userInfoSection.style.display = 'none';
        }
        
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        if (header) {
            header.style.display = 'block';
        }
        
        // 페이지 최상단으로 스크롤
        window.scrollTo(0, 0);
        
        console.log('백업 모드로 메인 콘텐츠 표시 완료');
        
    } catch (error) {
        console.error('forceShowMainContent 실행 중 오류:', error);
    }
}

// 발신자 이름 추출
function extractSenderName(fromEmail) {
    try {
        // "이름 <email@domain.com>" 형식에서 이름 추출
        const nameMatch = fromEmail.match(/^(.+?)\s*<.*>$/);
        if (nameMatch) {
            return nameMatch[1].trim().replace(/['"]/g, ''); // 따옴표 제거
        }
        
        // 이메일만 있는 경우 @ 앞부분 사용
        const emailMatch = fromEmail.match(/([^@]+)@/);
        if (emailMatch) {
            return emailMatch[1];
        }
        
        return '행정실';
    } catch (error) {
        console.warn('발신자 이름 추출 실패:', error);
        return '행정실';
    }
}

// 체크리스트를 이메일 데이터로 교체
function replaceChecklistWithEmails(emails) {
    console.log('📋 체크리스트를 이메일 데이터로 교체:', emails);
    
    if (emails.length === 0) {
        showGmailSearchResult('검색된 이메일이 없습니다.');
        return;
    }
    
    // 기존 체크리스트 테이블 body 찾기
    const checklistBody = $('#checklist-body');
    if (checklistBody.length === 0) {
        console.error('체크리스트 테이블을 찾을 수 없습니다.');
        return;
    }
    
    // 기존 내용을 모두 지우고 새로운 데이터로 교체
    checklistBody.empty();
    
    emails.forEach((email, index) => {
        // 접수일 포맷 (이메일 받은 날짜)
        const receiptDate = email.date.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',  
            day: '2-digit'
        }).replace(/\./g, '-').replace(/ /g, '');
        
        // 마감일 계산 (이메일 받은 날짜 + 7일)
        const deadlineDate = new Date(email.date);
        deadlineDate.setDate(deadlineDate.getDate() + 7);
        const deadlineStr = deadlineDate.toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '-').replace(/ /g, '');
        
        // 오늘 받은 이메일인지 확인
        const isToday = isEmailFromToday(email.date);
        const receiptDateClass = isToday ? 'receipt-date-today' : '';
        
        // 이메일 제목에서 업무 내용 추출
        const taskContent = extractTaskFromSubject(email.subject);
        const isImportant = isImportantTask(email.subject);
        const taskClass = isImportant ? 'task-content task-important' : 'task-content';
        
        // 마감일까지 남은 일수 계산
        const daysRemaining = getDaysRemainingFromDate(email.date);
        
        const newRow = `
            <tr class="gmail-imported-task ${isToday ? 'new-task-highlight' : ''}" data-email-id="${email.id}">
                <td><img src="img/checkbox-unchecked.png" alt="체크박스" class="checkbox-img" data-status="unchecked" style="width: 25px; height: 25px; cursor: pointer;"></td>
                <td class="${taskClass}" title="${email.subject}">${taskContent}</td>
                <td class="deadline-date" data-deadline="${deadlineStr}">${daysRemaining}</td>
                <td class="receipt-date ${receiptDateClass}" data-receipt="${receiptDate}">${receiptDate}</td>
                <td>${email.senderName || '행정실'}</td>
                <td>-</td>
            </tr>
        `;
        
        checklistBody.append(newRow);
    });
    
    // 체크박스 이벤트 다시 바인딩
    $('.checkbox-img').off('click').on('click', function() {
        toggleCheckbox(this);
    });
    
    // 행 클릭 이벤트 다시 바인딩
    $('tbody tr').off('click').on('click', function() {
        const checkbox = $(this).find('.checkbox-img');
        const status = checkbox.data('status');
        const deadline = $(this).find('.deadline-date').data('deadline');
        const receiptDate = $(this).find('.receipt-date').data('receipt');
        const taskContent = $(this).find('.task-content').text();
        const assignee = $(this).find('td:eq(4)').text();
        const forwarding = $(this).find('td:eq(5)').text();
        
        showWorkspaceContent(taskContent, status, deadline, receiptDate, assignee, forwarding);
        
        $('html, body').animate({
            scrollTop: $('#section-workspace').offset().top
        }, 800);
    });
    
    // 업무 요약 업데이트
    updateTaskSummary();
    
    console.log(`✅ ${emails.length}개의 업무가 체크리스트에 추가되었습니다.`);
    
    // 체크리스트 섹션으로 스크롤 (2초 후)
    setTimeout(() => {
        $('html, body').animate({
            scrollTop: $('#section-checklist').offset().top
        }, 1000);
    }, 2000);
}

// 이메일 날짜로부터 마감일까지 남은 일수 계산
function getDaysRemainingFromDate(emailDate) {
    const deadline = new Date(emailDate);
    deadline.setDate(deadline.getDate() + 7); // 이메일 받은 날짜 + 7일
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `<span class="text-danger">${Math.abs(diffDays)}일 지남</span>`;
    } else if (diffDays === 0) {
        return '<span class="text-warning">오늘 마감</span>';
    } else if (diffDays <= 3) {
        return `<span class="text-warning">${diffDays}일 남음</span>`;
    } else {
        return `<span class="text-success">${diffDays}일 남음</span>`;
    }
}

// 시작하기용 데모 이메일 생성
function generateDemoEmailsForStart(adminEmail) {
    const sampleSubjects = [
        '졸업논문 심사 신청서 제출 안내',
        '학위수여식 참석 확인서 제출 요청', 
        '연구윤리교육 이수 확인서 제출',
        '학적 변동 신청서 제출 안내',
        '장학금 신청 마감 공지',
        '세미나 참석 확인서 제출',
        '연구실 안전교육 이수증 제출 요청',
        '대학원 등록금 납부 안내',
        '연구과제 중간보고서 제출',
        '학회 발표 신청서 제출 요청'
    ];
    
    const senderNames = ['김행정', '이서무', '박학적', '최교무', '정연구', '한학과', '조서기'];
    
    const demoEmails = [];
    const today = new Date();
    
    sampleSubjects.forEach((subject, index) => {
        const emailDate = new Date(today);
        emailDate.setDate(today.getDate() - (index + 1)); // 1일부터 10일 전까지 분산
        
        const senderName = senderNames[index % senderNames.length];
        
        demoEmails.push({
            id: `demo_start_${index}`,
            subject: subject,
            date: emailDate,
            from: `${senderName} <${adminEmail}>`,
            senderName: senderName,
            body: `${subject}에 관한 상세 안내사항입니다. 마감일까지 제출해주시기 바랍니다.`
        });
    });
    
    console.log('🧪 시작하기용 데모 이메일 생성 완료:', demoEmails);
    return demoEmails;
}

// 행정실 이메일이 없을 때 메시지 표시
function showNoAdminEmailMessage() {
    const messageDiv = `
        <div class="alert alert-warning admin-email-notice" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;">
            <button type="button" class="close" onclick="$(this).parent().remove();">
                <span>&times;</span>
            </button>
            <strong>행정실 이메일 미설정</strong><br>
            행정실 이메일이 설정되지 않아 Gmail 검색을 건너뜁니다. 설정에서 행정실 이메일을 추가해주세요.
        </div>
    `;
    $('body').append(messageDiv);
    
    // 7초 후 자동 제거
    setTimeout(() => {
        $('.admin-email-notice').fadeOut(function() {
            $(this).remove();
        });
    }, 7000);
}

// Gmail 검색을 건너뛰고 메인 화면으로 이동
function skipGmailSearchWithMessage(message) {
    console.log('⏭️ Gmail 검색 건너뛰기:', message);
    
    // 간단한 알림 메시지 표시
    const messageDiv = `
        <div class="alert alert-info gmail-skip-notice" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;">
            <button type="button" class="close" onclick="$(this).parent().remove();">
                <span>&times;</span>
            </button>
            <strong>Gmail 검색 건너뛰기</strong><br>
            ${message}
        </div>
    `;
    $('body').append(messageDiv);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        $('.gmail-skip-notice').fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
    
    // 체크리스트 섹션으로 스크롤 (기존 샘플 데이터 유지)
    setTimeout(() => {
        $('html, body').animate({
            scrollTop: $('#section-checklist').offset().top
        }, 1000);
    }, 1000);
}

// 수동으로 Gmail 검색 건너뛰기
function skipGmailSearchManually() {
    console.log('👆 사용자가 수동으로 Gmail 검색 건너뛰기');
    
    // 타임아웃 클리어
    if (typeof window.clearGmailSearchTimeout === 'function') {
        window.clearGmailSearchTimeout();
    }
    
    // 로딩 화면 숨기기
    hideGmailSearchLoading();
    
    // 건너뛰기 메시지 표시
    skipGmailSearchWithMessage('Gmail 검색을 건너뛰었습니다. 수동으로 업무를 추가해주세요.');
}

