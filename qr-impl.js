// @ts-nocheck

import QrScanner from "./qr-scanner.min.js";
QrScanner.WORKER_PATH = './qr-scanner/qr-scanner-worker.min.js';
const qrStream = document.getElementById('qr-stream');
const flashToggle = document.getElementById('flashToggle');
const stateToggle = document.getElementById('stateToggle');
const fileSelector = document.getElementById('file-selector');
let isOn = false;
const camList = document.getElementById('cam-list');
const resultCard = document.getElementById('result');

const qrScanner = new QrScanner(qrStream, (result) => readResult(result));
let videoStream = qrStream?.parentNode?.insertBefore(qrScanner.$canvas, qrStream);
videoStream.classList.add('mw-100', 'mb-1', 'border', 'border-dark', 'border-1');

let filePrev = qrStream?.parentNode?.insertBefore(document.createElement('img'), qrStream);
filePrev.classList.add('mw-100', 'mb-1', 'border', 'border-dark', 'border-1', 'd-none');

stateToggle?.addEventListener('click', event => {
    if (event.target.textContent == "Loading") {
        return
    }
    event.target.textContent = "Loading";
    if (isOn) {
        turnOff();

    } else {
        startScanning();
        isOn = true;
        event.target.textContent = "Cancel";
        event.target.classList.add('btn-danger');
    }
});

camList?.addEventListener('change', event => {
    qrScanner.stop();
    qrScanner.setCamera(event.target.value).then(() => {
        startScanning()
    });
});

function startScanning() {
    filePrev.classList.add('d-none');
    resultCard.classList.add('d-none');
    qrScanner.start().then(() => {
        videoStream.style.display = 'block';
        qrScanner.hasFlash().then(hasFlash => {
            if (hasFlash && flashToggle) {
                flashToggle.style.display = 'block';
                flashToggle.textContent = `Turn flash ${qrScanner.isFlashOn() ? 'off' : 'on'}`
            } else {
                if (flashToggle) {
                    flashToggle.style.display = 'none';
                }
            }
        });
        updateCameras();

    });
}

fileSelector.addEventListener('change', event => {
    const file = fileSelector.files[0];
    if (!file) {
        return;
    }

    filePrev.src = URL.createObjectURL(file);
    filePrev.classList.remove('d-none');
    resultCard.classList.add('d-none');

    QrScanner.scanImage(file)
        .then(result => readResult(result))
        .catch((e) => {
            console.log('TEST');
            setTimeout(() => {
                filePrev.classList.add('d-none', 'border-dark');
                filePrev.classList.remove('error', 'border-danger');
            }, 1000)
            console.log(e);
            filePrev.classList.remove('border-dark');
            filePrev.classList.add('error', 'border-danger');
        });
});

function turnOff() {
    videoStream.style.display = 'none';
    qrScanner.stop();
    isOn = false;
    stateToggle.textContent = "Scan";
    stateToggle.classList.remove('btn-danger');
}

function updateCameras() {
    QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => {
        while (camList.length > 0) {
            camList.remove(0)
        }
        const option = document.createElement('option');
        option.value = camera.id;
        option.text = camera.label;
        camList.add(option);
    }));
}

async function readResult(result) {
    turnOff();
    console.log(result);
    let data = await fetchAsync('http://localhost:3000/verify', JSON.stringify({ "cert": result }));
    console.log(data);
    resultCard.classList.remove('d-none');
    resultCard.classList.add(data.valid ? 'border-success' : 'border-danger');
    resultCard.getElementsByClassName('card-title')[0].textContent = data.data.nam.gn + ' ' + data.data.nam.fn;
    resultCard.getElementsByClassName('card-text')[0].textContent = data.data.dob;
}

async function fetchAsync(url, bodyData) {
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }, mode: 'cors', body: bodyData
    });
    let data = await response.json();
    return data;
}

updateCameras();
let hasCamera = await QrScanner.hasCamera(); // async
let elem = document.createElement('p');
elem.innerText = hasCamera;
document.body.appendChild(elem);
flashToggle.style.display = 'none';