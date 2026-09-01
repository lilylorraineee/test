// ============================================================
// VARIABLES
// ============================================================
var loggedInStudent = null;
var selectedParkingType = null;
var premiumSlots = [];
var isBookingInProgress = false;

// ============================================================
// STORAGE KEYS
// ============================================================
function getPremiumBookingKey() {
    if (!loggedInStudent) return null;
    return 'myPremiumBooking_' + loggedInStudent.id;
}

function getBasicBookingKey() {
    if (!loggedInStudent) return null;
    return 'myBasicBooking_' + loggedInStudent.id;
}

// ============================================================
// MENU
// ============================================================
function toggleMenu() {
    var menu = document.getElementById('menu');
    var overlay = document.getElementById('overlay');
    if (menu) menu.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function logout() {
    sessionStorage.removeItem('loggedInStudent');
    sessionStorage.removeItem('freshLogin');
    window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/index.html';
}

function backToChoice() {
    var choice = document.getElementById('choiceSection');
    var premium = document.getElementById('premiumSection');
    var basic = document.getElementById('basicSection');
    if (choice) choice.style.display = 'block';
    if (premium) premium.style.display = 'none';
    if (basic) basic.style.display = 'none';
    selectedParkingType = null;
}

function selectParkingType(type) {
    selectedParkingType = type;
    var choice = document.getElementById('choiceSection');
    if (choice) choice.style.display = 'none';
    
    if (type === 'premium') {
        var premium = document.getElementById('premiumSection');
        if (premium) premium.style.display = 'block';
        loadPremiumSlots();
        attachPremiumSlotEvents();
    } else if (type === 'basic') {
        var basic = document.getElementById('basicSection');
        if (basic) basic.style.display = 'block';
        updateBasicAvailableCount();
    }
}

function scrollToBooking() {
    var choice = document.getElementById('choiceSection');
    if (choice) choice.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// LOAD STUDENT - PASTI JALAN
// ============================================================
(function loadStudent() {
    // Try sessionStorage first
    var stored = sessionStorage.getItem('loggedInStudent');
    if (stored) {
        try {
            loggedInStudent = JSON.parse(stored);
            console.log('✅ Loaded from sessionStorage:', loggedInStudent.name);
        } catch (e) {
            loggedInStudent = null;
        }
    }
    
    // If empty, try localStorage
    if (!loggedInStudent) {
        var students = JSON.parse(localStorage.getItem('students')) || [];
        if (students.length > 0) {
            var last = students[students.length - 1];
            loggedInStudent = {
                id: last.id,
                name: last.name || 'Student',
                email: last.email || '',
                matric_no: last.matric_no || '',
                ic_no: last.ic_no || '',
                phone_no: last.phone_no || '',
                plate_no: last.plate_no || '',
                vehicle_type: last.vehicle_type || '',
                vehicle_color: last.vehicle_color || '',
                semester: last.semester || '',
                program: last.program || last.course || ''
            };
            sessionStorage.setItem('loggedInStudent', JSON.stringify(loggedInStudent));
            sessionStorage.setItem('freshLogin', 'true');
            console.log('✅ Loaded from localStorage:', loggedInStudent.name);
        }
    }
    
    // If still no student, redirect
    if (!loggedInStudent || !loggedInStudent.id) {
        alert('Sila login dahulu.');
        window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/student/student_login.html';
        return;
    }
    
    // ===== UPDATE UI =====
    try {
        var nameEl = document.getElementById('studentName');
        if (nameEl) nameEl.innerText = loggedInStudent.name || 'Student';
        
        var plateEl = document.getElementById('welcomePlate');
        if (plateEl) plateEl.innerText = loggedInStudent.plate_no || 'Not set';
        
        var sName = document.getElementById('sidebarName');
        if (sName) sName.innerText = loggedInStudent.name || 'Student';
        
        var sMatric = document.getElementById('sidebarMatric');
        if (sMatric) sMatric.innerText = loggedInStudent.matric_no || '-';
        
        var sProgram = document.getElementById('sidebarProgram');
        if (sProgram) sProgram.innerText = loggedInStudent.program || loggedInStudent.course || '-';
        
        var sSemester = document.getElementById('sidebarSemester');
        if (sSemester) sSemester.innerText = loggedInStudent.semester || '-';
        
        var sPhone = document.getElementById('sidebarPhone');
        if (sPhone) sPhone.innerText = loggedInStudent.phone_no || '-';
        
        var sIC = document.getElementById('sidebarIC');
        if (sIC) sIC.innerText = loggedInStudent.ic_no || '-';
        
        var sPlate = document.getElementById('sidebarPlate');
        if (sPlate) sPlate.innerText = loggedInStudent.plate_no || 'Not set';
        
        var sVType = document.getElementById('sidebarVehicleType');
        if (sVType) sVType.innerText = loggedInStudent.vehicle_type || '-';
        
        var sVColor = document.getElementById('sidebarVehicleColor');
        if (sVColor) sVColor.innerText = loggedInStudent.vehicle_color || '-';
        
        var avatar = document.getElementById('avatarInitial');
        if (avatar && loggedInStudent.name) {
            avatar.innerHTML = loggedInStudent.name.charAt(0).toUpperCase();
        }
    } catch (e) {
        console.log('Error updating UI:', e);
    }
    
    console.log('✅ Student ready:', loggedInStudent.name);
    console.log('📧 Email:', loggedInStudent.email);
})();

// ============================================================
// GET ACTIVE BOOKING
// ============================================================
function getActiveBooking() {
    if (!loggedInStudent) return null;
    
    var premiumKey = getPremiumBookingKey();
    if (!premiumKey) return null;
    var myPremium = JSON.parse(localStorage.getItem(premiumKey));
    
    var basicKey = getBasicBookingKey();
    if (!basicKey) return null;
    var myBasic = JSON.parse(localStorage.getItem(basicKey));
    
    if (myPremium && myPremium.status !== 'cancelled') return myPremium;
    if (myBasic && myBasic.status !== 'cancelled') return myBasic;
    return null;
}

// ============================================================
// REFRESH BOOKING DISPLAY
// ============================================================
function refreshBookingDisplay() {
    if (!loggedInStudent) return;
    
    var booking = getActiveBooking();
    var statusEl = document.getElementById('sidebarBookingStatus');
    var detailsContainer = document.getElementById('bookingDetailsContainer');
    var noBooking = document.getElementById('noBookingState');
    var payContainer = document.getElementById('payButtonContainer');
    
    if (booking) {
        if (detailsContainer) detailsContainer.style.display = 'block';
        if (noBooking) noBooking.style.display = 'none';
        
        var slotEl = document.getElementById('bookedSlot');
        if (slotEl) {
            slotEl.innerHTML = booking.type === 'premium' ? 'Premium Lot ' + booking.slotId : 'Basic Parking (Random Lot)';
        }
        
        var timeEl = document.getElementById('bookingTime');
        if (timeEl) {
            timeEl.innerText = new Date(booking.bookingTime).toLocaleString();
        }
        
        var statusDetail = document.getElementById('bookingStatusDetail');
        if (payContainer) payContainer.innerHTML = '';
        
        if (booking.status === 'pending') {
            if (statusDetail) {
                statusDetail.innerHTML = '🟡 Pending (Waiting for Staff Approval)';
                statusDetail.style.color = '#f9a825';
            }
            if (statusEl) {
                statusEl.innerHTML = '🟡 Pending';
                statusEl.style.color = '#f9a825';
            }
        } else if (booking.status === 'approved') {
            if (statusDetail) {
                statusDetail.innerHTML = '🟢 Approved - Payment Required';
                statusDetail.style.color = '#00e676';
            }
            if (statusEl) {
                statusEl.innerHTML = '🟢 Approved';
                statusEl.style.color = '#00e676';
            }
            var amount = booking.type === 'premium' ? '50.00' : '30.00';
            if (payContainer) {
                payContainer.innerHTML = '<button onclick="openPaymentForBooking()" style="background:linear-gradient(135deg,#00e676,#00f5ff);color:#1a1a2e;padding:14px 20px;border:none;border-radius:10px;cursor:pointer;font-weight:bold;width:100%;margin-top:10px;font-size:16px;">💳 PAY NOW (RM ' + amount + ')</button>';
            }
        } else if (booking.status === 'paid') {
            if (statusDetail) {
                statusDetail.innerHTML = '✅ Paid - Booking Confirmed';
                statusDetail.style.color = '#00e676';
            }
            if (statusEl) {
                statusEl.innerHTML = '✅ Confirmed';
                statusEl.style.color = '#00e676';
            }
        }
    } else {
        if (detailsContainer) detailsContainer.style.display = 'none';
        if (noBooking) noBooking.style.display = 'block';
        if (statusEl) {
            statusEl.innerHTML = 'No Booking';
            statusEl.style.color = '#6a6a8a';
        }
    }
}

// ============================================================
// PAYMENT
// ============================================================
function openPaymentForBooking() {
    var booking = getActiveBooking();
    if (booking && booking.status === 'approved') {
        var amount = booking.type === 'premium' ? 'RM 50.00' : 'RM 30.00';
        var amountEl = document.getElementById('paymentAmount');
        var plateEl = document.getElementById('paymentPlate');
        var modal = document.getElementById('paymentModal');
        if (amountEl) amountEl.innerHTML = amount;
        if (plateEl) plateEl.innerHTML = loggedInStudent.plate_no || 'Not set';
        if (modal) modal.classList.add('active');
    } else {
        alert('No approved booking found for payment.');
    }
}

function closePaymentModal() {
    var modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('active');
}

function processDummyPayment() {
    var booking = getActiveBooking();
    if (!booking || booking.status !== 'approved') {
        alert('No approved booking found for payment.');
        closePaymentModal();
        return;
    }
    
    if (booking.type === 'premium') {
        var slots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
        var slot = slots.find(function(s) { return s.id == booking.slotId; });
        if (slot) {
            slot.status = 'paid';
            localStorage.setItem('premiumSlots', JSON.stringify(slots));
        }
        booking.status = 'paid';
        var key = getPremiumBookingKey();
        if (key) localStorage.setItem(key, JSON.stringify(booking));
    } else if (booking.type === 'basic') {
        var basics = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
        var idx = basics.findIndex(function(b) { return b.studentId === booking.studentId && b.status !== 'cancelled'; });
        if (idx !== -1) {
            basics[idx].status = 'paid';
            localStorage.setItem('allBasicBookings', JSON.stringify(basics));
        }
        booking.status = 'paid';
        var bKey = getBasicBookingKey();
        if (bKey) localStorage.setItem(bKey, JSON.stringify(booking));
    }
    
    closePaymentModal();
    loadPremiumSlots();
    attachPremiumSlotEvents();
    refreshBookingDisplay();
    updateBasicAvailableCount();
    alert('✅ Payment successful! Your parking lot has been confirmed.');
}

// ============================================================
// PREMIUM PARKING
// ============================================================
function initPremiumSlots() {
    var saved = localStorage.getItem('premiumSlots');
    if (saved && saved !== 'null') {
        try {
            premiumSlots = JSON.parse(saved);
            for (var i = 1; i <= 15; i++) {
                if (!premiumSlots.find(function(s) { return s.id === i; })) {
                    premiumSlots.push({ id: i, status: 'available' });
                }
            }
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
            return;
        } catch (e) {}
    }
    premiumSlots = [];
    for (var i2 = 1; i2 <= 15; i2++) {
        premiumSlots.push({ id: i2, status: 'available' });
    }
    localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
}

function loadPremiumSlots() {
    var saved = localStorage.getItem('premiumSlots');
    if (!saved || saved === 'null') {
        initPremiumSlots();
        saved = localStorage.getItem('premiumSlots');
    }
    try {
        premiumSlots = JSON.parse(saved);
    } catch (e) {
        initPremiumSlots();
        premiumSlots = JSON.parse(localStorage.getItem('premiumSlots'));
    }
    
    var premiumKey = getPremiumBookingKey();
    var myBooking = premiumKey ? JSON.parse(localStorage.getItem(premiumKey)) : null;
    
    for (var i = 1; i <= 15; i++) {
        var el = document.getElementById('spot' + i);
        if (!el) continue;
        var slot = premiumSlots.find(function(s) { return s.id === i; });
        if (!slot) continue;
        
        el.classList.remove('available', 'pending', 'occupied');
        var isMy = myBooking && myBooking.slotId == i && (myBooking.status === 'pending' || myBooking.status === 'approved');
        var isPaid = slot.status === 'paid' || slot.status === 'occupied';
        var isPending = (slot.status === 'pending' || slot.status === 'approved') && !isMy;
        
        if (isMy) {
            el.classList.add('pending');
            el.style.cursor = 'not-allowed';
        } else if (isPaid) {
            el.classList.add('occupied');
            el.style.cursor = 'not-allowed';
        } else if (isPending) {
            el.classList.add('pending');
            el.style.cursor = 'not-allowed';
        } else {
            el.classList.add('available');
            el.style.cursor = 'pointer';
        }
        el.innerText = i;
    }
    updateTotalAvailableCount();
}

function attachPremiumSlotEvents() {
    for (var i = 1; i <= 15; i++) {
        var el = document.getElementById('spot' + i);
        if (!el) continue;
        var newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        newEl.id = 'spot' + i;
        var slot = premiumSlots.find(function(s) { return s.id === i; });
        if (slot && slot.status === 'available') {
            newEl.onclick = (function(id) {
                return function() { bookPremiumSlot(id); };
            })(i);
        } else {
            newEl.onclick = null;
        }
        document.getElementById('spot' + i).innerText = i;
    }
}

function bookPremiumSlot(spotId) {
    if (isBookingInProgress) return;
    if (getActiveBooking()) {
        alert('You already have a booking!');
        return;
    }
    var slots = JSON.parse(localStorage.getItem('premiumSlots'));
    if (!slots) {
        alert('Parking data not found.');
        return;
    }
    var slot = slots.find(function(s) { return s.id === spotId; });
    if (!slot || slot.status !== 'available') {
        alert('This lot is not available.');
        return;
    }
    if (!confirm('Book Premium Lot ' + spotId + ' for RM50/semester?')) return;
    proceedWithBooking(spotId);
}

function proceedWithBooking(spotId) {
    if (isBookingInProgress) return;
    isBookingInProgress = true;
    try {
        var slots = JSON.parse(localStorage.getItem('premiumSlots'));
        if (!slots) { isBookingInProgress = false; return; }
        var slot = slots.find(function(s) { return s.id === spotId; });
        if (!slot || slot.status !== 'available') {
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
        localStorage.setItem('premiumSlots', JSON.stringify(slots));
        
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
        var key = getPremiumBookingKey();
        if (key) localStorage.setItem(key, JSON.stringify(booking));
        
        premiumSlots = slots;
        loadPremiumSlots();
        attachPremiumSlotEvents();
        refreshBookingDisplay();
        alert('✅ Premium Lot ' + spotId + ' booked! Status: PENDING - Waiting for staff approval.');
    } catch (e) {
        alert('Error: ' + e.message);
    }
    isBookingInProgress = false;
}

// ============================================================
// BASIC PARKING
// ============================================================
function bookBasicParking() {
    if (getActiveBooking()) {
        alert('You already have a booking!');
        return;
    }
    var basics = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    var active = basics.filter(function(b) { return b.status === 'pending' || b.status === 'approved' || b.status === 'paid'; }).length;
    var available = 55 - active;
    if (available <= 0) {
        alert('No basic parking lots available!');
        return;
    }
    if (!confirm('Book Basic Parking for RM30/semester?')) return;
    
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
    basics.push(booking);
    localStorage.setItem('allBasicBookings', JSON.stringify(basics));
    var key = getBasicBookingKey();
    if (key) localStorage.setItem(key, JSON.stringify(booking));
    updateBasicAvailableCount();
    refreshBookingDisplay();
    alert('✅ Basic Parking booked! Status: PENDING - Waiting for staff approval.');
}

function updateBasicAvailableCount() {
    var basics = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    var active = basics.filter(function(b) { return b.status === 'pending' || b.status === 'approved' || b.status === 'paid'; }).length;
    var available = 55 - active;
    var el = document.getElementById('basicAvailableCount');
    if (el) el.innerText = available >= 0 ? available : 0;
    updateTotalAvailableCount();
}

function updateTotalAvailableCount() {
    var slots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
    var occupied = slots.filter(function(s) { return s.status === 'pending' || s.status === 'occupied' || s.status === 'paid'; }).length;
    var basics = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    var basicOccupied = basics.filter(function(b) { return b.status === 'pending' || b.status === 'approved' || b.status === 'paid'; }).length;
    var el = document.getElementById('basicAvailableCount');
    if (el) el.innerText = Math.max(0, 55 - basicOccupied);
}

// ============================================================
// FORCE REFRESH
// ============================================================
function forceRefreshDashboard() {
    refreshBookingDisplay();
    loadPremiumSlots();
    updateBasicAvailableCount();
    updateTotalAvailableCount();
}

// ============================================================
// INIT
// ============================================================
(function init() {
    if (!loggedInStudent) return;
    var premiumKey = getPremiumBookingKey();
    var basicKey = getBasicBookingKey();
    if (!premiumKey || !basicKey) return;
    var myPremium = JSON.parse(localStorage.getItem(premiumKey));
    var myBasic = JSON.parse(localStorage.getItem(basicKey));
    var isFresh = sessionStorage.getItem('freshLogin') !== 'false';
    
    if (isFresh) {
        if (myPremium && myPremium.status !== 'paid') {
            var allPremium = JSON.parse(localStorage.getItem('premiumSlots')) || [];
            allPremium = allPremium.map(function(slot) {
                if (slot.id === myPremium.slotId && slot.bookedBy === loggedInStudent.id) {
                    return { id: slot.id, status: 'available' };
                }
                return slot;
            });
            localStorage.setItem('premiumSlots', JSON.stringify(allPremium));
            localStorage.removeItem(premiumKey);
        }
        if (myBasic && myBasic.status !== 'paid') {
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
    updateBasicAvailableCount();
    updateTotalAvailableCount();
}, 5000);

console.log('✅ Dashboard ready!');
console.log('👤 Student:', loggedInStudent ? loggedInStudent.name : 'Not logged in');
console.log('📧 Email:', loggedInStudent ? loggedInStudent.email : 'No email');
