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
            cur_canvasCtx.globalAlpha = 0.1; // Set the opacity for the previous frame
            cur_canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // White with reduced opacity
            cur_canvasCtx.fillRect(0, 0, cur_canvas.width, cur_canvas.height);
            cur_canvasCtx.globalAlpha = 1; // Reset the opacity to normal
        }

        cur_canvasCtx.lineWidth = 2;
        cur_canvasCtx.strokeStyle = (blurframes) ? 'rgb(200,200,200)' : 'rgb(0, 0, 0)';

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
    });
});
