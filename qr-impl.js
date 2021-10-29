// @ts-nocheck

import QrScanner from "./qr-scanner.min.js";
QrScanner.WORKER_PATH = './qr-scanner-worker.min.js';
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
    let data = await fetchAsync('https://covid-qr-backend.herokuapp.com/verify', JSON.stringify({ "cert": result }));
    console.log(data);
    resultCard.classList.remove('d-none');
    resultCard.classList.add(data.valid ? 'border-success' : 'border-danger');
    resultCard.getElementsByClassName('card-title')[0].classList.add(data.valid ? 'text-success' : 'text-danger');
    resultCard.getElementsByClassName('card-title')[0].textContent = data.data.nam.gn + ' ' + data.data.nam.fn;
    resultCard.getElementsByClassName('card-text')[0].textContent = data.data.dob;
    const certType = data.data.v ? 'V' : data.data.t ? 'T' : 'R';
    let elem = createMoreInformation(data, certType);
    document.getElementById('collapseInfo').replaceChildren(elem);
}

function createMoreInformation(data, certType) {
    let cert_data = certType === 'V' ? data.data.v[0] : certType === 'T' ? data.data.t[0] : data.data.r[0];
    let flag = getFlagEmoji(cert_data.ci.split(':')[3]);

    let listContainer = document.createElement('ul');
    listContainer.classList.add('list-group');

    let listItemFlag = document.createElement('li');
    listItemFlag.classList.add('list-group-item');
    listItemFlag.innerText = flag + cert_data.is;
    let listItemType = document.createElement('li');
    listItemType.classList.add('list-group-item');
    listItemType.innerText = certType === 'V' ? '💉' : certType === 'T' ? '🧪' : '🤒';
    let listItemValid = document.createElement('li');
    listItemValid.classList.add('list-group-item');
    listItemValid.innerText = 'Valid through: ' + certType === 'V' ? getValidUntilVaccine(cert_data) : certType === 'T' ? getValidUntilTest(cert_data) : getValidUntilRecovery(cert_data);

    listContainer.appendChild(listItemFlag);
    listContainer.appendChild(listItemType);
    listContainer.appendChild(listItemValid);
    return listContainer;
}

function getValidUntilVaccine(data) {
    let dateOfVacc = new Date(data.dt);
    return new Date(dateOfVacc.setFullYear(dateOfVacc.getFullYear()+1)-24*60*60*1000).toDateString();
}

function getValidUntilTest(data) {
    let test_time = cert_data.sc;
    let validDuration = (cert_data.tt === 'LP6464-4' ? 72*60*60*1000 : 48*60*60*1000);
    return new Date(test_time+validDuration).toDateString();
}

function getValidUntilRecovery(data) {
    let dateOfTest = cert_data.fr;
    return new Date(dateOfTest+11*24*60*60*1000).toDateString() + ' - ' + new Date(dateOfTest + 180*34*60*60*1000).toDateString();
}

function getFlagEmoji(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
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

resultCard.getElementsByClassName('card-link')[0].addEventListener('click', changeCardText)

function changeCardText(event) {
    if (event.target.classList.contains('collapsed')) {
        event.target.textContent = 'More Information';
    } else {
        event.target.textContent = 'Hide Information';
    }
}

updateCameras();
flashToggle.style.display = 'none';