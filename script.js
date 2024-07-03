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
// window.addEventListener('resize', debounce(check_size,250));

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

function squareWave(t, period=2) {
    return Math.floor(t / period) % 2;
}

function smoothstep(x) {
    return x * x * (3 - 2 * x); // Smoothstep function between 0 and 1
}

function cyclicSmoothstep(t) {
    return (2 * smoothstep((t / 2) % 1) - 1)*(2*squareWave(t)-1);
}

function bob(cur_frame){
    // returns [x, y] translation
    return [0, 4 * Math.sin(cur_frame / 30) - 2];
}

function drawn_gif(folder,frameCount,frameDuration,x,y,width,height,invertColors=false,animation_function=(cur_frame)=>[0,0],delay=0,timeshift=1){
    this.images = loadImages(folder,frameCount);
    this.curX = x;
    this.curY = y;
    this.width=width; this.height = height;
    this.frameDuration = frameDuration;
    this.frameCount=frameCount;
    this.invertColors=invertColors;

    this.draw = (cur_frame) => {
        let [mX, mY] = animation_function((cur_frame*timeshift)+delay);
        let img = this.images[Math.floor(cur_frame / this.frameDuration) % this.frameCount];
    
        // Clear the area before drawing
        if (this.invertColors) ctx.clearRect(this.curX + mX , this.curY + mY - 5, this.width, this.height+10);
    
        // Draw the image on the canvas
        ctx.drawImage(img, this.curX + mX, this.curY + mY, this.width, this.height);
    
        if (this.invertColors) {
            // Get the image data from the canvas
            let imageData = ctx.getImageData(this.curX + mX, this.curY + mY, this.width, this.height);
            let data = imageData.data;
    
            // Invert the colors while preserving the alpha channel
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];       // Red
                data[i + 1] = 255 - data[i + 1]; // Green
                data[i + 2] = 255 - data[i + 2]; // Blue
                // Alpha (data[i + 3]) remains unchanged
            }
    
            // Put the modified image data back on the canvas
            ctx.putImageData(imageData, this.curX + mX, this.curY + mY);
        }
    }

    this.moveTo= (newX,newY) =>{
        this.curX = newX;
        this.curY = newY;
    }
}

function draw_visualizer(x = 0, y = 0, width = canvas.width, height = canvas.height) {
    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'white';
    ctx.beginPath();

    const sliceWidth = width * 1.0 / bufferLength;
    let xPos = x;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const yPos = y + (v * height / 2);

        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }

        xPos += sliceWidth;
    }

    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();
}


var mainWindow = new drawn_gif("images/window 1",4,48,785,450,350,600,true,bob);

var inImage = new Image();
inImage.src="images/person.png";
function draw_mainWindow(cur_frame){
    mainWindow.draw(cur_frame);
    let [tX,tY]=bob(cur_frame+3);
    ctx.drawImage(inImage,822.5+tX,505+tY,275,510);
}

var small_visualizer = new drawn_gif("images/window 2",3,110,870,580,180,120,false,bob,7,0.95);

var cur_frame = 0
function animate() {
    requestAnimationFrame(animate);
    cur_frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_visualizer();
    draw_mainWindow(cur_frame);
    small_visualizer.draw(cur_frame);
}



audio.onplay = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

animate();