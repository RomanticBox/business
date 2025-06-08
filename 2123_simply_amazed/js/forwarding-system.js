// 강화된 포워딩 시스템

// Gmail을 통한 포워딩 기능
async function forwardTaskViaGmail(taskInfo, recipientEmail, recipientName, reason) {
    console.log('📧 Gmail 포워딩 시작 - ysadms@yonsei.ac.kr 업무:', taskInfo.title);
    
    try {
        // Gmail 연동 상태 확인
        if (!gmailAuth || !gmailAuth.isAuthorized) {
            throw new Error('Gmail이 연동되지 않았습니다. 먼저 Gmail 로그인을 해주세요.');
        }
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        const emailContent = `
안녕하세요, ${recipientName}님

Do Click 시스템을 통해 ysadms@yonsei.ac.kr에서 할당된 업무를 전달드립니다.

📧 원본 발신: ysadms@yonsei.ac.kr
👤 포워딩 요청자: ${userInfo.name || '사용자'} (${userInfo.department || '대학원'})

▣ 업무 내용: ${taskInfo.title}
▣ 마감일: ${taskInfo.deadline ? formatDate(taskInfo.deadline) : '미정'}
▣ 포워딩 사유: ${reason}

--- 상세 내용 ---
${taskInfo.content || '상세 내용은 Do Click 시스템에서 확인하실 수 있습니다.'}

⏰ 포워딩 일시: ${new Date().toLocaleString('ko-KR')}

이 업무는 연세대학교 행정사무실에서 할당된 것으로, 필요한 조치를 취해주시기 바랍니다.

감사합니다.

※ 이 메일은 Do Click 시스템을 통해 자동 발송되었습니다.
        `;

        const message = {
            'to': recipientEmail,
            'subject': `[Do Click 포워딩] ${taskInfo.title} (from ysadms@yonsei.ac.kr)`,
            'body': emailContent
        };

        await sendGmailMessage(message);
        
        // 원래 할당자에게 알림 (옵션에 따라)
        if (document.getElementById('notify-original-assignee')?.checked) {
            await notifyOriginalAssignee(taskInfo, recipientName, reason);
        }
        
        console.log('✅ Gmail 포워딩 완료');
        return true;
    } catch (error) {
        console.error('❌ Gmail 포워딩 실패:', error);
        throw error;
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

// 원래 할당자에게 알림 - ysadms@yonsei.ac.kr로 전송
async function notifyOriginalAssignee(taskInfo, newAssignee, reason) {
    console.log('📨 ysadms@yonsei.ac.kr로 포워딩 알림 전송');
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const notificationContent = `
안녕하세요,

Do Click 시스템을 통해 업무 포워딩이 발생했음을 알려드립니다.

👤 포워딩 요청자: ${userInfo.name || '사용자'} (${userInfo.department || '대학원'})
📧 학생 이메일: ${gmailAuth.userProfile?.emailAddress || '미상'}

▣ 원본 업무: ${taskInfo.title}
▣ 포워딩 받은 사람: ${newAssignee}
▣ 포워딩 사유: ${reason}
▣ 포워딩 일시: ${new Date().toLocaleString('ko-KR')}

이 업무는 원래 ysadms@yonsei.ac.kr에서 할당된 것으로, 
${newAssignee}님에게 포워딩되었습니다.

추가 확인이 필요한 경우 연락 부탁드립니다.

감사합니다.

※ Do Click 시스템 자동 알림
    `;

    try {
        // ysadms@yonsei.ac.kr로 알림 전송
        const message = {
            'to': 'ysadms@yonsei.ac.kr',
            'subject': `[Do Click 알림] 업무 포워딩 발생 - ${taskInfo.title}`,
            'body': notificationContent
        };
        
        await sendGmailMessage(message);
        console.log('✅ ysadms@yonsei.ac.kr로 알림 전송 완료');
        
    } catch (error) {
        console.error('❌ 알림 전송 실패:', error);
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