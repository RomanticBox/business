// Gmail API 관련 기능

// Google API 설정
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'];
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

let isGapiLoaded = false;
let isGisLoaded = false;
let tokenClient;

// Google API 초기화
function initializeGapi() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    isGapiLoaded = true;
    maybeEnableButtons();
}

function initializeGis() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error !== undefined) {
                throw (response);
            }
            localStorage.setItem('gmail_access_token', response.access_token);
            onGmailAuthorized();
        },
    });
    isGisLoaded = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (isGapiLoaded && isGisLoaded) {
        console.log('Gmail API 준비 완료');
    }
}

// Gmail 권한 요청
function requestGmailPermission() {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// Gmail 인증 완료 처리
function onGmailAuthorized() {
    console.log('Gmail 접근 권한 획득');
    startEmailMonitoring();
    showNotification('Gmail 연동이 완료되었습니다!', 'success');
} 