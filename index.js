let shouldStop = false;
let stopped = false;
const videoPreview = document.getElementById('preview');
const videoRecording = document.getElementById('recording');
const downloadLink = document.getElementById('download');
const stopButton = document.getElementById('stop');

function startRecord() {
    $('.btn-primary').prop('disabled', true);
    $('#stop').prop('disabled', false);
    $('.btn-outline-primary').prop('disabled', true);
}

function stopRecord() {
    $('.btn-primary').prop('disabled', false);
    $('.btn-outline-primary').prop('disabled', false);
}

const audioRecordConstraints = {
    echoCancellation: true
}

stopButton.addEventListener('click', function () {
    shouldStop = true;
});

const handleRecord = function ({ stream, mimeType }) {
    startRecord()
    let recordedChunks = [];
    stopped = false;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }

        if (shouldStop === true && stopped === false) {
            mediaRecorder.stop();
            stopped = true;
        }
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(recordedChunks, {
            type: mimeType
        });
        recordedChunks = []
        const filename = window.prompt('Provde a name for the recorded file');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${filename || 'Recording'}.webm`;
        stopRecord();
        videoPreview.srcObject = null;
        videoRecording.src = downloadLink.href;
        var size = Math.ceil(blob.size/1000);
        //show recorded video
        $('#preview-text').css('display', 'none');
        $('#preview').css('display', 'none');
        $('#recording').css('display', 'inline');
        $('#recording-text').css('display', 'block');
        $('#size').html('(file size: ' + size.toFixed(0) + 'KB)');

    };

    mediaRecorder.start(200);
};

async function recordAudio() {
    const mimeType = 'audio/webm';
    shouldStop = false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioRecordConstraints });
    handleRecord({ stream, mimeType })
    $('#preview-text').css('display', 'none');
    $('#preview').css('display', 'none');
    $('#recording').css('display', 'none');
    $('#recording-text').css('display', 'none');
}

async function recordVideo() {
    const mimeType = 'video/webm';
    shouldStop = false;
    const constraints = {
        audio: {
            "echoCancellation": true
        },
        video: true
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoPreview.srcObject = stream;
    $('#preview-text').css('display', 'inline');
    $('#preview').css('display', 'inline');
    $('#recording').css('display', 'none');
    $('#recording-text').css('display', 'none');
    handleRecord({ stream, mimeType });
}

async function recordScreen() {
    const mimeType = 'video/webm';
    shouldStop = false;
    const constraints = {
        video: {
            cursor: 'motion'
        }
    };
    if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
        return window.alert('Screen Record not supported!')
    }
    let stream = null;
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "motion" }, audio: { 'echoCancellation': true } });
    if (window.confirm("Record audio with screen?")) {
        const audioContext = new AudioContext();

        const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: { 'echoCancellation': true }, video: false });
        const userAudio = audioContext.createMediaStreamSource(voiceStream);

        const audioDestination = audioContext.createMediaStreamDestination();
        userAudio.connect(audioDestination);

        if (displayStream.getAudioTracks().length > 0) {
            const displayAudio = audioContext.createMediaStreamSource(displayStream);
            displayAudio.connect(audioDestination);
        }

        const tracks = [...displayStream.getVideoTracks(), ...audioDestination.stream.getTracks()]
        stream = new MediaStream(tracks);
        handleRecord({ stream, mimeType });
    } else {
        stream = displayStream;
        handleRecord({ stream, mimeType });
    };
    videoPreview.srcObject = stream;
    $('#preview-text').css('display', 'inline');
    $('#preview').css('display', 'inline');
    $('#recording').css('display', 'none');
    $('#recording-text').css('display', 'none');
}