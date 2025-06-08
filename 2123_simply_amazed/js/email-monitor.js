// 이메일 모니터링 및 분석

// 행정실 이메일 도메인 리스트
const ADMIN_EMAIL_DOMAINS = [
    'admin.yonsei.ac.kr',
    'eng.yonsei.ac.kr',
    'cs.yonsei.ac.kr',
    // 사용자 설정에서 추가 가능
];

// 긴급 키워드 리스트
const URGENT_KEYWORDS = [
    '긴급', '급히', '즉시', '빠른', '시급', '마감', '오늘', '내일',
    'urgent', 'asap', 'immediately', 'deadline', 'today', 'tomorrow'
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
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.adminEmail) {
            console.log('행정실 이메일이 설정되지 않음');
            return;
        }

        // 최근 24시간 이메일 확인
        const query = `from:${userInfo.adminEmail} newer_than:1d`;
        await checkNewEmails(query);
        
        // 10분마다 새 이메일 확인
        setInterval(() => checkNewEmails(query), 600000);
        
    } catch (error) {
        console.error('이메일 모니터링 시작 실패:', error);
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