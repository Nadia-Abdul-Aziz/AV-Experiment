/**
 * Title of Project
 * Author Name
 * 
 * HOW EMBARRASSING! I HAVE NO DESCRIPTION OF MY PROJECT!
 * PLEASE REMOVE A GRADE FROM MY WORK IF IT'S GRADED!
 */

"use strict";

/**
 * OH LOOK I DIDN'T DESCRIBE SETUP!!
*/

let audioStarted = false;
let pluckSynth;
let chordSynth;
let sawLayer;
let reverb;
let delay;
let startButton;

const scale = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"];

const chords = [
    ["C2", "G2"],
    ["F2", "C3"],
    ["G2", "D3"],
    ["C2", "C3"],
];

let currentChordIndex = 0;
let lastChordTime = 0;
const chordCooldown = 3000;

let change = 0.02;
let bgColor = {
    h: 220,
    s: 40,
    b: 0,
};

let balls = [];
let numBalls = 300;
let ballsSpawned = false;
let ball = {
    ballSize: 2,
    ballPosX: 250,
    ballPosY: 250,
    ballVelX: 1,
    ballVelY: 1,
};

const centerX = 250;
const centerY = 250;
const centerTolerance = 5;
const minBallsForChord = 1;

function setup() {
    createCanvas(500, 500);
    stroke("white");
    strokeWeight(5);
    rectMode(CENTER);
    imageMode(CENTER);
    setupAudio();
}

function draw() {
    drawBg();
    stroke("white");
    strokeWeight(1);
    noFill();
    rectMode(CENTER);
    rect(250, 250, 500, 500);
    spawnBall();
    checkCenterGathering();
    createStartButton();
}

function setupAudio() {
    pluckSynth = new Tone.PluckSynth({
        attackNoise: 0.3,
        dampening: 4000,
        resonance: 0.7
    });

    chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "sine",
            spread: 20,
            count: 3
        },
        envelope: {
            attack: 6.0,
            decay: 4.0,
            sustain: 0.3,
            release: 15.0
        },
        filter: {
            type: "lowpass",
            frequency: 400,
            rolloff: -12,
            Q: 0.1
        }
    });

    sawLayer = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "triangle",
            spread: 15,
            count: 2
        },
        envelope: {
            attack: 5.0,
            decay: 3.0,
            sustain: 0.15,
            release: 12.0
        },
        filter: {
            type: "lowpass",
            frequency: 300,
            rolloff: -12,
            Q: 0.1
        }
    });

    reverb = new Tone.Reverb({
        decay: 8,
        wet: 0.7,
        preDelay: 0.01
    });

    const chordReverb = new Tone.Reverb({
        decay: 25,
        wet: 0.8,
        preDelay: 0.05,
        roomSize: 0.7
    });

    const chordChorus = new Tone.Chorus({
        frequency: 0.5,
        delayTime: 2.5,
        depth: 0.4,
        wet: 0.5
    });

    const chordWidener = new Tone.StereoWidener(0.5);

    delay = new Tone.FeedbackDelay({
        delayTime: "8n.",
        feedback: 0.25,
        wet: 0.2
    });

    const chordGain = new Tone.Gain(0.35);
    const sawLayerGain = new Tone.Gain(0.08);
    const pluckGain = new Tone.Gain(0.4);

    pluckSynth.connect(pluckGain);
    pluckGain.connect(delay);

    chordSynth.connect(chordChorus);
    chordChorus.connect(chordWidener);
    chordWidener.connect(chordReverb);
    chordReverb.connect(chordGain);

    sawLayer.connect(chordChorus);
    chordChorus.connect(sawLayerGain);
    sawLayerGain.connect(chordReverb);

    chordGain.connect(delay);
    sawLayerGain.connect(delay);

    delay.connect(reverb);
    reverb.toDestination();

    chordChorus.start();
}

function createStartButton() {
    if (!startButton) {
        startButton = createButton('Start Audio');
        startButton.position(width / 2 - 50, height + 20);
        startButton.style('padding', '12px 24px');
        startButton.style('font-size', '16px');
        startButton.style('background-color', '#333333');
        startButton.style('color', 'white');
        startButton.style('border', 'none');
        startButton.style('border-radius', '6px');
        startButton.style('cursor', 'pointer');
        startButton.mousePressed(startAudio);
    }
}

async function startAudio() {
    if (!audioStarted) {
        await Tone.start();
        audioStarted = true;
        startButton.html('Audio Started');
        startButton.style('background-color', '#006600');
        console.log('Audio context started');
    }
}

let lastSoundTime = 0;

function playPluckSound(ballObj) {
    if (!audioStarted || typeof Tone === 'undefined') return;

    let currentTime = millis();
    if (currentTime - lastSoundTime < 25) return;
    lastSoundTime = currentTime;

    try {
        let noteIndex = Math.floor(map(ballObj.ballPosY, 0, height, 0, scale.length));
        noteIndex = constrain(noteIndex, 0, scale.length - 1);
        let note = scale[noteIndex];

        let velocity = map(abs(ballObj.ballVelX) + abs(ballObj.ballVelY), 0, 8, 0.1, 0.3);

        pluckSynth.triggerAttackRelease(note, "8n", "+0", velocity);
    } catch (error) {
        console.log('Audio error:', error);
    }
}

function checkCenterGathering() {
    if (!audioStarted || typeof Tone === 'undefined') return;

    let ballsAtCenter = 0;

    for (let ballObj of balls) {
        let distanceToCenter = dist(ballObj.ballPosX, ballObj.ballPosY, centerX, centerY);
        if (distanceToCenter <= centerTolerance) {
            ballsAtCenter++;
        }
    }

    let currentTime = millis();
    if (ballsAtCenter >= minBallsForChord && currentTime - lastChordTime > chordCooldown) {
        playChord(ballsAtCenter);
        lastChordTime = currentTime;
    }
}

function playChord(ballCount) {
    try {
        let chord = chords[currentChordIndex];

        let velocity = 0.5;

        chordSynth.triggerAttackRelease(chord, "1n", "+0", velocity);

        sawLayer.triggerAttackRelease(chord, "1n", "+0", velocity * 0.7);

        currentChordIndex = (currentChordIndex + 1) % chords.length;

        console.log(`Gentle chord triggered! Balls at center: ${ballCount}`);

    } catch (error) {
        console.log('Chord audio error:', error);
    }
}

function drawBg() {
    push();
    colorMode(HSB);
    bgColor.b += change;

    if (bgColor.b > 3 || bgColor.b < 0) {
        change *= -1;
    }
    background(bgColor.h, bgColor.s, bgColor.b);
    pop();
}

function drawBall(ballObj) {
    push();
    fill(255, 180);
    noStroke();
    ellipse(ballObj.ballPosX, ballObj.ballPosY, ballObj.ballSize, ballObj.ballSize);
    pop();
}

function moveBall(ballObj) {
    ballObj.ballPosX += ballObj.ballVelX;
    ballObj.ballPosY += ballObj.ballVelY;

    let bounced = false;

    if (ballObj.ballPosX + ballObj.ballSize / 2 >= width || ballObj.ballPosX - ballObj.ballSize / 2 <= 0) {
        ballObj.ballVelX *= -1;
        bounced = true;
        if (ballObj.ballPosX + ballObj.ballSize / 2 >= width) ballObj.ballPosX = width - ballObj.ballSize / 2;
        if (ballObj.ballPosX - ballObj.ballSize / 2 <= 0) ballObj.ballPosX = ballObj.ballSize / 2;
    }

    if (ballObj.ballPosY + ballObj.ballSize / 2 >= height || ballObj.ballPosY - ballObj.ballSize / 2 <= 0) {
        ballObj.ballVelY *= -1;
        bounced = true;
        if (ballObj.ballPosY + ballObj.ballSize / 2 >= height) ballObj.ballPosY = height - ballObj.ballSize / 2;
        if (ballObj.ballPosY - ballObj.ballSize / 2 <= 0) ballObj.ballPosY = ballObj.ballSize / 2;
    }

    if (bounced) {
        playPluckSound(ballObj);
    }
}

function spawnBall() {
    if (!ballsSpawned) {
        for (let i = 0; i < numBalls; i++) {
            let angle = (TWO_PI / numBalls) * i;

            let speed = 0.5;
            let ballVelX = cos(angle) * speed;
            let ballVelY = sin(angle) * speed;

            let newBall = {
                ballSize: ball.ballSize,
                ballPosX: ball.ballPosX,
                ballPosY: ball.ballPosY,
                ballVelX: ballVelX,
                ballVelY: ballVelY
            };

            balls.push(newBall);
        }
        ballsSpawned = true;
    }

    for (let ballObj of balls) {
        moveBall(ballObj);
        drawBall(ballObj);
    }
}