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

document.getElementById('audioFileInput').addEventListener('change', async function(event) {
    const audioElement = document.getElementById('audio');
    const nowPlayingElement = document.getElementById('now_playing_editable');
    const file = event.target.files[0];
    if (file) {
        // Stop any ongoing recording
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }

        const objectURL = URL.createObjectURL(file);
        audioElement.src = objectURL;
        //audioElement.play();
        //nowPlayingElement.textContent = 'Now playing:\n' + file.name;
        playing_text = file.name;
        
        // Wait for audio element to be ready
        await audioElement.play();

        // Capture audio stream from the audio element
        audioStream = audio.captureStream();

        // Combine video and audio streams into a single MediaStream
        combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);

        mediaRecorder = new MediaRecorder(combinedStream, options);

        mediaRecorder.onstop = function(e) {
            var blob = new Blob(chunks, { 'type' : 'video/mp4' });
            chunks = [];
            var videoURL = URL.createObjectURL(blob);
            video.src = videoURL;
        
            // Create a link element and set its href to the video URL
            var a = document.createElement('a');
            a.href = videoURL;
            a.download = 'recorded_video.mp4';
            document.body.appendChild(a);
            
            // Programmatically click the link to trigger the download
            a.click();
            
            // Remove the link from the document
            document.body.removeChild(a);
        };
        mediaRecorder.ondataavailable = function(e) {
            chunks.push(e.data);
        };
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

var videoStream = canvas.captureStream(60);
var audioStream = audio.captureStream(); // Capture audio stream from the audio element

// Combine video and audio streams into a single MediaStream
var combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);

var options = {
    mimeType: 'video/webm;codecs=vp9', // Adjust codec based on browser support
    videoBitsPerSecond: 25000000 // 25Mbps bitrate for high quality
};
var mediaRecorder = new MediaRecorder(combinedStream, options);

const video = document.querySelector("video");

mediaRecorder.onstop = function(e) {
    var blob = new Blob(chunks, { 'type' : 'video/mp4' });
    chunks = [];
    var videoURL = URL.createObjectURL(blob);
    video.src = videoURL;

    // Create a link element and set its href to the video URL
    var a = document.createElement('a');
    a.href = videoURL;
    a.download = 'recorded_video.mp4';
    document.body.appendChild(a);
    
    // Programmatically click the link to trigger the download
    a.click();
    
    // Remove the link from the document
    document.body.removeChild(a);
};

var chunks = [];
mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data);
};

const recording_indicator = document.getElementById("recording_indicator");

function start_recording() {
    mediaRecorder.start();
    recording_indicator.innerText = "recording";
}

function stop_recording() {
    mediaRecorder.stop();
    recording_indicator.innerText = "not recording";
}


// Function to smoothly move a variable based on audio volume
function smoothVolumeMovement(variableToUpdate) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Get the current volume level
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

    // Smoothly adjust the variable based on volume
    const targetValue = volume / 200; // Normalize volume to a range of 0 to 1
    const smoothingFactor = 0.1; // Adjust as needed for smoother or more responsive movement

    // Smoothly move variableToUpdate towards targetValue
    variableToUpdate += (targetValue - variableToUpdate) * smoothingFactor;

    // Ensure variableToUpdate stays within bounds (0 to 1)
    variableToUpdate = Math.min(Math.max(variableToUpdate, 0), 5);

    // Return the updated variable
    return variableToUpdate;
}


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

function bob_light(cur_frame){
    return [0,3*Math.sin(cur_frame/30)-1.5];
}

function drawn_gif(folder,frameCount,frameDuration,x,y,width,height,invertColors=false,animation_function=(cur_frame)=>[0,0],delay=0,timeshift=1,opacity=1){
    this.images = loadImages(folder,frameCount);
    this.curX = x;
    this.curY = y;
    this.width=width; this.height = height;
    this.frameDuration = frameDuration;
    this.frameCount=frameCount;
    this.invertColors=invertColors;

    this.draw = (cur_frame,curX=this.curX,curY=this.curY) => {
        ctx.globalAlpha = opacity;
        let [mX, mY] = animation_function((cur_frame*timeshift)+delay);
        let img = this.images[Math.floor(cur_frame / this.frameDuration) % this.frameCount];
    
        // Clear the area before drawing
        if (this.invertColors) ctx.clearRect(curX + mX , curY + mY, this.width, this.height);
    
        // Draw the image on the canvas
        ctx.drawImage(img, curX + mX, curY + mY, this.width, this.height);
    
        if (this.invertColors) {
            // Get the image data from the canvas
            let imageData = ctx.getImageData(curX + mX, curY + mY, this.width, this.height);
            let data = imageData.data;
    
            // Invert the colors while preserving the alpha channel
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];       // Red
                data[i + 1] = 255 - data[i + 1]; // Green
                data[i + 2] = 255 - data[i + 2]; // Blue
                // Alpha (data[i + 3]) remains unchanged
            }
    
            // Put the modified image data back on the canvas
            ctx.putImageData(imageData, curX + mX, curY + mY);
        }
        ctx.globalAlpha = 1;
    }

    this.moveTo= (newX,newY) =>{
        this.curX = newX;
        this.curY = newY;
    }
}

function draw_visualizer(x = 0, y = 0, width = canvas.width, height = canvas.height,color="white",stroke=5) {
    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = stroke;
    ctx.strokeStyle = color;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
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


function bob_small(cur_frame){
    return [bob(cur_frame*0.45)[1]*0.8,bob((cur_frame*.95)+7)[1]]
}

var background = new drawn_gif("images/background",4,60,0,0,1920,1080,false,(c)=>[0,0],0,1,0.9);

var mainWindow = new drawn_gif("images/window 1",4,48,785,450,350,600,false,bob);

var inImage = new Image();
inImage.src="images/person.png";
function draw_mainWindow(cur_frame){
    mainWindow.draw(cur_frame);
    let [tX,tY]=bob(cur_frame+3);
    ctx.drawImage(inImage,822.5+tX,505+tY,275,510);
}

var small_visualizer = new drawn_gif("images/window 2",3,110,870,580,180,120,false,bob_small);


var light_hanging = new Image(); 
light_hanging.src = 'images/lightbulb.png';

const spacing = 145;
const width = 150;
const height = 350;
var light_window = new drawn_gif("images/light window", 5, 120, 0, 180, width, width, true, bob_light); 

function draw_lights(cur_frame) {
    for (let n = spacing; n < 1920 - spacing; n = n + spacing + width) {
        let x = n;
        let y = 0;
        if (((n-spacing) / (spacing + width)) === 4) { // Check if it is the fifth light
            let swing_angle = Math.sin(cur_frame * 0.05) * Math.PI / 8; // Calculate the swing angle
            ctx.save(); // Save the current state of the canvas
            ctx.translate(x + width / 2, y); // Move the canvas origin to the top middle of the light
            ctx.rotate(swing_angle); // Rotate the canvas by the swing angle
            ctx.drawImage(light_hanging, -width / 2, 0); // Draw the light at the new origin
            ctx.restore(); // Restore the original state of the canvas
        } else {
            ctx.drawImage(light_hanging, x, y); // Draw the light normally
        }
        light_window.draw(cur_frame + n / spacing, x);
    }
}

// how to make the stream thing
// 1. create the two gifs
// 2. create a function that dictates the path, taking in one number and outputting the position allong it
//    this path should move, eg like the sum of sine waves with diffrent moving phases
// 3. every frame, generate a lot of positions
// 4. then, move the gifs to those locations and draw, and repeat for all
//    should work cause updating the position after drawing does nothing

const side_bob = (cur_frame)=>[bob(cur_frame)[1],0];

var moving_window = new drawn_gif("images/window 3",3,38,0,0,150,150,false);
var moving_gif = new drawn_gif("images/visualizer",9,10,0,0,75,75,false);

function path_a(t,a){
    // t is how far along
    // a is the timeshift
    return Math.sin(t+a) + (0.9 * Math.sin(t * 0.5 + a*0.9)) + (0.6 * Math.sin(t * 0.9 + a * 0.5)) + (0.05 * Math.sin(5 * t + 0.7 * a));
}

function path_b(t,a){
    // t is how far along
    // a is the timeshift
    return Math.cos(t+a) + (0.9 * Math.sin(t * 0.5 + a*0.9)) + (0.6 * Math.cos(t * 0.9 + a * 0.5)) + (0.1 * Math.sin(5 * t + 0.7 * a));
}

function path_c(t,a){
    return Math.sin(t+a) + (0.5 * Math.cos(t * 0.5 + a)) + (0.6 * Math.sin(t * 0.9 + a * 0.7));
}

function getRandomOrder(n) {
    // Create an array of numbers from 0 to n-1
    let array = [];
    for (let i = 0; i < n; i++) {
        array.push(i);
    }

    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

const canvasWidth = 2120;
const num_positions = 10;
const stepMultiplier = 0.1;
const timeShiftMultiplier = 0.01;
const order = getRandomOrder(10);


function draw_windows(cur_frame, path = path_a, speed = 4, height = 700, spacing = 200) {
    // Calculate the new positions
    let positions = [];
    let xShiftBase = cur_frame * speed;

    for (let i = 0; i < num_positions; i++) {
        let t = cur_frame * stepMultiplier + i;
        let a = cur_frame * timeShiftMultiplier;
        let x = (xShiftBase + i * spacing) % canvasWidth;
        let y = height + path(t + Math.PI / 2, a) * 50;
        positions.push([x - 200, y]);
    }

    // Draw the moving_window and moving_gif at each position
    for (let i = 0, len = order.length; i < len; i++) {
        let index = order[i];
        let [x, y] = positions[index];

        // Move and draw the moving_window
        moving_window.draw(cur_frame + i * 6, x, y);

        // Move and draw the moving_gif
        moving_gif.draw(cur_frame + i, x + 36, y + 55);
    }
}


const third_width = canvasWidth / 3;

function draw_text_window(cur_frame) {
    for (let i = 0; i <= 2; i++) {
        let x = ((cur_frame * 4 + third_width * i) % canvasWidth) - 200;
        let y = 725 + path_c(x * 0.01, cur_frame * 0.01) * 10;
        moving_window.draw(cur_frame, x, y);

        ctx.fillStyle = "white";
        ctx.font = "15px monospace";
        ctx.fillText("Now playing:", x + 20, y + 70);
        ctx.font = "12px monospace";

        if (playing_text.length > 20) {
            // Split text at the closest whitespace to the middle
            let mid = Math.floor(playing_text.length / 2);
            let before = playing_text.lastIndexOf(' ', mid);
            let after = playing_text.indexOf(' ', mid + 1);
            let splitIndex = before !== -1 ? before : after;

            if (splitIndex !== -1) {
                let line1 = playing_text.substring(0, splitIndex);
                let line2 = playing_text.substring(splitIndex + 1);

                ctx.fillText(line1, x + 20, y + 90);
                ctx.fillText(line2, x + 20, y + 105);
            } else {
                // If no whitespace found, fall back to breaking at the middle
                let line1 = playing_text.substring(0, mid);
                let line2 = playing_text.substring(mid);

                ctx.fillText(line1, x + 20, y + 90);
                ctx.fillText(line2, x + 20, y + 105);
            }
        } else {
            ctx.fillText(playing_text, x + 20, y + 90);
        }
    }
}

// const width = ctx.canvas.width;
// const height = ctx.canvas.height;

var gradients = [];
for (let i = 0; i < 10; i++) {
    // Random angle for each gradient
    let angle = Math.random() * 360;
    // Create a gradient object with properties
    gradients.push({
        angle: angle,
        x: Math.random() * 1920,  // Random initial position
        y: Math.random() * 1080,
        speed: Math.random() * 2 + 1,  // Random speed for movement
        color1: `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.1})`,  // Dark colors with low opacity
        color2: `rgba(0, 0, 0, ${Math.random() * 0.2 + 0.1})`
    });
}

const background_images = loadImages("images/blurred_images",5);
const background_move = [
    (t) => [Math.cos(t)*100,Math.sin(t)*100],
    (t) => [Math.cos(t/3)*100,Math.sin(t/3)*100],
    (t) => [Math.cos(t)*150,Math.sin(-t)*100],
    (t) => [Math.cos(t/2+0.5)*100,Math.sin(t/3 + 0.5)*100],
    (t) => [Math.sin(t/4)*150,Math.cos(t/4)*100]
]

function draw_background(cur_frame) {
    // Code for background

    ctx.globalAlpha = 0.1;
    for (let i = 0;i<5;i++){
        let [x,y] = background_move[i](cur_frame/24);
        ctx.drawImage(background_images[i],x-200,y-200);
    }
    
    // Draw the custom background object
    background.draw(cur_frame);
}



var cur_frame = 0;
var secondary_frame = 0;
var playing_text = "placeholder.wav";

const fps_monitor = document.getElementById("fps");

var lastFrame = performance.now();
var current_time;

var volume = 0;

var start_offset = 0;

function animate() {
    requestAnimationFrame(animate);

    // get fps
    current_time = performance.now();
    fps_monitor.innerText = Math.floor((1/((current_time-lastFrame)/1000))*100)/100;
    lastFrame = current_time;

    cur_frame=(performance.now()-start_offset)/24;

    volume = smoothVolumeMovement(volume);
    secondary_frame+=Math.pow(2,volume*5);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_background(cur_frame);
    draw_windows(secondary_frame);
    draw_windows(secondary_frame,path_b,5,750,210);
    draw_visualizer();
    draw_text_window((cur_frame+secondary_frame)/2);
    draw_mainWindow(cur_frame);
    small_visualizer.draw(cur_frame);
    draw_visualizer(880+(bob(cur_frame*0.45)[1]*0.8),595+bob((cur_frame*.95)+7)[1],160,100,"black",3);
    draw_lights(cur_frame);
}

function restart(){
    volume = 0;
    start_offset = performance.now();
    secondary_frame = 0;
}

audio.onplay = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

animate();