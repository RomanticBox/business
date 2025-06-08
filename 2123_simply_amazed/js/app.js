// 전역 변수
let customDate = new Date();
let dndMode = false;

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
        <strong>Tel-U</strong><br>
        좋은 하루에요!<br>
        오늘은 <strong>${newTasksToday}개</strong>의 행정 업무가 새로 할당되었어요.<br>
        <strong>${remainingTasks}개</strong>의 업무가 남아 있고,<br>
        이 중 <strong>${importantTasks}개</strong>의 중요 업무가 남아있어요.<br><br>
        행정업무는 Tel-U가 처리했으니 안심하라구!
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

// 포워딩 기능 완전 수정
function handleForwarding() {
    const email = $('#forwarding-email').val().trim();
    const name = $('#forwarding-name').val().trim();
    const reason = $('#forwarding-reason').val().trim();
    const notifyOriginal = $('#notify-original-assignee').is(':checked');
    
    console.log('포워딩 시작:', { email, name, reason, notifyOriginal });
    
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
    
    $('#forwarding-submit').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 처리 중...');
    
    // 포워딩 처리 시뮬레이션
    setTimeout(function() {
        try {
            // 포워딩 성공 처리
            showForwardingResult('success', '포워딩이 성공적으로 처리되었습니다!');
            updateForwardingInChecklist(name);
            
            // 폼 초기화
            $('#forwarding-email').val('');
            $('#forwarding-name').val('');
            $('#forwarding-reason').val('');
            $('#notify-original-assignee').prop('checked', false);
            
            // 포워딩 기록 저장
            saveForwardingRecord({
                email: email,
                name: name,
                reason: reason,
                taskContent: $('#ws-task-content').text(),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('포워딩 처리 오류:', error);
            showForwardingResult('danger', '포워딩 처리 중 오류가 발생했습니다.');
        }
        
        $('#forwarding-submit').prop('disabled', false).html('<i class="fas fa-paper-plane"></i> 포워딩 신청');
    }, 2000);
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
    
    // 새 이벤트 바인딩
    $('#forwarding-submit').on('click', function(e) {
        e.preventDefault();
        console.log('포워딩 버튼 클릭됨');
        handleForwarding();
    });
    
    console.log('포워딩 기능 초기화 완료');
}

function initSubmitFunctions() {
    $('#submit').on('click', function() {
        const email = $('#submit-email').val().trim();
        const advice = $('#submit-advice').val().trim();
        
        if (!email) {
            alert('이메일을 입력해주세요.');
            $('#submit-email').focus();
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            $('#submit-email').focus();
            return;
        }
        
        // 제출 버튼 비활성화
        $(this).prop('disabled', true).text('제출 중...');
        
        // 스프레드시트에 데이터 전송
        submitToSpreadsheet(email, advice)
            .then(() => {
                // 성공 시
                alert('제출이 완료되었습니다! 감사합니다.');
                $('#submit-email').val('');
                $('#submit-advice').val('');
                
                // 성공 팝업 표시
                showSuccessPopup();
            })
            .catch((error) => {
                console.error('제출 실패:', error);
                alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
            })
            .finally(() => {
                // 버튼 상태 복구
                $('#submit').prop('disabled', false).text('지금 제출!');
            });
    });
}

// 스프레드시트에 데이터 제출
async function submitToSpreadsheet(email, advice) {
    // Google Sheets API 또는 웹앱 스크립트 URL
    const SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbzizOOhpr__UIANizUSF1ErlPJnXpM3EWyxOO2WRBjfD2JpzNrWAkK8IyZwz6f_nBcX/exec';
    
    const data = {
        timestamp: new Date().toISOString(),
        email: email,
        advice: advice || '의견 없음',
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'Direct'
    };
    
    try {
        const response = await fetch(SPREADSHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // CORS 문제 해결
        });
        
        // 로컬 스토리지에도 백업 저장
        saveSubmissionLocally(data);
        
        return response;
    } catch (error) {
        // 네트워크 오류 시 로컬에만 저장
        saveSubmissionLocally(data);
        throw error;
    }
}

// 로컬 스토리지에 제출 데이터 저장
function saveSubmissionLocally(data) {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    submissions.push(data);
    localStorage.setItem('submissions', JSON.stringify(submissions));
}

// 성공 팝업 표시
function showSuccessPopup() {
    const popup = `
        <div class="success-popup" id="success-popup">
            <div class="success-content">
                <i class="fas fa-check-circle success-icon"></i>
                <h3>제출 완료!</h3>
                <p>소중한 의견 감사합니다.<br>서비스 런칭 시 알림을 보내드리겠습니다.</p>
                <button class="btn btn-primary" onclick="closeSuccessPopup()">확인</button>
            </div>
        </div>
    `;
    
    $('body').append(popup);
    $('#success-popup').fadeIn();
    
    // 5초 후 자동 닫기
    setTimeout(() => {
        closeSuccessPopup();
    }, 5000);
}

// 성공 팝업 닫기
function closeSuccessPopup() {
    $('#success-popup').fadeOut(function() {
        $(this).remove();
    });
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

// 페이지 로드 시 로그인 상태 확인 추가
$(document).ready(function() {
    // 기존 초기화 코드...
    
    // 로그인 상태 확인 (가장 마지막에 추가)
    checkLoginStatus();
    
    // Gmail API 로드
    loadGoogleAPIs();
    
    // 브라우저 알림 권한 요청
    requestNotificationPermission();
    
    // 알림 스케줄 설정
    setupNotificationSchedule();
    
    // 설정 버튼 추가 (네비게이션에)
    addSettingsButton();
});

// Google API 로드
function loadGoogleAPIs() {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = initializeGapi;
    document.head.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.onload = initializeGis;
    document.head.appendChild(script2);
}

// 설정 버튼 추가
function addSettingsButton() {
    const settingsButton = `
        <li class="nav-item">
            <a class="nav-link" href="#" onclick="showSettingsModal()">
                <span class="icn"><i class="fas fa-2x fa-cog"></i></span> 
                설정
            </a>
        </li>
    `;
    $('.navbar-nav').append(settingsButton);
} 