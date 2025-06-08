// 통합 알림 시스템

// 긴급 알림 표시
function showUrgentNotification(taskInfo) {
    // 방해금지모드와 상관없이 긴급 알림은 항상 표시
    const urgentNotification = createUrgentNotification(taskInfo);
    $('body').append(urgentNotification);
    
    // 브라우저 알림도 표시
    if (Notification.permission === 'granted') {
        new Notification('⚠️ 긴급 업무 알림', {
            body: `긴급: ${taskInfo.title}`,
            icon: '/favicon.ico',
            requireInteraction: true
        });
    }
    
    // 모바일에서는 진동 효과
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

// 긴급 알림 HTML 생성
function createUrgentNotification(taskInfo) {
    return `
        <div class="urgent-notification" id="urgent-notification">
            <div class="urgent-content">
                <div class="urgent-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>⚠️ 긴급 업무 알림</h3>
                    <button class="urgent-close" onclick="closeUrgentNotification()">&times;</button>
                </div>
                <div class="urgent-body">
                    <h4>${taskInfo.title}</h4>
                    <p><strong>마감:</strong> ${taskInfo.deadline ? formatDate(taskInfo.deadline) : '즉시'}</p>
                    <div class="urgent-actions">
                        <button class="btn btn-danger" onclick="handleUrgentTask('${taskInfo.title}')">지금 처리</button>
                        <button class="btn btn-secondary" onclick="snoozeUrgentTask('${taskInfo.title}')">10분 후 알림</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 일반 업무 알림 (설정된 시간에)
function showScheduledNotification() {
    const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
    const dndMode = localStorage.getItem('dnd_mode') === 'true';
    
    // 방해금지모드가 켜져있으면 일반 알림은 표시하지 않음
    if (dndMode) {
        return;
    }
    
    const notification = createScheduledNotification();
    $('body').append(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        $('#scheduled-notification').fadeOut();
    }, 5000);
}

// 예약된 알림 HTML
function createScheduledNotification() {
    return `
        <div class="scheduled-notification" id="scheduled-notification">
            <div class="notification-content">
                <i class="fas fa-bell"></i>
                <div class="notification-text">
                    <h4>새로운 업무가 생겼어요!</h4>
                    <p>체크리스트를 확인해보세요.</p>
                </div>
                <button class="notification-close" onclick="$('#scheduled-notification').fadeOut()">&times;</button>
            </div>
        </div>
    `;
}

// 브라우저 알림 권한 요청
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('알림 권한이 허용되었습니다.', 'success');
            }
        });
    }
}

// 알림 설정 관리
function setupNotificationSchedule() {
    const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
    
    if (settings.enabled && settings.time) {
        const [hours, minutes] = settings.time.split(':');
        
        // 매일 설정된 시간에 알림 실행
        scheduleDaily(parseInt(hours), parseInt(minutes), showScheduledNotification);
    }
}

// 일일 스케줄 설정
function scheduleDaily(hours, minutes, callback) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // 오늘 시간이 지났으면 내일로 설정
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeToWait = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
        callback();
        // 24시간 후 다시 실행하도록 설정
        scheduleDaily(hours, minutes, callback);
    }, timeToWait);
}

// 긴급 알림 닫기
function closeUrgentNotification() {
    $('#urgent-notification').fadeOut(500, function() {
        $(this).remove();
    });
}

// 긴급 업무 처리
function handleUrgentTask(taskTitle) {
    // 해당 업무로 스크롤
    $('.task-content').each(function() {
        if ($(this).text().includes(taskTitle)) {
            $(this).closest('tr').click();
            $('html, body').animate({
                scrollTop: $('#section-workspace').offset().top
            }, 800);
        }
    });
    
    closeUrgentNotification();
}

// 긴급 업무 스누즈
function snoozeUrgentTask(taskTitle) {
    closeUrgentNotification();
    
    // 10분 후 다시 알림
    setTimeout(() => {
        showUrgentNotification({
            title: taskTitle,
            deadline: new Date()
        });
    }, 600000); // 10분 = 600,000ms
} 