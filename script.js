document.getElementById('audioFileInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        // Stop any ongoing recording
        if (mediaRecorder && (mediaRecorder.state === "recording" || mediaRecorder.state === "paused")) {
            mediaRecorder.stop();
        }

        const objectURL = URL.createObjectURL(file);
        audio.src = objectURL;
        playing_text = file.name;
        render_text();

        await load_audio();
    }
});

var firsttime=true;

async function load_audio(){
    // Wait for audio element to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!firsttime) {await audio.play();}
    firsttime=false;

    // Capture audio stream from the audio element
    audioStream = audio.captureStream();

    // Combine video and audio streams into a single MediaStream
    combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);

    mediaRecorder = new MediaRecorder(combinedStream, options);

    mediaRecorder.onstop = function() {
        var blob = new Blob(chunks, { 'type': 'video/webm' });
        chunks = [];
        var videoURL = URL.createObjectURL(blob);
        video.src = videoURL;
    
        // Create a link element and set its href to the video URL
        var a = document.createElement('a');
        a.href = videoURL;
        a.download = 'recorded_video.webm'; // Use webm format to match the MIME type
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
    mimeType: 'video/webm;codecs=vp8', // Adjust codec based on browser support
    videoBitsPerSecond: 25000000 // 25Mbps bitrate for high quality
};
var mediaRecorder = new MediaRecorder(combinedStream, options);

const video = document.querySelector("video");

load_audio();

mediaRecorder.onstop = function() {
    var blob = new Blob(chunks, { 'type': 'video/webm' });
    chunks = [];
    var videoURL = URL.createObjectURL(blob);
    video.src = videoURL;

    // Create a link element and set its href to the video URL
    var a = document.createElement('a');
    a.href = videoURL;
    a.download = 'recorded_video.webm'; // Use webm format to match the MIME type
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
    // Get the current volume level
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

    // Smoothly adjust the variable based on volume
    const targetValue = volume / 200; // Normalize volume to a range of 0 to 1
    const smoothingFactor = 0.1; // Adjust as needed for smoother or more responsive movement

    // Smoothly move variableToUpdate towards targetValue
    variableToUpdate += (targetValue - variableToUpdate) * smoothingFactor;

    // Ensure variableToUpdate stays within bounds (0 to 1)
    return Math.min(Math.max(variableToUpdate, 0), 5);
}


function loadImages(folder, frameCount) {
    let images = [];
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
    this.width=Math.floor(width); this.height = Math.floor(height);
    this.frameDuration = frameDuration;
    this.frameCount=frameCount;
    this.invertColors=invertColors;

    this.canvases = [];
    this.images.forEach((img)=> {
        let cur_canvas = new OffscreenCanvas(this.width,this.height);
        let cur_ctx = cur_canvas.getContext("2d");
        img.onload = () => {cur_ctx.drawImage(img,0,0,this.width,this.height);}
        if (invertColors) {
            let imageData = cur_ctx.getImageData(0, 0, this.width, this.height);
            let {data} = imageData;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i]; // Red
                data[i + 1] = 255 - data[i + 1]; // Green
                data[i + 2] = 255 - data[i + 2]; // Blue
            }
            cur_ctx.putImageData(imageData, 0, 0);
        }
        this.canvases.push(cur_canvas);
    })

    console.log(this.canvases);

    this.draw = (cur_frame,curX=this.curX,curY=this.curY) => {
        ctx.globalAlpha = opacity;
        let [mX, mY] = animation_function((cur_frame*timeshift)+delay);
        let img = this.canvases[Math.floor(cur_frame / this.frameDuration) % this.frameCount];

        // Draw the image on the canvas
        ctx.drawImage(img, (curX + mX)|0, (curY + mY)|0, this.width, this.height);
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
    ctx.drawImage(inImage,(822.5+tX)|0,(505+tY)|0,275,510);
}

var small_visualizer = new drawn_gif("images/window 2",3,110,870,580,180,120,false,bob_small);


let light_hanging_img = new Image(); 
light_hanging_img.src = 'images/lightbulb.png';
var light_hanging;
light_hanging_img.onload = () => {
    light_hanging = new OffscreenCanvas(light_hanging_img.width,light_hanging_img.height);
    light_hanging.getContext("2d").drawImage(light_hanging_img,0,0);

    prerendered_lights = new OffscreenCanvas(1920,light_hanging_img.height+50);
    let cur_context = prerendered_lights.getContext("2d");

    for (let n = spacing; n < 1920 - spacing; n = n + spacing + width) {
        let x = n;
        if (!(((n-spacing) / (spacing + width)) === 4)) { // Check if it is the fifth light
            cur_context.drawImage(light_hanging, x, 0); // Draw the light normally
        }
        light_x.push(n);
    }
}

const spacing = 145;
const width = 150;
const width_half = width/2;
const height = 350;
var light_window = new drawn_gif("images/light window", 5, 120, 0, 180, width, width, false, bob_light); 

var light_x = [];
var prerendered_lights;

// render all lights before hand except for the moving one

function draw_lights(cur_frame) {
    ctx.drawImage(prerendered_lights,0,0);
    for (let n = 0; n<6; n++) {
        let x = light_x[n];
        if (n===4) {
            let swing_angle = Math.sin(cur_frame * 0.05) * Math.PI / 8; // Calculate the swing angle
            ctx.save(); // Save the current state of the canvas
            ctx.translate((x + width_half)|0, 0); // Move the canvas origin to the top middle of the light
            ctx.rotate(swing_angle); // Rotate the canvas by the swing angle
            ctx.drawImage(light_hanging, (-width_half)|0, 0); // Draw the light at the new origin
            ctx.restore(); // Restore the original state of the canvas
        }
        light_window.draw(cur_frame + n*10, x);
    }
}

const side_bob = (cur_frame)=>[bob(cur_frame)[1],0];

var moving_window = new drawn_gif("images/window 3",3,38,0,0,150,150,false);
var moving_gif = new drawn_gif("images/visualizer",9,10,0,0,75,75,false);

function path_a(t,a){
    // t is how far along
    // a is the timeshift
    return Math.sin(t+a) + (0.9 * Math.sin(t * 0.5 + a*0.9)) + (0.6 * Math.sin(t * 0.9 + a * 0.5));
}

function path_b(t,a){
    // t is how far along
    // a is the timeshift
    return Math.cos(t+a) + (0.9 * Math.sin(t * 0.5 + a*0.9)) + (0.6 * Math.cos(t * 0.9 + a * 0.5));
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

const text_canvas = new OffscreenCanvas(120,90);
const text_ctx = text_canvas.getContext("2d");
text_ctx.fillStyle="white";

const text_offset = 20;

function render_text(){
    text_ctx.clearRect(0,0,120,90);
    text_ctx.font = "15px monospace";
    text_ctx.fillText("Now playing:", 0, text_offset);
    text_ctx.font = "12px monospace";
    if (playing_text.length > 15) {
        // Split text at the closest whitespace to the middle
        let mid = Math.floor(playing_text.length / 2);
        let before = playing_text.lastIndexOf(' ', mid);
        let after = playing_text.indexOf(' ', mid + 1);
        let splitIndex = before !== -1 ? before : after;

        if (splitIndex !== -1) {
            let line1 = playing_text.substring(0, splitIndex);
            let line2 = playing_text.substring(splitIndex + 1);

            text_ctx.fillText(line1, 0, 20+text_offset);
            text_ctx.fillText(line2, 0, 35+text_offset);
        } else {
            // If no whitespace found, fall back to breaking at the middle
            let line1 = playing_text.substring(0, mid);
            let line2 = playing_text.substring(mid);

            text_ctx.fillText(line1, 0, 20+text_offset);
            text_ctx.fillText(line2, 0, y + 35+text_offset);
        }
    } else {
        text_ctx.fillText(playing_text, 0, 20+text_offset);
    }
}

function draw_text_window(cur_frame) {
    for (let i = 0; i <= 2; i++) {
        let x = ((cur_frame * 4 + third_width * i) % canvasWidth) - 200;
        let y = 725 + path_c(x * 0.01, cur_frame * 0.01) * 10;
        moving_window.draw(cur_frame, x, y);

        ctx.drawImage(text_canvas,(x+20)|0,(y+70-text_offset)|0);
    }
}

const background_images_pre = loadImages("images/blurred_images",5);
var background_images = [];
var finished_images = 0;
background_images_pre.forEach((img) => img.onload= () => {
    let cur_canvas= new OffscreenCanvas(2500,2500);
    let cur_ctx = cur_canvas.getContext("2d");
    cur_ctx.globalAlpha = 0.15; 
    cur_ctx.drawImage(img,0,0); 
    background_images.push(cur_canvas);
    console.log("canvas finished");
    finished_images++;
});
const background_move = [
    (t) => [Math.cos(t)*100,Math.sin(t)*100],
    (t) => [Math.cos(t/3)*100,Math.sin(t/3)*100],
    (t) => [Math.cos(t)*150,Math.sin(-t)*100],
    (t) => [Math.cos(t/2+0.5)*100,Math.sin(t/3 + 0.5)*100],
    (t) => [Math.sin(t/4)*150,Math.cos(t/4)*100]
]

function draw_background(cur_frame) {
    for (let i = 0;i<5;i++){
        let [x,y] = background_move[i](cur_frame/24);
        ctx.drawImage(background_images[i],(x-200)|0,(y-200)|0);
    }
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

const targetFPS = 60;
const frameDuration = 1000 / targetFPS;
const fpsSamples = 10; // Number of frames to average

let lastFrameTime = performance.now();
let frameTimes = [targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS]; // Array to store frame times

function animate() {
    requestAnimationFrame(animate);

    let current_time = performance.now();
    let elapsed = current_time - lastFrameTime;

    // Update the last frame time
    lastFrameTime = current_time - (elapsed % frameDuration);

    // Calculate and update fps
    frameTimes.push(elapsed);
    frameTimes.shift(); // Remove the oldest frame time
    let averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    let averageFPS = 1000 / averageFrameTime;

    fps_monitor.innerText = `${Math.floor(averageFPS * 100) / 100} (${Math.floor(averageFrameTime * 10) / 10} ms per frame)`;

    lastFrame = current_time;

    cur_frame = (current_time - start_offset) / 24;

    volume = smoothVolumeMovement(volume);
    secondary_frame += (Math.pow(2, volume * 5) * elapsed / 20);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_background(cur_frame);
    draw_windows(secondary_frame);
    draw_windows(secondary_frame, path_b, 5, 750, 210);
    draw_visualizer();
    draw_text_window((cur_frame + secondary_frame) / 2);
    draw_mainWindow(cur_frame);
    small_visualizer.draw(cur_frame);
    draw_visualizer(880 + (bob(cur_frame * 0.45)[1] * 0.8), 595 + bob((cur_frame * .95) + 7)[1], 160, 100, "black", 3);
    draw_lights(cur_frame);
}

function restart() {
    volume = 0;
    start_offset = performance.now();
    secondary_frame = 0;
    frameTimes = [targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS,targetFPS];
    render_text();
}

// Start the animation loop
requestAnimationFrame(animate);

audio.onplay = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

animate();
render_text();
restart();