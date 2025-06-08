// 강화된 포워딩 시스템

// Gmail을 통한 포워딩 기능
async function forwardTaskViaGmail(taskInfo, recipientEmail, recipientName, reason) {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        const emailContent = `
안녕하세요, ${recipientName}님

${userInfo.name}입니다. 다음 업무를 전달드립니다.

▣ 업무 내용: ${taskInfo.title}
▣ 마감일: ${taskInfo.deadline ? formatDate(taskInfo.deadline) : '미정'}
▣ 포워딩 사유: ${reason}

--- 원본 내용 ---
${taskInfo.content}

감사합니다.

※ 이 메일은 Tel-U 시스템을 통해 자동 발송되었습니다.
        `;

        const message = {
            'to': recipientEmail,
            'subject': `[Tel-U 업무전달] ${taskInfo.title}`,
            'body': emailContent
        };

        await sendGmailMessage(message);
        
        // 원래 할당자에게 알림 (옵션에 따라)
        if (document.getElementById('notify-original-assignee').checked) {
            await notifyOriginalAssignee(taskInfo, recipientName, reason);
        }
        
        return true;
    } catch (error) {
        console.error('Gmail 포워딩 실패:', error);
        return false;
    }
}

// Gmail 메시지 전송
async function sendGmailMessage(messageData) {
    const message = 
        `To: ${messageData.to}\r\n` +
        `Subject: ${messageData.subject}\r\n` +
        `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
        messageData.body;

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
            raw: encodedMessage
        }
    });

    return response;
}

// 원래 할당자에게 알림
async function notifyOriginalAssignee(taskInfo, newAssignee, reason) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    const notificationContent = `
안녕하세요,

${userInfo.name} 학생이 다음 업무를 ${newAssignee}님께 전달했음을 알려드립니다.

▣ 업무: ${taskInfo.title}
▣ 전달 받은 사람: ${newAssignee}
▣ 전달 사유: ${reason}
▣ 전달 일시: ${new Date().toLocaleString('ko-KR')}

감사합니다.
    `;

    // 행정실로 알림 전송
    if (userInfo.adminEmail) {
        const message = {
            'to': userInfo.adminEmail,
            'subject': `[Tel-U 알림] 업무 전달 - ${taskInfo.title}`,
            'body': notificationContent
        };
        
        await sendGmailMessage(message);
    }
}

// 강화된 포워딩 처리 함수
async function handleAdvancedForwarding() {
    const email = $('#forwarding-email').val();
    const name = $('#forwarding-name').val();
    const reason = $('#forwarding-reason').val();
    const taskContent = $('#ws-task-content').text();
    
    if (!email || !name || !reason) {
        showForwardingResult('danger', '모든 필드를 입력해주세요.');
        return;
    }
    
    $('#forwarding-submit').prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Gmail로 전송 중...');
    
    try {
        // 현재 선택된 업무 정보 가져오기
        const taskInfo = {
            title: taskContent,
            content: taskContent,
            deadline: new Date($('#ws-deadline').text())
        };
        
        // Gmail을 통한 포워딩 실행
        const success = await forwardTaskViaGmail(taskInfo, email, name, reason);
        
        if (success) {
            showForwardingResult('success', '포워딩이 Gmail을 통해 성공적으로 전송되었습니다!');
            updateForwardingInChecklist(name);
            
            // 포워딩 기록 저장
            saveForwardingRecord(taskInfo, email, name, reason);
        } else {
            showForwardingResult('danger', 'Gmail 전송 중 오류가 발생했습니다.');
        }
        
    } catch (error) {
        console.error('포워딩 처리 중 오류:', error);
        showForwardingResult('danger', '포워딩 처리 중 오류가 발생했습니다.');
    }
    
    $('#forwarding-submit').prop('disabled', false).html('<i class="fas fa-paper-plane mr-2"></i>포워딩 신청');
}

// 포워딩 기록 저장
function saveForwardingRecord(taskInfo, email, name, reason) {
    const records = JSON.parse(localStorage.getItem('forwarding_records') || '[]');
    
    records.push({
        task: taskInfo.title,
        to_email: email,
        to_name: name,
        reason: reason,
        forwarded_at: new Date().toISOString(),
        status: 'sent'
    });
    
    localStorage.setItem('forwarding_records', JSON.stringify(records));
} 