const {desktopCapturer, remote} = require('electron');
const { writeFile } = require('fs');
const { Menu, dialog } = remote;


const videoElement = document.querySelector('video');
const startBtn     = document.getElementById('startButton');
const stopBtn      = document.getElementById('stopButton');
const alertBox     =  document.getElementById('main-notification');

let isRecording    = false;
let isSourceSelected = false;
let mediaRecorder;
let recordedChucks = [];


const videoSelectionBtn = document.getElementById('videoSelectionBtn');
videoSelectionBtn.onclick = getVideoSources;

startBtn.onclick = handleStartRecording;
stopBtn.onclick = handleStopRecording;
stopBtn.disabled = true;

/**
 * get video sources
 */
async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })

    const videoOptionMenu = Menu.buildFromTemplate(
        inputSources.map( source => {
            return {
                label: source.name,
                click: () => selectSource(source )
            };
        })
    );

    videoOptionMenu.popup();
}

async function selectSource(source){
    isSourceSelected = true;
    videoSelectionBtn.innerHTML = source.name
    const contraints = {
        audio: false,
        video:{
            mandatory: {
                chromeMediaSource : 'desktop',
                chromeMediaSourceId: source.id
            }
            
        }
    };

    const stream = await navigator.mediaDevices
    .getUserMedia(contraints);
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = (e) => videoElement.play();
    // videoElement.play();


    // create media recorder
    const options = {
        mimeType: 'video/webm  codecs=v0'
    }
   

    mediaRecorder = new MediaRecorder(stream);
    // Register events
    mediaRecorder.ondataavailable = handleDataAavailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAavailable(e){
    recordedChucks.push(e.data);
}

/**
 * Start recording event handler
 */
function handleStartRecording(){

    if(!isSourceSelected) {
        toggleAlertNotification("Please select a video source  first");
        return false;
    }

    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerHTML = 'Recording';
    isRecording = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
}

/**
 * Stop recording event handler
 */
function handleStopRecording(){
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerHTML = 'Start';
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    isRecording = false;
}

/**
 * 
 * @param {event obj} e 
 * manage the stop recording and save file 
 */
async function handleStop(e){

    console.log('called when stop')
    const blob = new Blob(recordedChucks, {
        type: 'video/webm codecs=v9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer())
    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.mp4`
    })
 
    console.log(filePath)
    writeFile(filePath,buffer, ()=>{
        console.log('video saved successfully.')
        stream = null;
        videoElement.srcObject = null;
        recordedChucks = [];
        mediaRecorder = null;
    })
}

/**
 * 
 * @param {string} message | string of message to show.
 *
 */
function toggleAlertNotification(message){
    alertBox.innerHTML = message;
    alertBox.classList.add('is-danger');
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.innerHTML = '';
        alertBox.classList.remove('is-danger');
        alertBox.style.display = 'none';
    }, 5000);
    
}