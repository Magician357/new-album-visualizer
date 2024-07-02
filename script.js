function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function check_size(){
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;

    if (viewportWidth < 1920 || viewportHeight < 1400) {
        alert('Your viewport does not meet the recommended dimensions (Width: 1920px, Height: 1400px). You may need to zoom out to view the whole thing, or resize your viewport.');
    }
}

check_size();
window.addEventListener('resize', debounce(check_size,250));

// var captions = [];
    
//     // Fetch captions from JSON file when the page loads
//     window.addEventListener('load', () => {
//         fetch('audio/captions/placeholder.json')
//             .then(response => response.json())
//             .then(data => {
//                 captions = data;
//             })
//             .catch(error => console.error('Error loading captions:', error));
//     });

//     const updateCaptions = () => {
//         const {currentTime} = audioElement;

//         const currentCaption = captions.find(caption => currentTime >= caption.start && currentTime < caption.end);

//         captionDivs.forEach(div => {
//             if (currentCaption) {
//                 if (currentCaption.hasOwnProperty("text2") && div.dataset.captiontype==="true"){
//                     div.innerHTML = currentCaption.text2;
//                 } else div.innerHTML = currentCaption.text;
//             } else {
//                 div.innerHTML = '';
//             }
//         });
//     }

document.getElementById('audioFileInput').addEventListener('change', function(event) {
    const audioElement = document.getElementById('audio');
    const nowPlayingElement = document.getElementById('now_playing_editable');
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        audioElement.src = objectURL;
        // audioElement.play();
        // nowPlayingElement.textContent = 'Now playing:\n' + file.name;
    }
});




const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('audio');

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaElementSource(audio);

source.connect(analyser);
analyser.connect(audioContext.destination);

analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function loadImages(folder, frameCount) {
    let images=[];
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = `${folder}/${String(i).padStart(3, '0')}.png`;
        images.push(img);
    }
    
    return images;
}

var frame_count=0
function draw_window_test(){
    ctx.drawImage(test_window[Math.floor(frame_count/18)%3],50,50);
    frame_count++;
}

const test_window=loadImages("images/window 3/",3)

function draw_visualizer() {

    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.beginPath();

    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_visualizer();
    draw_window_test();
}



audio.onplay = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    animate();
};