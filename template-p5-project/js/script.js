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

// Audio variables
let audioStarted = false;
let pluckSynth;
let chordSynth;
let sawLayer;
let reverb;
let delay;
let startButton;

// Scale of notes to use
const scale = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"];

// Pure consonant chord definitions - only perfect consonances
const chords = [
    ["C2", "G2"], // Perfect 5th - C major tonality
    ["F2", "C3"], // Perfect 5th - F (subdominant relationship) 
    ["G2", "D3"], // Perfect 5th - G (dominant relationship)
    ["C2", "C3"], // Perfect octave - pure C
];

let currentChordIndex = 0;
let lastChordTime = 0;
const chordCooldown = 2000; // 2 seconds between chords

// Background variables
let change = 0.07;
let bgColor = {
    h: 220,
    s: 70,
    b: 0,
};

// Ball variables
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

// Center detection variables
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
    strokeWeight(2);
    noFill();
    rectMode(CENTER);
    rect(250, 250, 500, 500);
    spawnBall();
    checkCenterGathering();
    createStartButton();
}

function setupAudio() {
    // Enhanced pluck synthesizer for more authentic pluck sound
    pluckSynth = new Tone.PluckSynth({
        attackNoise: 1.5,
        dampening: 2000,
        resonance: 0.95
    });

    // MASSIVE bassy atmospheric chord synth with subtle saw texture
    chordSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "fatsine",   // Fatter sine for more body
            spread: 60,        // Even more detuning for massive width
            count: 6           // More oscillators for huge presence
        },
        envelope: {
            attack: 4.0,       // Super slow, massive attack
            decay: 8.0,        // Even longer decay
            sustain: 0.5,      // Higher sustain for more presence
            release: 30.0      // MASSIVE release - 30 seconds!
        },
        filter: {
            type: "lowpass",
            frequency: 250,    // Lower cutoff for more bass
            rolloff: -24,
            Q: 0.3             // Even smoother
        }
    });

    // Subtle saw layer for texture only
    sawLayer = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "sawtooth",
            spread: 30,
            count: 3
        },
        envelope: {
            attack: 3.5,
            decay: 7.0,        // Longer decay for saw layer
            sustain: 0.25,     // Slightly higher sustain
            release: 25.0      // Much longer release for saw texture
        },
        filter: {
            type: "lowpass",
            frequency: 180,    // Very filtered for just texture
            rolloff: -24,
            Q: 0.2
        }
    });

    // Shared reverb for overall atmosphere
    reverb = new Tone.Reverb({
        decay: 15,
        wet: 0.95,
        preDelay: 0.02
    });

    // ULTRA MEGA reverb for chords - absolutely massive trails
    const chordReverb = new Tone.Reverb({
        decay: 60,      // ENORMOUS decay time - 1 minute trails!
        wet: 1.0,       // Fully wet
        preDelay: 0.1,  // Even longer pre-delay for cathedral space
        roomSize: 0.98  // Massive room simulation
    });

    // Enhanced chorus for even more width and shimmer
    const chordChorus = new Tone.Chorus({
        frequency: 0.3,  // Slower for more subtle movement
        delayTime: 4.5,  // Longer delay for bigger sound
        depth: 0.8,      // More depth
        wet: 0.9         // More chorus effect
    });

    // Stereo widener for immersive chord spread
    const chordWidener = new Tone.StereoWidener(0.8);

    // Enhanced delay for more ethereal quality
    delay = new Tone.FeedbackDelay({
        delayTime: "8n.",
        feedback: 0.4,
        wet: 0.3
    });

    // Pitch shifter for chord harmonics (subtle octave doubling)
    const chordShifter = new Tone.PitchShift({
        pitch: 12,      // One octave up
        wet: 0.2        // Subtle blend
    });

    // Volume controls - much bigger chord presence
    const chordGain = new Tone.Gain(0.5);    // Bigger presence
    const sawLayerGain = new Tone.Gain(0.08); // Very quiet saw layer for texture only
    const pluckGain = new Tone.Gain(0.6);

    // Connect pluck chain (simpler)
    pluckSynth.connect(pluckGain);
    pluckGain.connect(delay);

    // Connect main chord chain (massive processing)
    chordSynth.connect(chordChorus);
    chordChorus.connect(chordShifter);
    chordShifter.connect(chordWidener);
    chordWidener.connect(chordReverb);
    chordReverb.connect(chordGain);

    // Connect subtle saw layer chain
    sawLayer.connect(chordChorus); // Share the chorus
    chordChorus.connect(sawLayerGain);
    sawLayerGain.connect(chordReverb); // Share the reverb too

    // Mix both chord layers
    chordGain.connect(delay);
    sawLayerGain.connect(delay);

    delay.connect(reverb);
    reverb.toDestination();

    // Start the chorus effect
    chordChorus.start();
}

function createStartButton() {
    if (!startButton) {
        startButton = createButton('Start Audio');
        startButton.position(width / 2 - 50, height + 20);
        startButton.style('padding', '12px 24px');
        startButton.style('font-size', '16px');
        startButton.style('background-color', '#000000ff');
        startButton.style('color', 'white');
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

    // Prevent too frequent audio calls
    let currentTime = millis();
    if (currentTime - lastSoundTime < 15) return; // Slightly longer interval
    lastSoundTime = currentTime;

    try {
        // Map ball position to musical notes
        let noteIndex = Math.floor(map(ballObj.ballPosY, 0, height, 0, scale.length));
        noteIndex = constrain(noteIndex, 0, scale.length - 1);
        let note = scale[noteIndex];

        // More subtle velocity variation
        let velocity = map(abs(ballObj.ballVelX) + abs(ballObj.ballVelY), 0, 8, 0.2, 0.5);

        // Shorter, more pluck-like duration
        pluckSynth.triggerAttackRelease(note, "16n", "+0", velocity);
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
        // Get the current chord (simple perfect 5ths)
        let chord = chords[currentChordIndex];

        // Bigger but still controlled volume
        let velocity = 0.4;

        // ULTRA long, overlapping duration for massive bigness and long trails
        chordSynth.triggerAttackRelease(chord, "1n", "+0", velocity);

        // Trigger the subtle saw layer for texture - also ultra long
        sawLayer.triggerAttackRelease(chord, "1n", "+0", velocity * 0.3);

        // Cycle to next chord
        currentChordIndex = (currentChordIndex + 1) % chords.length;

        console.log(`MASSIVE chord triggered! Balls at center: ${ballCount}`);

    } catch (error) {
        console.log('Chord audio error:', error);
    }
}

// Draws the pulsing background
function drawBg() {
    push();
    colorMode(HSB);
    bgColor.b += change;

    if (bgColor.b > 5 || bgColor.b < 0) {
        change *= -1;
    }
    background(bgColor.h, bgColor.s, bgColor.b);
    pop();
}

function drawBall(ballObj) {
    push();
    fill(255);
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