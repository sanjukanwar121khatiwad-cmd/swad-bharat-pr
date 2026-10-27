// STRICT ADMIN CREDENTIALS
const AUTHORIZED_OWNER_EMAIL = "praveen121khatiward@gmail.com";
const AUTHORIZED_OWNER_PASSCODES = ["9257813359", "925781"];

let FOOD_ITEMS = [
    { id: 1, name: "Special Rajasthani Dal Baati Churma", category: "Rajasthani", price: 280, diet: "veg", rating: 4.9, time: "25 min", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60", desc: "Authentic Panchmel dal served with pure ghee baati." },
    { id: 2, name: "Butter Chicken Special", category: "North Indian", price: 340, diet: "nonveg", rating: 4.8, time: "30 min", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60", desc: "Tender chicken cooked in rich butter gravy." },
    { id: 3, name: "Samosa & Kachori Street Combo", category: "Fast Food", price: 90, diet: "veg", rating: 4.8, time: "10 min", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60", desc: "Crispy street samosas with sweet and spicy chutneys." }
];

for (let i = 4; i <= 104; i++) {
    const cats = ["North Indian", "South Indian", "Rajasthani", "Chinese", "Fast Food", "Desserts", "Beverages"];
    const cat = cats[i % cats.length];
    FOOD_ITEMS.push({
        id: i,
        name: `${cat} Special Item #${i}`,
        category: cat,
        price: 60 + ((i * 13) % 920),
        diet: i % 3 === 0 ? "nonveg" : "veg",
        rating: "4.8",
        time: "20 min",
        image: FOOD_ITEMS[(i % 3)].image,
        desc: `Freshly prepared ${cat} delicacy.`
    });
}

const CATEGORIES = ["All", "Rajasthani", "North Indian", "South Indian", "Chinese", "Fast Food", "Desserts", "Beverages"];
let cart = [], activeCategory = "All", activePriceRange = "all", searchQuery = "", currentUser = null, capturedGPS = null;
let activeOrderTimer = null, orderStartTime = null;

window.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderFoodGrid();
    init3DEarthTracker();
    openLoginModal();
});

function toggleOwnerField() {
    const role = document.getElementById('userRoleSelect').value;
    document.getElementById('passcodeContainer').classList.toggle('hidden', role !== 'owner');
}

function handleUserLogin(e) {
    e.preventDefault();
    const role = document.getElementById('userRoleSelect').value;
    const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
    
    if (role === 'owner') {
        const passcode = document.getElementById('loginPasscode').value.trim();
        const isEmailValid = (emailInput === AUTHORIZED_OWNER_EMAIL.toLowerCase());
        const isPasscodeValid = AUTHORIZED_OWNER_PASSCODES.includes(passcode);

        if (!isEmailValid || !isPasscodeValid) {
            alert("🔒 Access Denied!\nOnly authorized admin email (praveen121khatiward@gmail.com) & mobile number (9257813359) can access Admin Panel.");
            return;
        }

        currentUser = { role: 'owner', email: emailInput, name: 'Praveen (Admin)' };
        alert("Welcome Praveen! Admin Authority Activated.");
    } else {
        currentUser = { role: 'customer', email: emailInput, name: emailInput.split('@')[0] };
        alert(`Welcome ${currentUser.name}! You can browse and order food.`);
    }

    updateUserRoleUI();
    closeLoginModal();
}

function updateUserRoleUI() {
    if (!currentUser) return;
    document.getElementById('userAuthBtn').innerText = currentUser.name;
    document.getElementById('ownerPanelBtn').classList.toggle('hidden', currentUser.role !== 'owner');
    renderFoodGrid();
}

function openLoginModal() { document.getElementById('loginModal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }

function detectGPSLocation() {
    const btnText = document.getElementById('gpsBtnText');
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    btnText.innerText = "Capturing GPS...";
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude.toFixed(4), lng = pos.coords.longitude.toFixed(4);
        capturedGPS = { lat, lng, name: `Lat: ${lat}°, Lng: ${lng}°` };
        btnText.innerText = `GPS Captured (${lat}, ${lng})`;
        document.getElementById('gpsDisplayStatus').innerText = `${capturedGPS.name} (Live GPS)`;
        alert(`GPS Captured Successfully!\nLat: ${lat}, Lng: ${lng}`);
    }, () => {
        btnText.innerText = "GPS Failed. Using Default.";
        alert("GPS capture failed.");
    });
}

function changeDeliveryLocation() {
    const newLoc = prompt("Enter new delivery city/location name:", capturedGPS ? capturedGPS.name : "Jaipur, Rajasthan");
    if (newLoc) {
        capturedGPS = { lat: (26 + Math.random()).toFixed(4), lng: (75 + Math.random()).toFixed(4), name: newLoc };
        document.getElementById('gpsDisplayStatus').innerText = `${capturedGPS.name}`;
        alert(`Location Updated to: ${newLoc}`);
    }
}

function handleAddNewFood(e) {
    e.preventDefault();
    if (currentUser?.role !== 'owner') { alert("Only Admin (Praveen) can add items!"); return; }
    FOOD_ITEMS.unshift({
        id: Date.now(),
        name: document.getElementById('newFoodName').value,
        category: document.getElementById('newFoodCategory').value,
        price: parseInt(document.getElementById('newFoodPrice').value),
        diet: "veg", rating: "5.0", time: "20 min",
        image: document.getElementById('newFoodImage').value,
        desc: "Newly added specialty by Admin."
    });
    alert("Item added successfully and is now visible to all customers!");
    renderFoodGrid();
    switchTab('menu');
}

function editPriceByAdmin(id) {
    if (currentUser?.role !== 'owner') return;
    const item = FOOD_ITEMS.find(f => f.id === id);
    if (!item) return;
    const newPrice = prompt(`[Admin Control] Enter new price for "${item.name}":`, item.price);
    if (newPrice && !isNaN(newPrice)) {
        item.price = parseInt(newPrice);
        renderFoodGrid();
        alert("Price updated successfully!");
    }
}

function setPriceRange(range) { activePriceRange = range; renderFoodGrid(); }

function renderCategories() {
    document.getElementById('categoriesContainer').innerHTML = CATEGORIES.map(cat => `
        <button onclick="filterCategory('${cat}')" class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 border'}">${cat}</button>
    `).join('');
}

function renderFoodGrid() {
    const grid = document.getElementById('foodGrid');
    const isAdmin = currentUser && currentUser.role === 'owner';

    let items = FOOD_ITEMS.filter(item => {
        let matchPrice = true;
        if (activePriceRange === '0-100') matchPrice = item.price <= 100;
        else if (activePriceRange === '100-200') matchPrice = item.price >= 100 && item.price <= 200;
        else if (activePriceRange === '200-300') matchPrice = item.price >= 200 && item.price <= 300;
        else if (activePriceRange === '300-500') matchPrice = item.price >= 300 && item.price <= 500;
        else if (activePriceRange === '500-1000') matchPrice = item.price >= 500 && item.price <= 1000;
        return (activeCategory === "All" || item.category === activeCategory) && matchPrice;
    });

    grid.innerHTML = items.map(item => {
        const cartItem = cart.find(c => c.id === item.id), qty = cartItem ? cartItem.qty : 0;
        return `
        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col relative">
            ${isAdmin ? `<button onclick="editPriceByAdmin(${item.id})" class="absolute top-2 right-2 bg-amber-400 text-slate-950 px-2 py-1 text-[10px] font-extrabold rounded-lg shadow z-10">✏️ Edit Price</button>` : ''}
            <div class="relative h-40 bg-slate-100"><img src="${item.image}" class="w-full h-full object-cover"></div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    <h4 class="font-extrabold text-slate-900 text-sm">${item.name}</h4>
                    <p class="text-xs text-slate-500">${item.desc}</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t">
                    <div class="text-base font-black text-slate-900">₹${item.price}</div>
                    ${qty === 0 ? `<button onclick="addToCart(${item.id})" class="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-xl">+ ADD</button>` :
                    `<div class="flex items-center space-x-2 bg-orange-50 p-1 rounded-xl border border-orange-200">
                        <button onclick="updateQty(${item.id}, -1)" class="w-6 h-6 bg-orange-500 text-white font-bold rounded-lg">-</button>
                        <span class="text-xs font-black w-4 text-center">${qty}</span>
                        <button onclick="updateQty(${item.id}, 1)" class="w-6 h-6 bg-orange-500 text-white font-bold rounded-lg">+</button>
                    </div>`}
                </div>
            </div>
        </div>`;
    }).join('');
}

function addToCart(id) {
    const item = FOOD_ITEMS.find(f => f.id === id);
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty++; else cart.push({ ...item, qty: 1 });
    updateCartUI();
    renderFoodGrid();
}

function updateQty(id, delta) {
    const idx = cart.findIndex(c => c.id === id);
    if (idx !== -1) { cart[idx].qty += delta; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
    updateCartUI();
    renderFoodGrid();
}

function updateCartUI() {
    document.getElementById('cartBadge').innerText = cart.reduce((s, i) => s + i.qty, 0);
    const sub = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    document.getElementById('cartTotal').innerText = `₹${sub}`;
    document.getElementById('cartItemsList').innerHTML = cart.length === 0 ? `<div class="text-center text-xs text-slate-400">Your basket is empty</div>` :
        cart.map(i => `<div class="flex justify-between items-center p-2 bg-slate-50 border rounded-xl"><span class="text-xs font-bold">${i.name} (x${i.qty})</span><span class="text-xs text-orange-600 font-bold">₹${i.price * i.qty}</span></div>`).join('');
}

function toggleCartDrawer() {
    const d = document.getElementById('cartDrawer'), p = document.getElementById('cartDrawerPanel');
    d.classList.toggle('invisible');
    p.classList.toggle('translate-x-full');
}

function handleCheckout() {
    if (cart.length === 0) { alert("Cart is empty!"); return; }
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custMobile').value.trim();
    const addr = document.getElementById('custAddress').value.trim();
    if (!name || !phone || !addr) { alert("Please enter Name, Mobile & Address!"); return; }

    const mode = document.getElementById('paymentModeSelect').value;
    toggleCartDrawer();

    if (mode === 'cod') {
        finalizeOrderAndShow3DTracker('Cash on Delivery (COD)');
    } else {
        const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
        document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9257813359@ptyes&pn=Sanju&am=${total}&cu=INR`)}`;
        document.getElementById('paymentModal').classList.remove('hidden');
    }
}

function closePaymentModal() { document.getElementById('paymentModal').classList.add('hidden'); }

function finalizeOrderAndShow3DTracker(paymentType = 'Paytm UPI Online') {
    closePaymentModal();
    cart = [];
    updateCartUI();
    renderFoodGrid();
    switchTab('tracker');
    
    // Start order timer for late delivery & firecracker sound alert
    orderStartTime = Date.now();
    if (activeOrderTimer) clearInterval(activeOrderTimer);

    activeOrderTimer = setInterval(() => {
        const elapsedMinutes = (Date.now() - orderStartTime) / 60000;
        if (elapsedMinutes >= 10) {
            playFirecrackerSound();
            alert("🚨 LATE DELIVERY ALERT!\nThis order took 10+ mins extra. It is now 100% FREE for the customer!");
            clearInterval(activeOrderTimer);
        }
    }, 5000);

    alert(`Order Placed Successfully via ${paymentType}!\nOpening Live 3D Earth Delivery Radar...`);
}

// Play Firecracker sound effect using Web Audio API
function playFirecrackerSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 2);
        
        noise.connect(filter);
        filter.connect(audioCtx.destination);
        noise.start();
    } catch(e) {
        console.log("Audio not supported directly");
    }
}

// Food Return & Refund Request with Customer UPI QR
function requestFoodReturn() {
    const reason = prompt("Enter reason for return (e.g. food quality issue, bad taste):");
    if (!reason) return;
    const custUPI = prompt("Please enter your UPI ID or paste your QR code link for instant refund:");
    if (custUPI) {
        alert(`✅ Return Request Submitted Successfully!\nYour refund will be sent to UPI: ${custUPI} by Admin (Praveen).\nSupport Contact: +91 9257813359`);
    }
}

function switchTab(tab) {
    ['menu', 'tracker', 'owner'].forEach(t => document.getElementById(`view-${t}`).classList.add('hidden'));
    document.getElementById(`view-${tab}`).classList.remove('hidden');
    document.getElementById('categoryFilterBar').classList.toggle('hidden', tab !== 'menu');
}

function filterCategory(cat) { activeCategory = cat; renderCategories(); renderFoodGrid(); }
function handleSearch() { searchQuery = document.getElementById('searchInput').value; renderFoodGrid(); }

// 3D EARTH GLOBE & SCOOTER CANVAS ANIMATION
function init3DEarthTracker() {
    const canvas = document.getElementById('trackerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function resize() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function animate() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const globeRadius = Math.min(canvas.width, canvas.height) * 0.35;

        // Space Background
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3D Earth Globe Sphere
        const earthGradient = ctx.createRadialGradient(
            centerX - globeRadius * 0.3, centerY - globeRadius * 0.3, globeRadius * 0.1,
            centerX, centerY, globeRadius
        );
        earthGradient.addColorStop(0, '#38bdf8');
        earthGradient.addColorStop(0.5, '#0284c7');
        earthGradient.addColorStop(1, '#0f172a');

        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Longitude/Latitude Grids
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        
        for (let i = -60; i <= 60; i += 30) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + (i * globeRadius / 90), globeRadius * Math.cos((i * Math.PI) / 180), globeRadius * 0.2, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        const rotAngle = (frame * 0.01) % (Math.PI * 2);
        for (let i = 0; i < 4; i++) {
            const angle = rotAngle + (i * Math.PI / 2);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, Math.abs(Math.cos(angle)) * globeRadius, globeRadius, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Restaurant Pin
        const restX = centerX - globeRadius * 0.4;
        const restY = centerY + globeRadius * 0.1;

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(restX, restY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("📍 Swad Bharat", restX - 30, restY - 10);

        // Customer Destination Pin
        const custX = centerX + globeRadius * 0.4;
        const custY = centerY - globeRadius * 0.2;

        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(custX, custY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("🏠 Customer", custX + 8, custY + 4);

        // Arc Route Line
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(restX, restY);
        ctx.quadraticCurveTo(centerX, centerY - globeRadius * 0.6, custX, custY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Moving Scooter Rider on Globe
        const progress = (frame % 300) / 300;
        const scooterX = (1 - progress) * (1 - progress) * restX + 2 * (1 - progress) * progress * centerX + progress * progress * custX;
        const scooterY = (1 - progress) * (1 - progress) * restY + 2 * (1 - progress) * progress * (centerY - globeRadius * 0.6) + progress * progress * custY;

        ctx.fillStyle = "#FF5200";
        ctx.beginPath();
        ctx.arc(scooterX, scooterY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("🛵", scooterX - 8, scooterY + 4);

        requestAnimationFrame(animate);
    }
    animate();
}