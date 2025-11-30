/**
 * 3D Particle System with Hand Gesture Control
 * Using Three.js and MediaPipe Hands
 */

import * as THREE from 'three';

// Global variables
let scene, camera, renderer;
let particles, particleGeometry, particleMaterial;
let originalPositions = [];
let targetPositions = [];
let currentModel = 'heart';
let particleColor = new THREE.Color(0xff6b9d);
let expansionFactor = 0;
let targetExpansion = 0;
let particleCount = 2000;
let particleSize = 3;

// Hand tracking variables
let hands;
let leftHandOpen = false;
let rightHandOpen = false;
let handsInitialized = false;
let mediaLoaded = false;

// DOM elements
let container, webcam, uiPanel;
let modelSelect, colorPicker, particleCountSlider, particleSizeSlider;
let leftHandStatus, rightHandStatus, expansionStatus;
let fullscreenBtn, toggleUiBtn, enableCameraBtn;
let cameraPrompt, loadingDiv;

// Load MediaPipe libraries dynamically
async function loadMediaPipeLibraries() {
    return new Promise((resolve, reject) => {
        // Load hands.js
        const handsScript = document.createElement('script');
        handsScript.src = './node_modules/@mediapipe/hands/hands.js';
        handsScript.onload = () => {
            // Load camera_utils.js
            const cameraScript = document.createElement('script');
            cameraScript.src = './node_modules/@mediapipe/camera_utils/camera_utils.js';
            cameraScript.onload = () => {
                mediaLoaded = true;
                resolve();
            };
            cameraScript.onerror = reject;
            document.head.appendChild(cameraScript);
        };
        handsScript.onerror = reject;
        document.head.appendChild(handsScript);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Get DOM elements
    container = document.getElementById('container');
    webcam = document.getElementById('webcam');
    uiPanel = document.getElementById('ui-panel');
    modelSelect = document.getElementById('model-select');
    colorPicker = document.getElementById('color-picker');
    particleCountSlider = document.getElementById('particle-count');
    particleSizeSlider = document.getElementById('particle-size');
    leftHandStatus = document.getElementById('left-hand-status');
    rightHandStatus = document.getElementById('right-hand-status');
    expansionStatus = document.getElementById('expansion-status');
    fullscreenBtn = document.getElementById('fullscreen-btn');
    toggleUiBtn = document.getElementById('toggle-ui-btn');
    enableCameraBtn = document.getElementById('enable-camera-btn');
    cameraPrompt = document.getElementById('camera-prompt');
    loadingDiv = document.getElementById('loading');
    
    // Setup Three.js scene
    setupScene();
    
    // Create initial particle system
    createParticles();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load MediaPipe libraries
    try {
        await loadMediaPipeLibraries();
    } catch (error) {
        console.warn('MediaPipe libraries could not be loaded:', error);
    }
    
    // Start animation loop
    animate();
    
    // Hide loading after scene is ready
    setTimeout(() => {
        loadingDiv.classList.add('hidden');
    }, 1000);
}

function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createParticles() {
    // Remove existing particles
    if (particles) {
        scene.remove(particles);
        particleGeometry.dispose();
        particleMaterial.dispose();
    }
    
    // Create geometry
    particleGeometry = new THREE.BufferGeometry();
    
    // Generate positions based on current model
    const positions = generateModelPositions(currentModel, particleCount);
    originalPositions = [...positions];
    targetPositions = [...positions];
    
    particleGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    
    // Create material with circular sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    particleMaterial = new THREE.PointsMaterial({
        size: particleSize * 0.01,
        color: particleColor,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    // Create points
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
}

function generateModelPositions(model, count) {
    const positions = [];
    
    switch (model) {
        case 'heart':
            positions.push(...generateHeartPositions(count));
            break;
        case 'flower':
            positions.push(...generateFlowerPositions(count));
            break;
        case 'saturn':
            positions.push(...generateSaturnPositions(count));
            break;
        case 'buddha':
            positions.push(...generateBuddhaPositions(count));
            break;
        case 'firework':
            positions.push(...generateFireworkPositions(count));
            break;
        default:
            positions.push(...generateHeartPositions(count));
    }
    
    return positions;
}

// Heart shape using parametric equation
function generateHeartPositions(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * 2 - 1;
        
        // Heart parametric equations
        let x = 16 * Math.pow(Math.sin(t), 3);
        let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        let z = (Math.random() - 0.5) * 4;
        
        // Add some randomness for volume
        const noise = 0.2;
        x += (Math.random() - 0.5) * noise * 10;
        y += (Math.random() - 0.5) * noise * 10;
        z += (Math.random() - 0.5) * noise * 10;
        
        // Scale down
        x *= 0.08;
        y *= 0.08;
        z *= 0.08;
        
        positions.push(x, y, z);
    }
    return positions;
}

// Flower/Rose shape
function generateFlowerPositions(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        
        // Rose curve parameters
        const k = 5; // number of petals
        const r = Math.sin(k * phi) * (0.5 + Math.random() * 0.5);
        
        // Convert to 3D with some height variation
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(theta) * 0.3 * Math.random();
        
        positions.push(x * 2, y * 2, z * 2);
    }
    return positions;
}

// Saturn with rings
function generateSaturnPositions(count) {
    const positions = [];
    const planetCount = Math.floor(count * 0.4);
    const ringCount = count - planetCount;
    
    // Planet (sphere)
    for (let i = 0; i < planetCount; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const r = 0.6 + Math.random() * 0.1;
        
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta);
        
        positions.push(x, y * 0.9, z);
    }
    
    // Rings
    for (let i = 0; i < ringCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 1.0 + Math.random() * 0.8;
        const thickness = (Math.random() - 0.5) * 0.05;
        
        const x = r * Math.cos(angle);
        const y = thickness;
        const z = r * Math.sin(angle);
        
        positions.push(x, y, z);
    }
    return positions;
}

// Buddha silhouette (simplified seated meditation pose)
function generateBuddhaPositions(count) {
    const positions = [];
    
    for (let i = 0; i < count; i++) {
        let x, y, z;
        const section = Math.random();
        
        if (section < 0.3) {
            // Head (sphere)
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const r = 0.25 + Math.random() * 0.05;
            x = r * Math.sin(theta) * Math.cos(phi);
            y = 1.0 + r * Math.sin(theta) * Math.sin(phi);
            z = r * Math.cos(theta);
        } else if (section < 0.6) {
            // Body (ellipsoid)
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const rx = 0.4 + Math.random() * 0.1;
            const ry = 0.5 + Math.random() * 0.1;
            const rz = 0.3 + Math.random() * 0.05;
            x = rx * Math.sin(theta) * Math.cos(phi);
            y = 0.3 + ry * Math.sin(theta) * Math.sin(phi) * 0.5;
            z = rz * Math.cos(theta);
        } else if (section < 0.85) {
            // Crossed legs (torus-like shape at bottom)
            const angle = Math.random() * Math.PI * 2;
            const r = 0.5 + Math.random() * 0.3;
            x = r * Math.cos(angle);
            y = -0.3 + (Math.random() - 0.5) * 0.2;
            z = r * Math.sin(angle) * 0.6;
        } else {
            // Hands in lap
            const angle = Math.random() * Math.PI;
            const r = 0.2 + Math.random() * 0.1;
            x = (Math.random() - 0.5) * 0.4;
            y = 0.1 + Math.random() * 0.1;
            z = 0.3 + Math.random() * 0.1;
        }
        
        positions.push(x, y, z);
    }
    return positions;
}

// Firework explosion pattern
function generateFireworkPositions(count) {
    const positions = [];
    const bursts = 5;
    const particlesPerBurst = Math.floor(count / bursts);
    
    for (let b = 0; b < bursts; b++) {
        // Random center for each burst
        const cx = (Math.random() - 0.5) * 2;
        const cy = (Math.random() - 0.5) * 2;
        const cz = (Math.random() - 0.5) * 1;
        
        for (let i = 0; i < particlesPerBurst; i++) {
            // Spherical distribution with trailing effect
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const r = Math.random() * 0.8;
            
            const x = cx + r * Math.sin(theta) * Math.cos(phi);
            const y = cy + r * Math.sin(theta) * Math.sin(phi);
            const z = cz + r * Math.cos(theta);
            
            positions.push(x, y, z);
        }
    }
    
    // Fill remaining particles
    while (positions.length / 3 < count) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * 2;
        positions.push(
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(theta)
        );
    }
    
    return positions;
}

function updateParticlePositions() {
    if (!particles) return;
    
    const positions = particleGeometry.attributes.position.array;
    const count = positions.length / 3;
    
    // Smoothly interpolate expansion factor
    expansionFactor += (targetExpansion - expansionFactor) * 0.05;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Original position
        const ox = originalPositions[i3];
        const oy = originalPositions[i3 + 1];
        const oz = originalPositions[i3 + 2];
        
        // Calculate expanded position (radial expansion)
        const distance = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const expansionScale = 1 + expansionFactor * 3;
        
        // Add some noise for organic feel
        const noise = Math.sin(Date.now() * 0.001 + i * 0.1) * 0.02 * expansionFactor;
        
        positions[i3] = ox * expansionScale + noise;
        positions[i3 + 1] = oy * expansionScale + noise;
        positions[i3 + 2] = oz * expansionScale + noise;
    }
    
    particleGeometry.attributes.position.needsUpdate = true;
}

function setupEventListeners() {
    // Model selection
    modelSelect.addEventListener('change', (e) => {
        currentModel = e.target.value;
        createParticles();
    });
    
    // Color picker
    colorPicker.addEventListener('input', (e) => {
        particleColor.set(e.target.value);
        if (particleMaterial) {
            particleMaterial.color = particleColor;
        }
    });
    
    // Particle count slider
    particleCountSlider.addEventListener('input', (e) => {
        particleCount = parseInt(e.target.value);
        document.getElementById('particle-count-value').textContent = particleCount;
    });
    
    particleCountSlider.addEventListener('change', () => {
        createParticles();
    });
    
    // Particle size slider
    particleSizeSlider.addEventListener('input', (e) => {
        particleSize = parseFloat(e.target.value);
        document.getElementById('particle-size-value').textContent = particleSize;
        if (particleMaterial) {
            particleMaterial.size = particleSize * 0.01;
        }
    });
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Toggle UI button
    toggleUiBtn.addEventListener('click', () => {
        uiPanel.classList.toggle('hidden');
    });
    
    // Enable camera button
    enableCameraBtn.addEventListener('click', initCamera);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: 'user'
            }
        });
        
        webcam.srcObject = stream;
        await webcam.play();
        
        // Hide camera prompt
        cameraPrompt.classList.add('hidden');
        
        // Initialize MediaPipe Hands
        initHandTracking();
        
    } catch (error) {
        console.error('Camera access error:', error);
        alert('无法访问摄像头，请确保已授予权限');
    }
}

function initHandTracking() {
    // Check if Hands is available
    if (typeof Hands === 'undefined') {
        console.error('MediaPipe Hands not loaded');
        alert('手势检测库未能加载，请刷新页面重试');
        return;
    }
    
    hands = new Hands({
        locateFile: (file) => {
            return `./node_modules/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onHandResults);
    
    // Start camera processing
    // Check if Camera is available
    if (typeof Camera === 'undefined') {
        console.error('MediaPipe Camera Utils not loaded');
        return;
    }
    
    const cameraInstance = new Camera(webcam, {
        onFrame: async () => {
            if (hands) {
                await hands.send({ image: webcam });
            }
        },
        width: 640,
        height: 480
    });
    
    cameraInstance.start();
    handsInitialized = true;
}

function onHandResults(results) {
    // Reset hand states
    let leftOpen = false;
    let rightOpen = false;
    
    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i];
            const isOpen = isHandOpen(landmarks);
            
            // Note: MediaPipe mirrors the camera, so Left/Right are swapped
            if (handedness.label === 'Right') {
                leftOpen = isOpen;
            } else {
                rightOpen = isOpen;
            }
        }
    }
    
    leftHandOpen = leftOpen;
    rightHandOpen = rightOpen;
    
    // Update UI status
    updateHandStatus();
    
    // Calculate target expansion based on hand states
    if (leftHandOpen && rightHandOpen) {
        targetExpansion = 1.0; // Both hands open = full expansion
    } else if (leftHandOpen || rightHandOpen) {
        targetExpansion = 0.5; // One hand open = partial expansion
    } else {
        targetExpansion = 0; // Both hands closed = contracted
    }
}

function isHandOpen(landmarks) {
    // Check if fingers are extended
    // Landmark indices:
    // 0: wrist
    // 4: thumb tip, 3: thumb IP, 2: thumb MCP
    // 8: index tip, 6: index PIP, 5: index MCP
    // 12: middle tip, 10: middle PIP, 9: middle MCP
    // 16: ring tip, 14: ring PIP, 13: ring MCP
    // 20: pinky tip, 18: pinky PIP, 17: pinky MCP
    
    let extendedFingers = 0;
    
    // Check thumb (compare x coordinates for horizontal extension)
    const thumbExtended = landmarks[4].x < landmarks[3].x;
    if (thumbExtended) extendedFingers++;
    
    // Check other fingers (compare y coordinates - lower y = higher position = extended)
    // Index finger
    if (landmarks[8].y < landmarks[6].y) extendedFingers++;
    // Middle finger
    if (landmarks[12].y < landmarks[10].y) extendedFingers++;
    // Ring finger
    if (landmarks[16].y < landmarks[14].y) extendedFingers++;
    // Pinky finger
    if (landmarks[20].y < landmarks[18].y) extendedFingers++;
    
    // Hand is considered open if at least 3 fingers are extended
    return extendedFingers >= 3;
}

function updateHandStatus() {
    leftHandStatus.textContent = leftHandOpen ? '张开' : (handsInitialized ? '握拳' : '未检测');
    leftHandStatus.className = 'status-value ' + (leftHandOpen ? 'open' : 'closed');
    
    rightHandStatus.textContent = rightHandOpen ? '张开' : (handsInitialized ? '握拳' : '未检测');
    rightHandStatus.className = 'status-value ' + (rightHandOpen ? 'open' : 'closed');
    
    expansionStatus.textContent = Math.round(expansionFactor * 100) + '%';
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate particles slowly
    if (particles) {
        particles.rotation.y += 0.002;
        particles.rotation.x += 0.001;
    }
    
    // Update particle positions based on expansion
    updateParticlePositions();
    
    // Update expansion status in UI
    expansionStatus.textContent = Math.round(expansionFactor * 100) + '%';
    
    // Render scene
    renderer.render(scene, camera);
}
