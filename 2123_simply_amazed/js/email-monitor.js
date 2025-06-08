// 이메일 모니터링 및 분석

// 행정사무실 이메일 설정
const ADMIN_EMAIL = 'ysadms@yonsei.ac.kr';
const ADMIN_EMAIL_DOMAINS = [
    'yonsei.ac.kr',
    'admin.yonsei.ac.kr',
    'eng.yonsei.ac.kr',
    'cs.yonsei.ac.kr'
];

// 긴급 키워드 리스트
const URGENT_KEYWORDS = [
    '긴급', '급히', '즉시', '빠른', '시급', '마감', '오늘', '내일', '중요',
    'urgent', 'asap', 'immediately', 'deadline', 'today', 'tomorrow', 'important'
];

// 날짜 패턴 정규식
const DATE_PATTERNS = [
    /(\d{4})[년\-\/\.](\d{1,2})[월\-\/\.](\d{1,2})[일\-\/\.]?/g, // 2024년 12월 25일
    /(\d{1,2})[월\-\/\.](\d{1,2})[일\-\/\.]?/g, // 12월 25일
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // 12/25/2024
    /(\d{4})\-(\d{2})\-(\d{2})/g, // 2024-12-25
];

// 시간 패턴 정규식
const TIME_PATTERNS = [
    /(\d{1,2})[시:](\d{2})/g, // 14시30분, 14:30
    /오전|오후\s*(\d{1,2})[시:]?(\d{2})?/g, // 오후 2시30분
];

// 이메일 모니터링 시작
async function startEmailMonitoring() {
    console.log('📧 이메일 모니터링 시작 - ysadms@yonsei.ac.kr 감시');
    
    try {
        // Gmail 연동 상태 확인
        if (!gmailAuth || !gmailAuth.isAuthorized) {
            console.log('❌ Gmail이 연동되지 않음');
            return;
        }
        
        // ysadms@yonsei.ac.kr을 기본으로 설정하되, 사용자 입력 이메일도 포함
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const emailsToMonitor = [ADMIN_EMAIL];
        
        // 사용자가 입력한 행정실 이메일도 추가
        if (userInfo.adminEmail && userInfo.adminEmail !== ADMIN_EMAIL) {
            emailsToMonitor.push(userInfo.adminEmail);
        }
        
        // 모니터링 쿼리 생성
        const emailQuery = emailsToMonitor.map(email => `from:${email}`).join(' OR ');
        const query = `(${emailQuery}) newer_than:1d`;
        
        console.log('🔍 모니터링 대상:', emailsToMonitor);
        console.log('🔍 검색 쿼리:', query);
        
        // 초기 이메일 검사
        await checkNewEmails(query);
        
        // 5분마다 새 이메일 확인 (더 자주 체크)
        const monitoringInterval = setInterval(() => checkNewEmails(query), 300000);
        
        // 모니터링 정보 저장
        localStorage.setItem('email_monitoring', JSON.stringify({
            active: true,
            query: query,
            emails: emailsToMonitor,
            startTime: new Date().toISOString(),
            intervalId: monitoringInterval
        }));
        
        console.log('✅ 이메일 모니터링 활성화됨');
        showMonitoringStatus(true, emailsToMonitor);
        
    } catch (error) {
        console.error('❌ 이메일 모니터링 시작 실패:', error);
        showMonitoringStatus(false, []);
    }
}

// 모니터링 상태 표시
function showMonitoringStatus(active, emailList) {
    const statusElement = $('#gmail-monitor-status');
    
    if (active && statusElement.length > 0) {
        statusElement.removeClass('alert-warning').addClass('alert-success');
        statusElement.html(`
            <i class="fas fa-sync-alt fa-spin mr-2"></i>
            Gmail 모니터링 활성화됨 - ${emailList.join(', ')} 감시 중
        `);
    } else if (statusElement.length > 0) {
        statusElement.removeClass('alert-success').addClass('alert-warning');
        statusElement.html(`
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Gmail 모니터링 비활성화됨
        `);
    }
}

// 새 이메일 확인
async function checkNewEmails(query) {
    try {
        const response = await gapi.client.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 10
        });

        if (response.result.messages) {
            for (const message of response.result.messages) {
                await analyzeEmail(message.id);
            }
        }
    } catch (error) {
        console.error('이메일 확인 실패:', error);
    }
}

// 이메일 분석
async function analyzeEmail(messageId) {
    try {
        const response = await gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });

        const message = response.result;
        const headers = message.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        
        // 이메일 본문 추출
        const body = extractEmailBody(message.payload);
        
        // 행정업무 여부 판단
        const isAdminTask = isAdministrativeTask(subject, body, from);
        
        if (isAdminTask) {
            const taskInfo = extractTaskInfo(subject, body, date);
            
            // 긴급 업무 확인
            if (taskInfo.isUrgent) {
                showUrgentNotification(taskInfo);
            }
            
            // 새 업무로 추가
            addNewTask(taskInfo);
            
            console.log('새로운 행정업무 발견:', taskInfo);
        }
        
    } catch (error) {
        console.error('이메일 분석 실패:', error);
    }
}

// 이메일 본문 추출
function extractEmailBody(payload) {
    let body = '';
    
    if (payload.body && payload.body.data) {
        body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body.data) {
                body += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            }
        }
    }
    
    return body;
}

// 행정업무 여부 판단
function isAdministrativeTask(subject, body, from) {
    // 행정실 이메일에서 온 메일인지 확인
    const isFromAdmin = ADMIN_EMAIL_DOMAINS.some(domain => from.includes(domain));
    
    // 본문에 날짜가 포함되어 있는지 확인
    const hasDate = DATE_PATTERNS.some(pattern => {
        pattern.lastIndex = 0;
        return pattern.test(body) || pattern.test(subject);
    });
    
    return isFromAdmin && hasDate;
}

// 업무 정보 추출
function extractTaskInfo(subject, body, emailDate) {
    const taskInfo = {
        title: subject,
        content: body,
        emailDate: new Date(emailDate),
        isUrgent: false,
        deadline: null,
        extractedDates: []
    };
    
    // 긴급성 확인
    taskInfo.isUrgent = URGENT_KEYWORDS.some(keyword => 
        subject.toLowerCase().includes(keyword) || 
        body.toLowerCase().includes(keyword)
    );
    
    // 날짜 추출
    taskInfo.extractedDates = extractDatesFromText(body + ' ' + subject);
    
    // 마감일 설정
    if (taskInfo.extractedDates.length > 0) {
        // 가장 가까운 미래 날짜를 마감일로 설정
        const futureDates = taskInfo.extractedDates.filter(date => date > new Date());
        taskInfo.deadline = futureDates.length > 0 ? futureDates[0] : taskInfo.extractedDates[0];
    }
    
    // 당일 마감인 경우 긴급으로 처리
    if (taskInfo.deadline && isSameDay(taskInfo.deadline, new Date())) {
        taskInfo.isUrgent = true;
    }
    
    return taskInfo;
}

// 텍스트에서 날짜 추출
function extractDatesFromText(text) {
    const dates = [];
    const currentYear = new Date().getFullYear();
    
    // 각 날짜 패턴에 대해 검사
    DATE_PATTERNS.forEach(pattern => {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let date = null;
            
            if (match.length === 4) { // 연-월-일 형태
                date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
            } else if (match.length === 3) { // 월-일 형태
                date = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
            }
            
            if (date && !isNaN(date.getTime())) {
                dates.push(date);
            }
        }
    });
    
    // 시간만 있는 경우 당일로 처리
    TIME_PATTERNS.forEach(pattern => {
        pattern.lastIndex = 0;
        if (pattern.test(text)) {
            dates.push(new Date()); // 오늘 날짜 추가
        }
    });
    
    return dates.sort((a, b) => a - b);
}

// 같은 날인지 확인
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 새 업무를 체크리스트에 추가
function addNewTask(taskInfo) {
    console.log('📝 새 업무 추가:', taskInfo.title);
    
    try {
        const checklistBody = $('#checklist-body');
        if (checklistBody.length === 0) {
            console.error('❌ 체크리스트 테이블을 찾을 수 없습니다');
            return;
        }
        
        // 중복 업무 확인
        const existingTasks = $('.task-content, .task-important').map(function() {
            return $(this).text().trim();
        }).get();
        
        if (existingTasks.includes(taskInfo.title)) {
            console.log('⚠️ 이미 존재하는 업무:', taskInfo.title);
            return;
        }
        
        // 날짜 포맷팅
        const deadlineStr = taskInfo.deadline ? formatDateToYYMMDD(taskInfo.deadline) : '미정';
        const receiptStr = formatDateToYYMMDD(taskInfo.emailDate);
        
        // 긴급 업무 클래스 설정
        const urgentClass = taskInfo.isUrgent ? 'task-important' : 'task-content';
        
        // 새 행 생성
        const newRow = `
            <tr class="new-task-highlight">
                <td><img src="img/checkbox-unchecked.png" alt="체크박스" class="checkbox-img" data-status="unchecked" style="width: 25px; height: 25px; cursor: pointer;"></td>
                <td class="${urgentClass}">${taskInfo.title}</td>
                <td class="deadline-date" data-deadline="${deadlineStr}">${getDaysRemaining(deadlineStr)}</td>
                <td class="receipt-date ${isSameDay(taskInfo.emailDate, new Date()) ? 'receipt-date-today' : ''}" data-receipt="${receiptStr}">${receiptStr}</td>
                <td>ysadms</td>
                <td>-</td>
            </tr>
        `;
        
        // 테이블 상단에 추가 (새 업무가 위에 보이도록)
        checklistBody.prepend(newRow);
        
        // 새 행 강조 효과
        setTimeout(() => {
            $('.new-task-highlight').removeClass('new-task-highlight');
        }, 3000);
        
        // 체크박스 이벤트 바인딩
        $('.checkbox-img').off('click').on('click', function() {
            toggleCheckbox(this);
        });
        
        // 행 클릭 이벤트 바인딩
        $('tbody tr').off('click').on('click', function() {
            const checkbox = $(this).find('.checkbox-img');
            const status = checkbox.data('status');
            const deadline = $(this).find('.deadline-date').data('deadline');
            const receiptDate = $(this).find('.receipt-date').data('receipt');
            const taskContent = $(this).find('.task-content, .task-important').text();
            const assignee = $(this).find('td:eq(4)').text();
            const forwarding = $(this).find('td:eq(5)').text();
            
            showWorkspaceContent(taskContent, status, deadline, receiptDate, assignee, forwarding);
            
            $('html, body').animate({
                scrollTop: $('#section-workspace').offset().top
            }, 800);
        });
        
        // 업무 요약 업데이트
        updateTaskSummary();
        
        // 긴급 업무인 경우 알림 표시
        if (taskInfo.isUrgent && typeof showUrgentNotification === 'function') {
            showUrgentNotification(taskInfo);
        }
        
        // 새 업무 알림
        showNewTaskNotification(taskInfo);
        
        console.log('✅ 새 업무 추가 완료');
        
    } catch (error) {
        console.error('❌ 새 업무 추가 실패:', error);
    }
}

// 날짜를 YY-MM-DD 형식으로 변환
function formatDateToYYMMDD(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear().toString().substr(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 새 업무 알림 표시
function showNewTaskNotification(taskInfo) {
    const notification = `
        <div class="new-task-notification" style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: linear-gradient(135deg, #28a745, #20c997); color: white; border-radius: 10px; padding: 20px; box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3); max-width: 400px; animation: slideInRight 0.5s ease;">
            <div class="notification-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div>
                    <i class="fas fa-envelope-open-text" style="font-size: 1.2em; margin-right: 10px;"></i>
                    <strong>ysadms@yonsei.ac.kr에서 새 업무!</strong>
                </div>
                <button class="close-btn" onclick="$(this).closest('.new-task-notification').fadeOut()" style="background: none; border: none; color: white; font-size: 1.2em; cursor: pointer;">&times;</button>
            </div>
            <div class="notification-body">
                <h6 style="margin: 10px 0 5px 0; font-weight: 600;">${taskInfo.title}</h6>
                <p style="margin: 5px 0; font-size: 14px;"><strong>마감일:</strong> ${taskInfo.deadline ? taskInfo.deadline.toLocaleDateString('ko-KR') : '미정'}</p>
                ${taskInfo.isUrgent ? '<span style="background: rgba(255, 193, 7, 0.3); color: #ffc107; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">긴급</span>' : ''}
            </div>
            <div class="notification-actions" style="margin-top: 15px;">
                <button class="btn btn-sm btn-light" onclick="scrollToChecklist(); $(this).closest('.new-task-notification').fadeOut();" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); color: white;">
                    체크리스트 확인
                </button>
            </div>
        </div>
    `;
    
    $('body').append(notification);
    
    // 8초 후 자동 제거
    setTimeout(() => {
        $('.new-task-notification').fadeOut();
    }, 8000);
}

// 체크리스트로 스크롤
function scrollToChecklist() {
    $('html, body').animate({
        scrollTop: $('#section-checklist').offset().top
    }, 800);
} 