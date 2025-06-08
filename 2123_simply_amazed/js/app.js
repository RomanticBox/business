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
        <strong>Tel-U</strong><br>
        좋은 하루에요!<br>
        새로운 업무 : <strong>${newTasksToday}개</strong><br>
        남은 업무 : <strong>${remainingTasks}개</strong><br>
        중요 업무 : <strong>${importantTasks}개</strong><br><br>
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
    department: '',
    birthdate: '',
    adminEmail: '',
    advisorName: ''
};

// 인라인 다음 단계
function nextInlineStep() {
    const currentStepData = getInlineCurrentStepData();
    
    if (!validateInlineCurrentStep(currentStepData)) {
        return;
    }
    
    saveInlineCurrentStepData(currentStepData);
    
    if (inlineCurrentStep < 4) {
        inlineCurrentStep++;
        updateInlineProgress();
        showInlineStep(inlineCurrentStep);
    } else {
        completeInlineOnboarding();
    }
}

// 인라인 건너뛰기
function skipInlineStep() {
    if (inlineCurrentStep < 4) {
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
            return $('#inline-department-input').val();
        case 2:
            return $('#inline-birthdate-input').val();
        case 3:
            return $('#inline-admin-email-input').val();
        case 4:
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
    
    // 이메일 검증 (행정실 이메일)
    if (inlineCurrentStep === 3) {
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
    switch(inlineCurrentStep) {
        case 0:
            inlineUserInfo.name = data;
            break;
        case 1:
            inlineUserInfo.department = data;
            break;
        case 2:
            inlineUserInfo.birthdate = data;
            break;
        case 3:
            inlineUserInfo.adminEmail = data;
            break;
        case 4:
            inlineUserInfo.advisorName = data;
            break;
    }
}

// 진행률 업데이트
function updateInlineProgress() {
    const progress = ((inlineCurrentStep + 1) / 5) * 100;
    $('.user-info-progress .progress-fill').css('width', progress + '%');
    $('.user-info-progress .progress-text').text(`${inlineCurrentStep + 1} / 5 단계`);
}

// 단계 표시
function showInlineStep(step) {
    $('.user-info-step').removeClass('active');
    $(`.user-info-step[data-step="${step}"]`).addClass('active');
    
    // 입력 필드에 포커스
    setTimeout(() => {
        $('.user-info-step.active input').focus();
    }, 300);
}

// 인라인 온보딩 완료
function completeInlineOnboarding() {
    console.log('completeInlineOnboarding 함수 실행 시작');
    console.log('현재 inlineUserInfo:', inlineUserInfo);
    
    try {
        // 완료 메시지 표시
        $('.user-info-step').removeClass('active');
        $('#inline-completion-step').addClass('active');
        
        // 개발 모드가 아닐 때만 사용자 정보 저장
        if (!DEVELOPMENT_MODE) {
            localStorage.setItem('userInfo', JSON.stringify(inlineUserInfo));
            localStorage.setItem('isLoggedIn', 'true');
            console.log('✅ 사용자 정보 저장 완료:', inlineUserInfo);
        } else {
            console.log('🔧 개발 모드: 사용자 정보 저장 건너뜀');
        }
        
        console.log('localStorage 확인:', {
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

// 메인 콘텐츠 표시
function showMainContent() {
    console.log('showMainContent 함수 실행 시작');
    
    try {
        // 사용자 정보 확인
        const savedUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        console.log('저장된 사용자 정보:', savedUserInfo);
        
        // 확실하게 요소들이 존재하는지 확인
        if ($('#user-info-section').length === 0) {
            console.error('user-info-section 요소를 찾을 수 없습니다');
            return;
        }
        
        if ($('#main-content').length === 0) {
            console.error('main-content 요소를 찾을 수 없습니다');
            return;
        }
        
        console.log('페이드아웃 시작...');
        $('#user-info-section').fadeOut(500, function() {
            console.log('페이드인 시작...');
            $('#main-content').fadeIn(500);
            $('#tm-header').show();
            
            // 사용자 이름으로 환영 메시지 업데이트
            if (savedUserInfo && savedUserInfo.name) {
                const taskSummaryElement = $('#task-summary');
                if (taskSummaryElement.length > 0) {
                    const currentSummary = taskSummaryElement.html();
                    const newSummary = currentSummary.replace('좋은 하루에요!', `${savedUserInfo.name}님, 좋은 하루에요!`);
                    taskSummaryElement.html(newSummary);
                    console.log('환영 메시지 업데이트 완료');
                }
            }
            
            // 페이지 최상단으로 스크롤
            $('html, body').animate({ scrollTop: 0 }, 500);
            console.log('메인 콘텐츠 표시 완료');
        });
        
    } catch (error) {
        console.error('showMainContent 실행 중 오류:', error);
        
        // 오류 발생 시 강제로 표시
        $('#user-info-section').hide();
        $('#main-content').show();
        $('#tm-header').show();
        console.log('강제 표시 완료');
    }
}

// 인라인 단계 에러 표시
function showInlineStepError(message) {
    const errorDiv = $('.user-info-step.active .step-error');
    errorDiv.text(message).show().delay(3000).fadeOut();
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
    console.log('- help(): 이 도움말 표시');
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
);
