// ============================================================
// VARIABLES GLOBAL
// ============================================================
let loggedInStudent = null;
let selectedParkingType = null;
let premiumSlots = [];
let currentBookingForPayment = null;
let isBookingInProgress = false;

// ============================================================
// STORAGE KEYS
// ============================================================
function getPremiumBookingKey() {
    return 'myPremiumBooking_' + loggedInStudent.id;
}

function getBasicBookingKey() {
    return 'myBasicBooking_' + loggedInStudent.id;
}

// ============================================================
// MENU FUNCTIONS
// ============================================================
function toggleMenu(){
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

function logout() {
    sessionStorage.removeItem('loggedInStudent');
    sessionStorage.removeItem('freshLogin');
    window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/index.html';
}

function backToChoice() {
    document.getElementById('choiceSection').style.display = 'block';
    document.getElementById('premiumSection').style.display = 'none';
    document.getElementById('basicSection').style.display = 'none';
    selectedParkingType = null;
}

function selectParkingType(type) {
    selectedParkingType = type;
    document.getElementById('choiceSection').style.display = 'none';
    
    if(type === 'premium') {
        document.getElementById('premiumSection').style.display = 'block';
        loadPremiumSlots();
        attachPremiumSlotEvents();
    } else if(type === 'basic') {
        document.getElementById('basicSection').style.display = 'block';
        updateBasicAvailableCount();
    }
}

function scrollToBooking() {
    document.getElementById('choiceSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// LOAD STUDENT DATA - FIXED
// ============================================================
// Try to get from sessionStorage first
loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));

// ===== FIX: If sessionStorage is empty, try to get from localStorage =====
if(!loggedInStudent) {
    console.log("⚠️ SessionStorage empty, trying to get from localStorage...");
    var students = JSON.parse(localStorage.getItem('students')) || [];
    
    // Get the most recently registered student
    if(students.length > 0) {
        var lastStudent = students[students.length - 1];
        loggedInStudent = {
            id: lastStudent.id,
            name: lastStudent.name,
            email: lastStudent.email,
            matric_no: lastStudent.matric_no,
            ic_no: lastStudent.ic_no,
            phone_no: lastStudent.phone_no,
            plate_no: lastStudent.plate_no || '',
            vehicle_type: lastStudent.vehicle_type || '',
            vehicle_color: lastStudent.vehicle_color || '',
            semester: lastStudent.semester,
            program: lastStudent.program || lastStudent.course || ''
        };
        // Save back to sessionStorage
        sessionStorage.setItem('loggedInStudent', JSON.stringify(loggedInStudent));
        sessionStorage.setItem('freshLogin', 'true');
        console.log("✅ Retrieved student from localStorage:", loggedInStudent.name);
    }
}

// If still no student, redirect to login - FIXED URL
if(!loggedInStudent) {
    console.error("❌ No student found! Redirecting to login...");
    window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/student/student_login.html';
    // Stop execution
    throw new Error('No student logged in');
}

console.log("✅ Logged in as:", loggedInStudent.name);
console.log("📧 Email:", loggedInStudent.email);
console.log("📋 Full data:", loggedInStudent);

// Update Welcome Card
document.getElementById('studentName').innerText = loggedInStudent.name || 'Student';
document.getElementById('welcomePlate').innerText = loggedInStudent.plate_no || 'Not set';

// Update Sidebar
document.getElementById('sidebarName').innerText = loggedInStudent.name || 'Student';
document.getElementById('sidebarMatric').innerText = loggedInStudent.matric_no || '-';
document.getElementById('sidebarProgram').innerText = loggedInStudent.program || loggedInStudent.course || '-';
document.getElementById('sidebarSemester').innerText = loggedInStudent.semester || '-';
document.getElementById('sidebarPhone').innerText = loggedInStudent.phone_no || '-';
document.getElementById('sidebarIC').innerText = loggedInStudent.ic_no || '-';
document.getElementById('sidebarPlate').innerText = loggedInStudent.plate_no || 'Not set';
document.getElementById('sidebarVehicleType').innerText = loggedInStudent.vehicle_type || '-';
document.getElementById('sidebarVehicleColor').innerText = loggedInStudent.vehicle_color || '-';

// Avatar initial
if(loggedInStudent.name) {
    let initial = loggedInStudent.name.charAt(0).toUpperCase();
    document.getElementById('avatarInitial').innerHTML = initial;
}

// ============================================================
// UPDATE AVAILABLE COUNT
// ============================================================
function updateTotalAvailableCount() {
    let premiumSlotsData = JSON.parse(localStorage.getItem('premiumSlots')) || [];
    let premiumOccupied = premiumSlotsData.filter(s => 
        s.status === 'pending' || s.status === 'occupied' || s.status === 'paid'
    ).length;
    
    let allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    let basicOccupied = allBasicBookings.filter(b => 
        b.status === 'pending' || b.status === 'approved' || b.status === 'paid'
    ).length;
    
    let basicAvailEl = document.getElementById('basicAvailableCount');
    if(basicAvailEl) {
        basicAvailEl.innerText = Math.max(0, 55 - basicOccupied);
    }
}

// ============================================================
// GET ACTIVE BOOKING
// ============================================================
function getActiveBooking() {
    if(!loggedInStudent) return null;
    
    let premiumKey = getPremiumBookingKey();
    let myPremiumBooking = JSON.parse(localStorage.getItem(premiumKey));
    
    let basicKey = getBasicBookingKey();
    let myBasicBooking = JSON.parse(localStorage.getItem(basicKey));
    
    if(myPremiumBooking && myPremiumBooking.status !== 'cancelled') {
        return myPremiumBooking;
    }
    if(myBasicBooking && myBasicBooking.status !== 'cancelled') {
        return myBasicBooking;
    }
    return null;
}

// ============================================================
// REFRESH BOOKING DISPLAY
// ============================================================
function refreshBookingDisplay() {
    if(!loggedInStudent) return;
    
    let booking = getActiveBooking();
    let sidebarStatusElement = document.getElementById('sidebarBookingStatus');
    let bookingDetailsContainer = document.getElementById('bookingDetailsContainer');
    let noBookingState = document.getElementById('noBookingState');
    let payContainer = document.getElementById('payButtonContainer');
    
    if(booking) {
        bookingDetailsContainer.style.display = 'block';
        noBookingState.style.display = 'none';
        
        if(booking.type === 'premium') {
            document.getElementById('bookedSlot').innerHTML = 'Premium Lot ' + booking.slotId;
        } else {
            document.getElementById('bookedSlot').innerHTML = 'Basic Parking (Random Lot)';
        }
        
        document.getElementById('bookingTime').innerText = new Date(booking.bookingTime).toLocaleString();
        
        let statusDetail = document.getElementById('bookingStatusDetail');
        payContainer.innerHTML = '';
        
        if(booking.status === 'pending') {
            statusDetail.innerHTML = '🟡 Pending (Waiting for Staff Approval)';
            statusDetail.style.color = '#f9a825';
            sidebarStatusElement.innerHTML = '🟡 Pending';
            sidebarStatusElement.style.color = '#f9a825';
        } 
        else if(booking.status === 'approved') {
            statusDetail.innerHTML = '🟢 Approved - Payment Required';
            statusDetail.style.color = '#00e676';
            sidebarStatusElement.innerHTML = '🟢 Approved';
            sidebarStatusElement.style.color = '#00e676';
            
            let amount = booking.type === 'premium' ? '50.00' : '30.00';
            payContainer.innerHTML = `
                <button onclick="openPaymentForBooking()" 
                    style="background: linear-gradient(135deg, #00e676, #00f5ff); 
                           color: #1a1a2e; 
                           padding: 14px 20px; 
                           border: none; 
                           border-radius: 10px; 
                           cursor: pointer; 
                           font-weight: bold; 
                           width: 100%; 
                           margin-top: 10px;
                           font-size: 16px;
                           transition: 0.3s;
                           box-shadow: 0 0 15px rgba(0, 230, 118, 0.3);">
                    💳 PAY NOW (RM ${amount})
                </button>
            `;
        } 
        else if(booking.status === 'paid') {
            statusDetail.innerHTML = '✅ Paid - Booking Confirmed';
            statusDetail.style.color = '#00e676';
            sidebarStatusElement.innerHTML = '✅ Confirmed';
            sidebarStatusElement.style.color = '#00e676';
        }
        
    } else {
        bookingDetailsContainer.style.display = 'none';
        noBookingState.style.display = 'block';
        sidebarStatusElement.innerHTML = 'No Booking';
        sidebarStatusElement.style.color = '#6a6a8a';
    }
}

// ============================================================
// PAYMENT FUNCTIONS
// ============================================================
function openPaymentForBooking() {
    let booking = getActiveBooking();
    
    if(booking && booking.status === 'approved') {
        currentBookingForPayment = booking;
        let amount = booking.type === 'premium' ? 'RM 50.00' : 'RM 30.00';
        document.getElementById('paymentAmount').innerHTML = amount;
        document.getElementById('paymentPlate').innerHTML = loggedInStudent.plate_no || 'Not set';
        document.getElementById('paymentModal').classList.add('active');
    } else {
        alert('No approved booking found for payment.');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    currentBookingForPayment = null;
}

function processDummyPayment() {
    let booking = getActiveBooking();
    
    if(!booking || booking.status !== 'approved') {
        alert('No approved booking found for payment.');
        closePaymentModal();
        return;
    }
    
    if(booking.type === 'premium') {
        let premiumSlotsData = JSON.parse(localStorage.getItem('premiumSlots')) || [];
        let slot = premiumSlotsData.find(s => s.id == booking.slotId);
        if(slot) {
            slot.status = 'paid';
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlotsData));
        }
        
        booking.status = 'paid';
        let premiumKey = getPremiumBookingKey();
        localStorage.setItem(premiumKey, JSON.stringify(booking));
        
    } else if(booking.type === 'basic') {
        let allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
        let index = allBasicBookings.findIndex(b => b.studentId === booking.studentId && b.status !== 'cancelled');
        if(index !== -1) {
            allBasicBookings[index].status = 'paid';
            localStorage.setItem('allBasicBookings', JSON.stringify(allBasicBookings));
        }
        
        booking.status = 'paid';
        let basicKey = getBasicBookingKey();
        localStorage.setItem(basicKey, JSON.stringify(booking));
    }
    
    closePaymentModal();
    
    loadPremiumSlots();
    attachPremiumSlotEvents();
    refreshBookingDisplay();
    updateBasicAvailableCount();
    
    alert('✅ Payment successful!\n\nYour parking lot has been confirmed for the semester.');
}

// ============================================================
// PREMIUM PARKING FUNCTIONS
// ============================================================
function initPremiumSlots() {
    let saved = localStorage.getItem('premiumSlots');
    
    if(saved && saved !== 'null' && saved !== 'undefined') {
        try {
            premiumSlots = JSON.parse(saved);
            for(let i = 1; i <= 15; i++) {
                if(!premiumSlots.find(s => s.id === i)) {
                    premiumSlots.push({ id: i, status: 'available' });
                }
            }
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
        } catch(e) {
            premiumSlots = [];
            for(let i = 1; i <= 15; i++) {
                premiumSlots.push({ id: i, status: 'available' });
            }
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
        }
    } else {
        premiumSlots = [];
        for(let i = 1; i <= 15; i++) {
            premiumSlots.push({ id: i, status: 'available' });
        }
        localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
    }
}

function loadPremiumSlots() {
    let saved = localStorage.getItem('premiumSlots');
    if(!saved || saved === 'null' || saved === 'undefined') {
        initPremiumSlots();
        saved = localStorage.getItem('premiumSlots');
    }
    
    try {
        premiumSlots = JSON.parse(saved);
    } catch(e) {
        initPremiumSlots();
        premiumSlots = JSON.parse(localStorage.getItem('premiumSlots'));
    }
    
    for(let i = 1; i <= 15; i++) {
        if(!premiumSlots.find(s => s.id === i)) {
            premiumSlots.push({ id: i, status: 'available' });
        }
    }
    localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
    
    let premiumKey = getPremiumBookingKey();
    let myPremiumBooking = JSON.parse(localStorage.getItem(premiumKey));
    
    for(let i = 1; i <= 15; i++) {
        let slotElement = document.getElementById('spot' + i);
        if(slotElement) {
            let slot = premiumSlots.find(s => s.id === i);
            if(slot) {
                slotElement.classList.remove('available', 'pending', 'occupied');
                
                let isMyBooking = myPremiumBooking && myPremiumBooking.slotId == i && 
                                 (myPremiumBooking.status === 'pending' || myPremiumBooking.status === 'approved');
                
                let isPaidOrOccupied = slot.status === 'paid' || slot.status === 'occupied';
                let isPendingByOthers = (slot.status === 'pending' || slot.status === 'approved') && !isMyBooking;
                
                if(isMyBooking) {
                    slotElement.classList.add('pending');
                    slotElement.style.cursor = 'not-allowed';
                }
                else if(isPaidOrOccupied) {
                    slotElement.classList.add('occupied');
                    slotElement.style.cursor = 'not-allowed';
                }
                else if(isPendingByOthers) {
                    slotElement.classList.add('pending');
                    slotElement.style.cursor = 'not-allowed';
                }
                else {
                    slotElement.classList.add('available');
                    slotElement.style.cursor = 'pointer';
                }
                
                slotElement.innerText = i;
            }
        }
    }
    updateTotalAvailableCount();
}

function attachPremiumSlotEvents() {
    for(let i = 1; i <= 15; i++) {
        let slotElement = document.getElementById('spot' + i);
        if(slotElement) {
            let newSlot = slotElement.cloneNode(true);
            slotElement.parentNode.replaceChild(newSlot, slotElement);
            newSlot.id = 'spot' + i;
            
            let slot = premiumSlots.find(s => s.id === i);
            
            if(slot && slot.status === 'available') {
                newSlot.onclick = (function(spotId) {
                    return function() { bookPremiumSlot(spotId); };
                })(i);
            } else {
                newSlot.onclick = null;
            }
            document.getElementById('spot' + i).innerText = i;
        }
    }
}

function bookPremiumSlot(spotId) {
    if(isBookingInProgress) {
        return;
    }
    
    let existingBooking = getActiveBooking();
    if(existingBooking) {
        alert('You already have a booking! Please wait for approval or cancellation.');
        return;
    }
    
    let currentSlots = JSON.parse(localStorage.getItem('premiumSlots'));
    if(!currentSlots) {
        alert('Parking data not found. Please refresh the page.');
        return;
    }
    
    let slot = currentSlots.find(s => s.id === spotId);
    if(!slot) {
        alert('Lot ' + spotId + ' not found. Please refresh and try again.');
        return;
    }
    
    if(slot.status !== 'available') {
        alert('This lot is not available for booking.\n\nStatus: ' + slot.status.toUpperCase());
        return;
    }
    
    let plateNo = loggedInStudent.plate_no || 'Not set';
    
    let confirm = window.confirm('Book Premium Lot ' + spotId + ' for RM50/semester?\n\nVehicle Plate: ' + plateNo);
    if(confirm) {
        proceedWithBooking(spotId);
    }
}

function proceedWithBooking(spotId) {
    if(isBookingInProgress) {
        return;
    }
    isBookingInProgress = true;
    
    try {
        let currentSlots = JSON.parse(localStorage.getItem('premiumSlots'));
        
        if(!currentSlots || currentSlots.length === 0) {
            alert('Parking data not found. Please refresh the page.');
            isBookingInProgress = false;
            return;
        }
        
        let slot = currentSlots.find(s => s.id === spotId);
        if(!slot) {
            alert('Lot ' + spotId + ' not found. Please refresh and try again.');
            isBookingInProgress = false;
            return;
        }
        
        if(slot.status !== 'available') {
            alert('This lot is not available for booking.\n\nStatus: ' + slot.status.toUpperCase());
            isBookingInProgress = false;
            return;
        }
        
        let existingBooking = getActiveBooking();
        if(existingBooking) {
            alert('You already have a booking! Please wait for approval or cancellation.');
            isBookingInProgress = false;
            return;
        }
        
        slot.status = 'pending';
        slot.bookedBy = loggedInStudent.id;
        slot.bookedByName = loggedInStudent.name;
        slot.studentIC = loggedInStudent.ic_no;
        slot.studentMatric = loggedInStudent.matric_no;
        slot.studentProgram = loggedInStudent.program || loggedInStudent.course;
        slot.studentSemester = loggedInStudent.semester;
        slot.studentPhone = loggedInStudent.phone_no;
        slot.studentEmail = loggedInStudent.email;
        slot.plateNo = loggedInStudent.plate_no || 'Not set';
        slot.vehicleType = loggedInStudent.vehicle_type || '';
        slot.vehicleColor = loggedInStudent.vehicle_color || '';
        slot.bookingTime = new Date().toISOString();
        
        localStorage.setItem('premiumSlots', JSON.stringify(currentSlots));
        
        let booking = {
            studentId: loggedInStudent.id,
            studentName: loggedInStudent.name,
            studentIC: loggedInStudent.ic_no,
            studentMatric: loggedInStudent.matric_no,
            studentProgram: loggedInStudent.program || loggedInStudent.course,
            studentSemester: loggedInStudent.semester,
            studentPhone: loggedInStudent.phone_no,
            studentEmail: loggedInStudent.email,
            plateNo: loggedInStudent.plate_no || 'Not set',
            vehicleType: loggedInStudent.vehicle_type || '',
            vehicleColor: loggedInStudent.vehicle_color || '',
            slotId: spotId,
            type: 'premium',
            status: 'pending',
            bookingTime: new Date().toISOString()
        };
        
        let premiumKey = getPremiumBookingKey();
        localStorage.setItem(premiumKey, JSON.stringify(booking));
        
        premiumSlots = currentSlots;
        
        loadPremiumSlots();
        attachPremiumSlotEvents();
        refreshBookingDisplay();
        
        alert('✅ Premium Lot ' + spotId + ' booked for RM50/semester!\n\nStatus: PENDING (Yellow)\nWaiting for staff approval.');
    } catch(e) {
        alert('An error occurred: ' + e.message);
    }
    
    isBookingInProgress = false;
}

// ============================================================
// BASIC PARKING FUNCTIONS
// ============================================================
function bookBasicParking() {
    let existingBooking = getActiveBooking();
    
    if(existingBooking) {
        alert('You already have a booking! Please wait for approval or cancellation.');
        return;
    }
    
    let allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    let activeBasic = allBasicBookings.filter(b => b.status === 'pending' || b.status === 'approved' || b.status === 'paid').length;
    let available = 55 - activeBasic;
    
    if(available <= 0) {
        alert('No basic parking lots available! Please try premium parking.');
        return;
    }
    
    let plateNo = loggedInStudent.plate_no || 'Not set';
    
    let confirm = window.confirm('Book Basic Parking for RM30/semester?\n(First come, first serve basis)\n\nVehicle Plate: ' + plateNo);
    if(confirm) {
        let booking = {
            studentId: loggedInStudent.id,
            studentName: loggedInStudent.name,
            studentIC: loggedInStudent.ic_no,
            studentMatric: loggedInStudent.matric_no,
            studentProgram: loggedInStudent.program || loggedInStudent.course,
            studentSemester: loggedInStudent.semester,
            studentPhone: loggedInStudent.phone_no,
            studentEmail: loggedInStudent.email,
            plateNo: loggedInStudent.plate_no || 'Not set',
            vehicleType: loggedInStudent.vehicle_type || '',
            vehicleColor: loggedInStudent.vehicle_color || '',
            type: 'basic',
            status: 'pending',
            bookingTime: new Date().toISOString()
        };
        
        allBasicBookings.push(booking);
        localStorage.setItem('allBasicBookings', JSON.stringify(allBasicBookings));
        
        let basicKey = getBasicBookingKey();
        localStorage.setItem(basicKey, JSON.stringify(booking));
        
        updateBasicAvailableCount();
        refreshBookingDisplay();
        
        alert('✅ Basic Parking booked for RM30/semester!\n\nStatus: PENDING - Waiting for staff approval.');
    }
}

function updateBasicAvailableCount() {
    let allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    let activeBasic = allBasicBookings.filter(b => b.status === 'pending' || b.status === 'approved' || b.status === 'paid').length;
    let available = 55 - activeBasic;
    document.getElementById('basicAvailableCount').innerText = available >= 0 ? available : 0;
    updateTotalAvailableCount();
    
    let btn = document.querySelector('.btn-book-basic');
    if(btn) {
        if(available <= 0) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.innerText = 'Full - No Basic Lots Available';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerText = 'Book Basic Parking →';
        }
    }
}

// ============================================================
// FORCE REFRESH
// ============================================================
function forceRefreshDashboard() {
    refreshBookingDisplay();
    loadPremiumSlots();
    updateTotalAvailableCount();
    updateBasicAvailableCount();
}

// ============================================================
// INITIALIZATION
// ============================================================
(function init() {
    if(!loggedInStudent) return;
    
    let premiumKey = getPremiumBookingKey();
    let basicKey = getBasicBookingKey();
    
    let myPremium = JSON.parse(localStorage.getItem(premiumKey));
    let myBasic = JSON.parse(localStorage.getItem(basicKey));
    
    let isFresh = sessionStorage.getItem('freshLogin') !== 'false';
    
    if(isFresh) {
        if(myPremium && myPremium.status !== 'paid') {
            let allPremium = JSON.parse(localStorage.getItem('premiumSlots')) || [];
            allPremium = allPremium.map(slot => {
                if(slot.id === myPremium.slotId && slot.bookedBy === loggedInStudent.id) {
                    return { id: slot.id, status: 'available' };
                }
                return slot;
            });
            localStorage.setItem('premiumSlots', JSON.stringify(allPremium));
            localStorage.removeItem(premiumKey);
        }
        
        if(myBasic && myBasic.status !== 'paid') {
            let allBasic = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
            allBasic = allBasic.filter(b => b.studentId !== loggedInStudent.id);
            localStorage.setItem('allBasicBookings', JSON.stringify(allBasic));
            localStorage.removeItem(basicKey);
        }
        
        sessionStorage.setItem('freshLogin', 'false');
    }
    
    initPremiumSlots();
    refreshBookingDisplay();
    loadPremiumSlots();
    updateBasicAvailableCount();
    updateTotalAvailableCount();
})();

// ============================================================
// AUTO REFRESH
// ============================================================
setInterval(function() {
    refreshBookingDisplay();
    loadPremiumSlots();
    updateTotalAvailableCount();
}, 3000);

setInterval(function() {
    forceRefreshDashboard();
}, 10000);

console.log('✅ Student Dashboard initialized successfully!');
console.log('👤 Student:', loggedInStudent ? loggedInStudent.name : 'Not logged in');
console.log('📧 Email:', loggedInStudent ? loggedInStudent.email : 'No email');
