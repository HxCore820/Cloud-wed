// ============================================
// CLOUDVPS - DASHBOARD JAVASCRIPT
// Firebase Integration + VPS Logic + Points System
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDEMOKEY-REPLACE-WITH-YOUR-KEY",
    authDomain: "cloudvps-demo.firebaseapp.com",
    projectId: "cloudvps-demo",
    storageBucket: "cloudvps-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let userData = null;
let vpsTimeInterval = null;

// ============================================
// AUTH CHECK
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        initializeDashboard();
    } else {
        window.location.href = 'index.html';
    }
});

// ============================================
// LOAD USER DATA
// ============================================
async function loadUserData() {
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            userData = userSnap.data();
            updateUI();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
    // Update user profile
    document.getElementById('userName').textContent = userData.displayName || 'User';
    if (currentUser.photoURL) {
        document.getElementById('userAvatar').src = currentUser.photoURL;
    }
    
    // Update points
    document.getElementById('pointsBalance').textContent = userData.points.toLocaleString();
    document.getElementById('modalPointsBalance').textContent = userData.points.toLocaleString();
    
    // Update VPS time
    updateTimeDisplay();
    
    // Update stats
    updateCPUUsage();
    updateRAMUsage();
    updateStorageUsage();
}

// ============================================
// TIME DISPLAY
// ============================================
function updateTimeDisplay() {
    const timeRemaining = userData.vpsTime || 0;
    
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timeRemaining').textContent = timeString;
    
    // Start countdown if VPS is active
    if (timeRemaining > 0 && !vpsTimeInterval) {
        startVPSCountdown();
    }
}

function startVPSCountdown() {
    vpsTimeInterval = setInterval(async () => {
        if (userData.vpsTime > 0) {
            userData.vpsTime -= 1;
            updateTimeDisplay();
            
            // Update database every 60 seconds
            if (userData.vpsTime % 60 === 0) {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userRef, {
                        vpsTime: userData.vpsTime
                    });
                } catch (error) {
                    console.error('Error updating VPS time:', error);
                }
            }
        } else {
            clearInterval(vpsTimeInterval);
            vpsTimeInterval = null;
            alert('Your VPS time has expired! Please extend or create a new VPS.');
        }
    }, 1000);
}

// ============================================
// STATS SIMULATION
// ============================================
function updateCPUUsage() {
    const cpuValue = Math.floor(Math.random() * 30) + 20; // 20-50%
    document.getElementById('cpuValue').textContent = cpuValue;
    
    // Update circular progress
    const circle = document.getElementById('cpuProgress');
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (cpuValue / 100 * circumference);
    circle.style.strokeDashoffset = offset;
}

function updateRAMUsage() {
    const ramUsed = (Math.random() * 3 + 1.5).toFixed(1); // 1.5-4.5 GB
    document.getElementById('ramUsed').textContent = ramUsed;
    
    const percentage = (parseFloat(ramUsed) / 8) * 100;
    document.getElementById('ramProgress').style.width = percentage + '%';
}

function updateStorageUsage() {
    const storageUsed = Math.floor(Math.random() * 20) + 25; // 25-45 GB
    document.getElementById('storageUsed').textContent = storageUsed;
    
    const percentage = (storageUsed / 50) * 100;
    document.getElementById('storageProgress').style.width = percentage + '%';
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
function initializeDashboard() {
    // Update stats every 5 seconds
    setInterval(() => {
        updateCPUUsage();
        updateRAMUsage();
        updateStorageUsage();
    }, 5000);
    
    // Initialize event listeners
    initializeEventListeners();
}

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.dataset.modal);
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Earn more button
    document.querySelector('.btn-earn-more').addEventListener('click', () => {
        openModal('adModal');
        startAdTimer();
    });
    
    // Extend button (top)
    document.getElementById('btnExtend').addEventListener('click', () => {
        extendVPSTime();
    });
    
    // Create VPS button
    document.getElementById('btnCreateVPS').addEventListener('click', () => {
        openModal('createVPSModal');
    });
    
    // Stop VPS button
    document.getElementById('btnStopVPS').addEventListener('click', () => {
        stopVPS();
    });
    
    // Extend time button (bottom)
    document.getElementById('btnExtendTime').addEventListener('click', () => {
        extendVPSTime();
    });
    
    // Duration buttons
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('vpsCost').textContent = btn.dataset.cost;
        });
    });
    
    // Confirm create VPS
    document.getElementById('confirmCreateVPS').addEventListener('click', () => {
        createVPS();
    });
    
    // Complete ad button
    document.getElementById('completeAdBtn').addEventListener('click', () => {
        completeAd();
    });
    
    // Copy buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const textToCopy = btn.dataset.copyText || document.getElementById(btn.dataset.copy).textContent;
            navigator.clipboard.writeText(textToCopy);
            
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        });
    });
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============================================
// AD SYSTEM
// ============================================
function startAdTimer() {
    let timeLeft = 15;
    const timerElement = document.getElementById('adTimer');
    const completeBtn = document.getElementById('completeAdBtn');
    
    completeBtn.disabled = true;
    
    const adInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(adInterval);
            completeBtn.disabled = false;
            timerElement.parentElement.textContent = 'Ad completed! Click to claim points.';
        }
    }, 1000);
}

async function completeAd() {
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Add 5 points
        await updateDoc(userRef, {
            points: increment(5),
            dailyAds: increment(1)
        });
        
        userData.points += 5;
        updateUI();
        
        closeModal('adModal');
        showNotification('✅ +5 points earned!', 'success');
        
    } catch (error) {
        console.error('Error completing ad:', error);
        showNotification('❌ Error claiming points', 'error');
    }
}

// ============================================
// VPS FUNCTIONS
// ============================================
async function createVPS() {
    const osVersion = document.getElementById('osVersion').value;
    const language = document.getElementById('language').value;
    const activeBtn = document.querySelector('.duration-btn.active');
    const cost = parseInt(activeBtn.dataset.cost);
    const hours = parseInt(activeBtn.dataset.hours);
    
    if (userData.points < cost) {
        showNotification('❌ Not enough points!', 'error');
        return;
    }
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Deduct points and add time
        await updateDoc(userRef, {
            points: increment(-cost),
            vpsTime: increment(hours * 3600)
        });
        
        userData.points -= cost;
        userData.vpsTime += hours * 3600;
        
        updateUI();
        closeModal('createVPSModal');
        
        // Simulate VPS creation (in reality, this would trigger GitHub Actions)
        showNotification('🚀 Creating VPS...', 'info');
        
        setTimeout(() => {
            // Generate fake IP addresses
            const rdpIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:3389`;
            const webIP = rdpIP.replace(':3389', ':8006');
            
            document.getElementById('rdpIP').textContent = rdpIP;
            document.getElementById('webURL').textContent = `http://${webIP}`;
            
            openModal('vpsInfoModal');
            showNotification('✅ VPS created successfully!', 'success');
        }, 3000);
        
    } catch (error) {
        console.error('Error creating VPS:', error);
        showNotification('❌ Error creating VPS', 'error');
    }
}

async function stopVPS() {
    if (userData.vpsTime <= 0) {
        showNotification('⚠️ No active VPS to stop', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to stop your VPS? Remaining time will be lost.')) {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            
            await updateDoc(userRef, {
                vpsTime: 0
            });
            
            userData.vpsTime = 0;
            updateUI();
            
            if (vpsTimeInterval) {
                clearInterval(vpsTimeInterval);
                vpsTimeInterval = null;
            }
            
            showNotification('🛑 VPS stopped', 'info');
            
        } catch (error) {
            console.error('Error stopping VPS:', error);
            showNotification('❌ Error stopping VPS', 'error');
        }
    }
}

async function extendVPSTime() {
    const cost = 300; // 6 hours
    const hours = 6;
    
    if (userData.points < cost) {
        showNotification('❌ Not enough points! Need 300 points.', 'error');
        return;
    }
    
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        await updateDoc(userRef, {
            points: increment(-cost),
            vpsTime: increment(hours * 3600)
        });
        
        userData.points -= cost;
        userData.vpsTime += hours * 3600;
        
        updateUI();
        
        if (!vpsTimeInterval && userData.vpsTime > 0) {
            startVPSCountdown();
        }
        
        showNotification('✅ +6 hours added to VPS!', 'success');
        
    } catch (error) {
        console.error('Error extending VPS:', error);
        showNotification('❌ Error extending VPS', 'error');
    }
}

// ============================================
// NOTIFICATIONS
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : type === 'warning' ? 'var(--orange)' : 'var(--primary-blue)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// SVG GRADIENT FOR CPU PROGRESS
// ============================================
const svg = document.querySelector('.circular-progress svg');
const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
gradient.setAttribute('id', 'cpuGradient');
gradient.innerHTML = `
    <stop offset="0%" style="stop-color:#4f9eff;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
`;
defs.appendChild(gradient);
svg.insertBefore(defs, svg.firstChild);

console.log('Dashboard initialized successfully!');
