const lights_intro = document.getElementById("lights_intro");

function toggle_animation_lights(){
    if (lights_intro.checked) {
        document.getElementById("light1").style.animation="none 1s infinite ease-in-out";
        document.getElementById("light2").style.animation="none 2.5s infinite ease-in-out";
    } else {
        document.getElementById("light1").style.animation="swing_small 1s infinite ease-in-out";
        document.getElementById("light2").style.animation="swing 2.5s infinite ease-in-out";
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    const audioElement = document.getElementById('audio');
    const canvas = document.createElement('canvas');
    const waveformDiv = document.getElementById('waveform');
    waveformDiv.appendChild(canvas);

    const waveform2 = document.getElementById("waveform2");
    const canvas2 = document.createElement('canvas');
    waveform2.appendChild(canvas2)

    const canvasCtx = canvas.getContext('2d');
    const canvasCtx2 = canvas2.getContext('2d');

    canvasCtx2.fillStyle = 'white';

    // Set the canvas dimensions to match the fixed size of the div
    canvas.width = waveformDiv.clientWidth;
    canvas.height = waveformDiv.clientHeight;

    canvas2.width = waveform2.clientWidth;
    canvas2.height = waveform2.clientHeight;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioCtx.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    function draw_for_canvas(cur_canvasCtx,cur_canvas,blurframes=false){
        if (!blurframes) {
            cur_canvasCtx.fillStyle = 'white';
            cur_canvasCtx.fillRect(0, 0, cur_canvas.width, cur_canvas.height);
        } else {
            cur_canvasCtx.globalAlpha = 0.5; // Set the opacity for the previous frame
            cur_canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // White with reduced opacity
            cur_canvasCtx.fillRect(0, 0, cur_canvas.width, cur_canvas.height);
            cur_canvasCtx.globalAlpha = 1; // Reset the opacity to normal
        }

        cur_canvasCtx.lineWidth = 2;
        cur_canvasCtx.strokeStyle = (blurframes) ? 'rgb(50,50,50)' : 'rgb(0, 0, 0)';

        cur_canvasCtx.beginPath();

        const sliceWidth = cur_canvas.width * 1.0 / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * cur_canvas.height / 2;

            if(i === 0) {
                cur_canvasCtx.moveTo(x, y);
            } else {
                cur_canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        cur_canvasCtx.lineTo(cur_canvas.width, cur_canvas.height / 2);
        cur_canvasCtx.stroke();
    }

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        draw_for_canvas(canvasCtx,canvas,true);

        draw_for_canvas(canvasCtx2,canvas2);
    }

    audioElement.addEventListener('play', () => {
        audioCtx.resume().then(() => {
            draw();
        });
        introAnimation(document.getElementById("light2"),"swingintro","swing 2.5s infinite ease-in-out");
        introAnimation(document.getElementById("light1"),"swingintro_small","swing_small 1s infinite ease-in-out");
    });

    audioElement.addEventListener('pause', () => {
        waitForAnimation(document.getElementById("light2"),"swing","swingoutro");
        waitForAnimation(document.getElementById("light1"),"swing_small","swingoutro_small");
    });

    audioElement.addEventListener('ended', () => {
        waitForAnimation(document.getElementById("light2"),"swing","swingoutro");
        waitForAnimation(document.getElementById("light1"),"swing_small","swingoutro_small");
    });
});

function waitForAnimation(element, introAnimation, outroAnimation, new_duration=2.5, new_iteration = 1, overide=false) {
    console.log(overide);
    if (!lights_intro.checked && !overide) {console.log("disabled");return}
    console.log("waiting");
    let animationCount = 0;

    // Add event listener for animationiteration event
    element.addEventListener('animationiteration', function animationIterationHandler(event) {
        console.log('animation ended');
        console.log(event.animationName);
        console.log(introAnimation);
        console.log(event.animationName == introAnimation);
        // Check if the animation that iterated is the introAnimation
        if (event.animationName === introAnimation) {
            animationCount++;
            
            // If the animation has iterated more than once, trigger outro animation
            if (animationCount >= 1) {
                // Remove the event listener to prevent multiple executions
                element.removeEventListener('animationiteration', animationIterationHandler);
                
                // Trigger the outro animation
                element.style.animationName = outroAnimation;
                element.style["-webkit-animation-duration"] = new_duration + "s";
                element.style.animationIterationCount = new_iteration;

                // Add event listener for animationend event of the outro animation
                element.addEventListener('animationend', function animationEndHandler() {
                    // Remove the animation styles after the outro animation finishes
                    element.style.animation = 'none';
                }, {once: true});
            }
        }
    });
}


async function introAnimation(element, intro_animation, loop_animation, overide=false){
    if (!lights_intro.checked && !overide) {return}
    console.log("playing intro animation");
    
    waitForAnimation2(element, () => {
        element.style.animationName = intro_animation;
        element.style["-webkit-animation-duration"] = "2.5s";
        element.style.animationIterationCount = 1;

        element.addEventListener('animationend', function animationEndHandler(event) {
            // Remove the event listener to prevent multiple executions
            element.removeEventListener('animationend', animationEndHandler);
            
            // Trigger the looping animation
            element.style.animation = loop_animation;
        });
    });
}

function waitForAnimation2(element, callback) {
    // Check if the element has any active animations
    var computedStyle = window.getComputedStyle(element);
    var isAnimated = computedStyle.animationName !== 'none';
    // If no animations, execute the callback immediately
    if (!isAnimated) {
        console.log("animation not playing");
        callback();
        return;
    }
    console.log("animation playing");
    console.log(computedStyle.animationName);

    // Function to handle animation end
    function onAnimationEnd() {
        // Remove the event listener
        element.removeEventListener('animationend', onAnimationEnd);
        // Call the callback function
        callback();
    }

    // Add event listeners for transition end and animation end
    element.addEventListener('animationend', onAnimationEnd);
}

const delay = 1500;
const move_windows_check = document.getElementById("move_windows");

function createMiscWindow(containerElement) {
    // Create the div element
    const miscWindow = document.createElement('div');
    
    // Add class "miscwindow" to the div
    miscWindow.classList.add('miscwindow');
    
    // Calculate random positions within the container
    const containerWidth = containerElement.offsetWidth - miscWindow.offsetWidth;
    const containerHeight = containerElement.offsetHeight - miscWindow.offsetHeight;
    const centerX = containerElement.offsetWidth / 2;
    const centerY = containerElement.offsetHeight / 2;

    // Adjust the bias factor to control how clumped the images are towards the center
    const biasFactor = 0.7; // Increase for more clumping, decrease for less
    
    const randomX = centerX + Math.floor((Math.random() - 0.5) * containerWidth * biasFactor);
    const randomY = centerY + Math.floor((Math.random() - 0.5) * containerHeight * biasFactor);
    
    // Set the position
    miscWindow.style.left = randomX + 'px';
    miscWindow.style.top = randomY + 'px';

    const randomImageIndex = Math.floor(Math.random() * 3);
    miscWindow.style.backgroundImage = `url(images/window\\ 3//${randomImageIndex.toString().padStart(3, '0')}.png)`;

    miscWindow.style.animationDelay = Math.random()+"s";
    miscWindow.style.animationDuration = (3 + Math.random())+"s";

    // Create the img element
    const imgElement = document.createElement('img');
    imgElement.src = 'images/visualizer.gif'; // Image source
    
    // Append the img element to the div
    miscWindow.appendChild(imgElement);
    
    // Append the div to the container
    containerElement.appendChild(miscWindow);

    function move(){
        const randomX = centerX + Math.floor((Math.random() - 0.5) * containerWidth * biasFactor);
        const randomY = centerY + Math.floor((Math.random() - 0.5) * containerHeight * biasFactor);
        miscWindow.style.left = randomX + 'px';
        miscWindow.style.top = randomY + 'px';
        wait()
    }

    function wait(){
        setTimeout((move_windows_check.checked) ? move : wait, delay+(Math.random()*500));
    }

    move();
}

// Example usage:
// Assuming you have a div with id "container" as the area where the window will be positioned
const container = document.getElementById('miscarea1');
const amount_windows = 10;
for (let n = 0; n<amount_windows; n++){
    createMiscWindow(container);
}

const container2 = document.getElementById('miscarea2');
const amount_windows2 = 5;
for (let n = 0; n<amount_windows2; n++){
    createMiscWindow(container2);
}


document.getElementById('audioFileInput').addEventListener('change', function(event) {
    const audioElement = document.getElementById('audio');
    const file = event.target.files[0];
    if (file) {
        const objectURL = URL.createObjectURL(file);
        audioElement.src = objectURL;
        // audioElement.play();
    }
});