// ============================================================
// VARIABLES GLOBAL
// ============================================================
let loggedInStudent = null;
let selectedParkingType = null;
let premiumSlots = [];
let currentBookingForPayment = null;
let isBookingInProgress = false;

// ============================================================
// STORAGE KEYS - FIXED WITH CHECK
// ============================================================
function getPremiumBookingKey() {
    if(!loggedInStudent) return null;
    return 'myPremiumBooking_' + loggedInStudent.id;
}

function getBasicBookingKey() {
    if(!loggedInStudent) return null;
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
    var choiceSection = document.getElementById('choiceSection');
    var premiumSection = document.getElementById('premiumSection');
    var basicSection = document.getElementById('basicSection');
    if(choiceSection) choiceSection.style.display = 'block';
    if(premiumSection) premiumSection.style.display = 'none';
    if(basicSection) basicSection.style.display = 'none';
    selectedParkingType = null;
}

function selectParkingType(type) {
    selectedParkingType = type;
    var choiceSection = document.getElementById('choiceSection');
    if(choiceSection) choiceSection.style.display = 'none';
    
    if(type === 'premium') {
        var premiumSection = document.getElementById('premiumSection');
        if(premiumSection) premiumSection.style.display = 'block';
        loadPremiumSlots();
        attachPremiumSlotEvents();
    } else if(type === 'basic') {
        var basicSection = document.getElementById('basicSection');
        if(basicSection) basicSection.style.display = 'block';
        updateBasicAvailableCount();
    }
}

function scrollToBooking() {
    var choiceSection = document.getElementById('choiceSection');
    if(choiceSection) {
        choiceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
var studentNameEl = document.getElementById('studentName');
if(studentNameEl) studentNameEl.innerText = loggedInStudent.name || 'Student';

var welcomePlateEl = document.getElementById('welcomePlate');
if(welcomePlateEl) welcomePlateEl.innerText = loggedInStudent.plate_no || 'Not set';

// Update Sidebar
var sidebarNameEl = document.getElementById('sidebarName');
if(sidebarNameEl) sidebarNameEl.innerText = loggedInStudent.name || 'Student';

var sidebarMatricEl = document.getElementById('sidebarMatric');
if(sidebarMatricEl) sidebarMatricEl.innerText = loggedInStudent.matric_no || '-';

var sidebarProgramEl = document.getElementById('sidebarProgram');
if(sidebarProgramEl) sidebarProgramEl.innerText = loggedInStudent.program || loggedInStudent.course || '-';

var sidebarSemesterEl = document.getElementById('sidebarSemester');
if(sidebarSemesterEl) sidebarSemesterEl.innerText = loggedInStudent.semester || '-';

var sidebarPhoneEl = document.getElementById('sidebarPhone');
if(sidebarPhoneEl) sidebarPhoneEl.innerText = loggedInStudent.phone_no || '-';

var sidebarICEl = document.getElementById('sidebarIC');
if(sidebarICEl) sidebarICEl.innerText = loggedInStudent.ic_no || '-';

var sidebarPlateEl = document.getElementById('sidebarPlate');
if(sidebarPlateEl) sidebarPlateEl.innerText = loggedInStudent.plate_no || 'Not set';

var sidebarVehicleTypeEl = document.getElementById('sidebarVehicleType');
if(sidebarVehicleTypeEl) sidebarVehicleTypeEl.innerText = loggedInStudent.vehicle_type || '-';

var sidebarVehicleColorEl = document.getElementById('sidebarVehicleColor');
if(sidebarVehicleColorEl) sidebarVehicleColorEl.innerText = loggedInStudent.vehicle_color || '-';

// Avatar initial
if(loggedInStudent.name) {
    var avatarEl = document.getElementById('avatarInitial');
    if(avatarEl) {
        var initial = loggedInStudent.name.charAt(0).toUpperCase();
        avatarEl.innerHTML = initial;
    }
}

// ============================================================
// UPDATE AVAILABLE COUNT
// ============================================================
function updateTotalAvailableCount() {
    var premiumSlotsData = JSON.parse(localStorage.getItem('premiumSlots')) || [];
    var premiumOccupied = premiumSlotsData.filter(function(s) { 
        return s.status === 'pending' || s.status === 'occupied' || s.status === 'paid';
    }).length;
    
    var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    var basicOccupied = allBasicBookings.filter(function(b) { 
        return b.status === 'pending' || b.status === 'approved' || b.status === 'paid';
    }).length;
    
    var basicAvailEl = document.getElementById('basicAvailableCount');
    if(basicAvailEl) {
        basicAvailEl.innerText = Math.max(0, 55 - basicOccupied);
    }
}

// ============================================================
// GET ACTIVE BOOKING
// ============================================================
function getActiveBooking() {
    if(!loggedInStudent) return null;
    
    var premiumKey = getPremiumBookingKey();
    if(!premiumKey) return null;
    var myPremiumBooking = JSON.parse(localStorage.getItem(premiumKey));
    
    var basicKey = getBasicBookingKey();
    if(!basicKey) return null;
    var myBasicBooking = JSON.parse(localStorage.getItem(basicKey));
    
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
    
    var booking = getActiveBooking();
    var sidebarStatusElement = document.getElementById('sidebarBookingStatus');
    var bookingDetailsContainer = document.getElementById('bookingDetailsContainer');
    var noBookingState = document.getElementById('noBookingState');
    var payContainer = document.getElementById('payButtonContainer');
    
    if(booking) {
        if(bookingDetailsContainer) bookingDetailsContainer.style.display = 'block';
        if(noBookingState) noBookingState.style.display = 'none';
        
        var bookedSlotEl = document.getElementById('bookedSlot');
        if(bookedSlotEl) {
            if(booking.type === 'premium') {
                bookedSlotEl.innerHTML = 'Premium Lot ' + booking.slotId;
            } else {
                bookedSlotEl.innerHTML = 'Basic Parking (Random Lot)';
            }
        }
        
        var bookingTimeEl = document.getElementById('bookingTime');
        if(bookingTimeEl) {
            bookingTimeEl.innerText = new Date(booking.bookingTime).toLocaleString();
        }
        
        var statusDetail = document.getElementById('bookingStatusDetail');
        if(payContainer) payContainer.innerHTML = '';
        
        if(booking.status === 'pending') {
            if(statusDetail) {
                statusDetail.innerHTML = '🟡 Pending (Waiting for Staff Approval)';
                statusDetail.style.color = '#f9a825';
            }
            if(sidebarStatusElement) {
                sidebarStatusElement.innerHTML = '🟡 Pending';
                sidebarStatusElement.style.color = '#f9a825';
            }
        } 
        else if(booking.status === 'approved') {
            if(statusDetail) {
                statusDetail.innerHTML = '🟢 Approved - Payment Required';
                statusDetail.style.color = '#00e676';
            }
            if(sidebarStatusElement) {
                sidebarStatusElement.innerHTML = '🟢 Approved';
                sidebarStatusElement.style.color = '#00e676';
            }
            
            var amount = booking.type === 'premium' ? '50.00' : '30.00';
            if(payContainer) {
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
        } 
        else if(booking.status === 'paid') {
            if(statusDetail) {
                statusDetail.innerHTML = '✅ Paid - Booking Confirmed';
                statusDetail.style.color = '#00e676';
            }
            if(sidebarStatusElement) {
                sidebarStatusElement.innerHTML = '✅ Confirmed';
                sidebarStatusElement.style.color = '#00e676';
            }
        }
        
    } else {
        if(bookingDetailsContainer) bookingDetailsContainer.style.display = 'none';
        if(noBookingState) noBookingState.style.display = 'block';
        if(sidebarStatusElement) {
            sidebarStatusElement.innerHTML = 'No Booking';
            sidebarStatusElement.style.color = '#6a6a8a';
        }
    }
}

// ============================================================
// PAYMENT FUNCTIONS
// ============================================================
function openPaymentForBooking() {
    var booking = getActiveBooking();
    
    if(booking && booking.status === 'approved') {
        currentBookingForPayment = booking;
        var amount = booking.type === 'premium' ? 'RM 50.00' : 'RM 30.00';
        var paymentAmountEl = document.getElementById('paymentAmount');
        if(paymentAmountEl) paymentAmountEl.innerHTML = amount;
        
        var paymentPlateEl = document.getElementById('paymentPlate');
        if(paymentPlateEl) paymentPlateEl.innerHTML = loggedInStudent.plate_no || 'Not set';
        
        var paymentModal = document.getElementById('paymentModal');
        if(paymentModal) paymentModal.classList.add('active');
    } else {
        alert('No approved booking found for payment.');
    }
}

function closePaymentModal() {
    var paymentModal = document.getElementById('paymentModal');
    if(paymentModal) paymentModal.classList.remove('active');
    currentBookingForPayment = null;
}

function processDummyPayment() {
    var booking = getActiveBooking();
    
    if(!booking || booking.status !== 'approved') {
        alert('No approved booking found for payment.');
        closePaymentModal();
        return;
    }
    
    if(booking.type === 'premium') {
        var premiumSlotsData = JSON.parse(localStorage.getItem('premiumSlots')) || [];
        var slot = premiumSlotsData.find(function(s) { return s.id == booking.slotId; });
        if(slot) {
            slot.status = 'paid';
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlotsData));
        }
        
        booking.status = 'paid';
        var premiumKey = getPremiumBookingKey();
        if(premiumKey) localStorage.setItem(premiumKey, JSON.stringify(booking));
        
    } else if(booking.type === 'basic') {
        var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
        var index = allBasicBookings.findIndex(function(b) { return b.studentId === booking.studentId && b.status !== 'cancelled'; });
        if(index !== -1) {
            allBasicBookings[index].status = 'paid';
            localStorage.setItem('allBasicBookings', JSON.stringify(allBasicBookings));
        }
        
        booking.status = 'paid';
        var basicKey = getBasicBookingKey();
        if(basicKey) localStorage.setItem(basicKey, JSON.stringify(booking));
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
    var saved = localStorage.getItem('premiumSlots');
    
    if(saved && saved !== 'null' && saved !== 'undefined') {
        try {
            premiumSlots = JSON.parse(saved);
            for(var i = 1; i <= 15; i++) {
                if(!premiumSlots.find(function(s) { return s.id === i; })) {
                    premiumSlots.push({ id: i, status: 'available' });
                }
            }
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
        } catch(e) {
            premiumSlots = [];
            for(var i2 = 1; i2 <= 15; i2++) {
                premiumSlots.push({ id: i2, status: 'available' });
            }
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
        }
    } else {
        premiumSlots = [];
        for(var i3 = 1; i3 <= 15; i3++) {
            premiumSlots.push({ id: i3, status: 'available' });
        }
        localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
    }
}

function loadPremiumSlots() {
    var saved = localStorage.getItem('premiumSlots');
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
    
    for(var i = 1; i <= 15; i++) {
        if(!premiumSlots.find(function(s) { return s.id === i; })) {
            premiumSlots.push({ id: i, status: 'available' });
        }
    }
    localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
    
    var premiumKey = getPremiumBookingKey();
    if(!premiumKey) return;
    var myPremiumBooking = JSON.parse(localStorage.getItem(premiumKey));
    
    for(var i4 = 1; i4 <= 15; i4++) {
        var slotElement = document.getElementById('spot' + i4);
        if(slotElement) {
            var slot = premiumSlots.find(function(s) { return s.id === i4; });
            if(slot) {
                slotElement.classList.remove('available', 'pending', 'occupied');
                
                var isMyBooking = myPremiumBooking && myPremiumBooking.slotId == i4 && 
                                 (myPremiumBooking.status === 'pending' || myPremiumBooking.status === 'approved');
                
                var isPaidOrOccupied = slot.status === 'paid' || slot.status === 'occupied';
                var isPendingByOthers = (slot.status === 'pending' || slot.status === 'approved') && !isMyBooking;
                
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
                
                slotElement.innerText = i4;
            }
        }
    }
    updateTotalAvailableCount();
}

function attachPremiumSlotEvents() {
    for(var i = 1; i <= 15; i++) {
        var slotElement = document.getElementById('spot' + i);
        if(slotElement) {
            var newSlot = slotElement.cloneNode(true);
            slotElement.parentNode.replaceChild(newSlot, slotElement);
            newSlot.id = 'spot' + i;
            
            var slot = premiumSlots.find(function(s) { return s.id === i; });
            
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
    
    var existingBooking = getActiveBooking();
    if(existingBooking) {
        alert('You already have a booking! Please wait for approval or cancellation.');
        return;
    }
    
    var currentSlots = JSON.parse(localStorage.getItem('premiumSlots'));
    if(!currentSlots) {
        alert('Parking data not found. Please refresh the page.');
        return;
    }
    
    var slot = currentSlots.find(function(s) { return s.id === spotId; });
    if(!slot) {
        alert('Lot ' + spotId + ' not found. Please refresh and try again.');
        return;
    }
    
    if(slot.status !== 'available') {
        alert('This lot is not available for booking.\n\nStatus: ' + slot.status.toUpperCase());
        return;
    }
    
    var plateNo = loggedInStudent.plate_no || 'Not set';
    
    var confirm = window.confirm('Book Premium Lot ' + spotId + ' for RM50/semester?\n\nVehicle Plate: ' + plateNo);
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
        var currentSlots = JSON.parse(localStorage.getItem('premiumSlots'));
        
        if(!currentSlots || currentSlots.length === 0) {
            alert('Parking data not found. Please refresh the page.');
            isBookingInProgress = false;
            return;
        }
        
        var slot = currentSlots.find(function(s) { return s.id === spotId; });
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
        
        var existingBooking = getActiveBooking();
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
        
        var booking = {
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
        
        var premiumKey = getPremiumBookingKey();
        if(premiumKey) localStorage.setItem(premiumKey, JSON.stringify(booking));
        
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
    var existingBooking = getActiveBooking();
    
    if(existingBooking) {
        alert('You already have a booking! Please wait for approval or cancellation.');
        return;
    }
    
    var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    var activeBasic = allBasicBookings.filter(function(b) { return b.status === 'pending' || b.status === 'approved' || b.status === 'paid'; }).length;
    var available = 55 - activeBasic;
    
    if(available <= 0) {
        alert('No basic parking lots available! Please try premium parking.');
        return;
    }
    
    var plateNo = loggedInStudent.plate_no || 'Not set';
    
    var confirm = window.confirm('Book Basic Parking for RM30/semester?\n(First come, first serve basis)\n\nVehicle Plate: ' + plateNo);
    if(confirm) {
        var booking = {
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
        
        var basicKey = getBasicBookingKey();
        if(basicKey) localStorage.setItem(basicKey, JSON.stringify(booking));
        
        updateBasicAvailableCount();
        refreshBookingDisplay();
        
        alert('✅ Basic Parking booked for RM30/semester!\n\nStatus: PENDING - Waiting for staff approval.');
    }
}

function updateBasicAvailableCount() {
    var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    var activeBasic = allBasicBookings.filter(function(b) { return b.status === 'pending' || b.status === 'approved' || b.status === 'paid'; }).length;
    var available = 55 - activeBasic;
    
    var basicAvailEl = document.getElementById('basicAvailableCount');
    if(basicAvailEl) basicAvailEl.innerText = available >= 0 ? available : 0;
    updateTotalAvailableCount();
    
    var btn = document.querySelector('.btn-book-basic');
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
    
    var premiumKey = getPremiumBookingKey();
    var basicKey = getBasicBookingKey();
    if(!premiumKey || !basicKey) return;
    
    var myPremium = JSON.parse(localStorage.getItem(premiumKey));
    var myBasic = JSON.parse(localStorage.getItem(basicKey));
    
    var isFresh = sessionStorage.getItem('freshLogin') !== 'false';
    
    if(isFresh) {
        if(myPremium && myPremium.status !== 'paid') {
            var allPremium = JSON.parse(localStorage.getItem('premiumSlots')) || [];
            allPremium = allPremium.map(function(slot) {
                if(slot.id === myPremium.slotId && slot.bookedBy === loggedInStudent.id) {
                    return { id: slot.id, status: 'available' };
                }
                return slot;
            });
            localStorage.setItem('premiumSlots', JSON.stringify(allPremium));
            localStorage.removeItem(premiumKey);
        }
        
        if(myBasic && myBasic.status !== 'paid') {
            var allBasic = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
            allBasic = allBasic.filter(function(b) { return b.studentId !== loggedInStudent.id; });
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
