/* ============================================================
   EMAILJS CONFIGURATION
============================================================ */

const EMAILJS_SERVICE_ID = "service_5yob3r8";
const EMAILJS_TEMPLATE_ID = "template_myo6jy7";
const EMAILJS_PUBLIC_KEY = "J0si7oLITea-Pt_YG";

emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
});

console.log('✅ EmailJS initialized with your IDs!');

/* ============================================================
   WEBSITE LINK
============================================================ */

const WEBSITE_LINK = "https://saver-systm.lilylorraineee.workers.dev/";

/* ============================================================
   SHOW TOAST NOTIFICATION
============================================================ */

function showToast(message, type) {
    var toast = document.getElementById('toastEmail');
    var toastMsg = document.getElementById('toastMessage');
    
    toast.className = 'toast-email';
    if (type === 'error') {
        toast.style.background = '#dc3545';
    } else if (type === 'warning') {
        toast.style.background = '#ffc107';
        toast.style.color = '#333';
    } else {
        toast.style.background = '#28a745';
        toast.style.color = 'white';
    }
    
    toastMsg.textContent = message;
    toast.style.display = 'block';
    
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() {
        toast.style.display = 'none';
    }, 5000);
}

/* ============================================================
   CHECK LOGIN
============================================================ */

var loggedInWarden = JSON.parse(sessionStorage.getItem('loggedInWarden'));
var loggedInAdmin = JSON.parse(sessionStorage.getItem('loggedInAdmin'));

if (!loggedInWarden && !loggedInAdmin) {
    window.location.href = '../login.html';
}

/* ============================================================
   VARIABLES
============================================================ */

var allBookings = [];
var filteredBookings = [];
var activeStatusFilter = null;
var allLecturers = [];

/* ============================================================
   MENU
============================================================ */

function toggleMenu() {
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('loggedInWarden');
        sessionStorage.removeItem('loggedInAdmin');
        window.location.href = 'login.php';
    }
}

/* ============================================================
   GET EMAIL FROM BOOKING
============================================================ */

function getBookingEmail(booking) {
    console.log("🔍 Searching email for:", booking.studentName);
    
    // 1. Check booking.studentEmail
    if (booking.studentEmail && String(booking.studentEmail).includes("@")) {
        console.log("✅ Found in studentEmail:", booking.studentEmail);
        return String(booking.studentEmail).trim();
    }
    
    // 2. Check booking.email
    if (booking.email && String(booking.email).includes("@")) {
        console.log("✅ Found in email:", booking.email);
        return String(booking.email).trim();
    }
    
    // 3. Check students list
    var students = JSON.parse(localStorage.getItem('students')) || [];
    for (var i = 0; i < students.length; i++) {
        if (String(students[i].id) === String(booking.studentId)) {
            if (students[i].email && String(students[i].email).includes("@")) {
                console.log("✅ Found in students list:", students[i].email);
                return String(students[i].email).trim();
            }
        }
        if (String(students[i].matric_no) === String(booking.studentMatric)) {
            if (students[i].email && String(students[i].email).includes("@")) {
                console.log("✅ Found in students list by matric:", students[i].email);
                return String(students[i].email).trim();
            }
        }
    }
    
    // 4. Check premiumSlots
    var premiumSlots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
    for (var j = 0; j < premiumSlots.length; j++) {
        if (String(premiumSlots[j].bookedBy) === String(booking.studentId)) {
            if (premiumSlots[j].studentEmail && String(premiumSlots[j].studentEmail).includes("@")) {
                console.log("✅ Found in premiumSlots:", premiumSlots[j].studentEmail);
                return String(premiumSlots[j].studentEmail).trim();
            }
        }
    }
    
    // 5. CREATE DUMMY EMAIL
    console.log("⚠️ No email found! Creating one...");
    var dummyEmail = "";
    
    if (booking.studentMatric && booking.studentMatric !== "N/A") {
        dummyEmail = booking.studentMatric.toLowerCase() + "@tvetmara.edu.my";
    } else if (booking.studentId) {
        dummyEmail = "student" + booking.studentId + "@tvetmara.edu.my";
    } else {
        dummyEmail = "unknown@tvetmara.edu.my";
    }
    
    console.log("✅ Created email:", dummyEmail);
    
    // Save to localStorage
    var studentsList = JSON.parse(localStorage.getItem('students')) || [];
    var existingStudent = studentsList.find(function(s) { 
        return String(s.id) === String(booking.studentId); 
    });
    
    if (existingStudent) {
        existingStudent.email = dummyEmail;
    } else {
        studentsList.push({
            id: booking.studentId,
            name: booking.studentName || 'Unknown',
            email: dummyEmail,
            matric_no: booking.studentMatric || 'N/A'
        });
    }
    localStorage.setItem('students', JSON.stringify(studentsList));
    
    return dummyEmail;
}

/* ============================================================
   SEND APPROVAL EMAIL - FIXED (GUNA "email")
============================================================ */

function sendApprovalEmail(booking) {
    return new Promise(function(resolve, reject) {
        
        var studentEmail = getBookingEmail(booking);
        
        console.log("📧 Sending email to:", studentEmail);
        
        if (!studentEmail || studentEmail === "" || studentEmail === "undefined") {
            alert("❌ Cannot send email. No email found.");
            showToast('⚠️ No email found', 'warning');
            reject(new Error("No email"));
            return;
        }

        // ===== FORMAT TARIKH =====
        var bookingDate = "N/A";
        var bookingTime = "N/A";

        if (booking.bookingTime) {
            var dateObject = new Date(booking.bookingTime);
            if (!isNaN(dateObject.getTime())) {
                bookingDate = dateObject.toLocaleDateString('ms-MY', {
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric'
                });
                bookingTime = dateObject.toLocaleTimeString('ms-MY', {
                    hour: '2-digit', 
                    minute: '2-digit'
                });
            }
        }

        // ===== DEADLINE BAYARAN (2 hari) =====
        var deadline = new Date();
        deadline.setDate(deadline.getDate() + 2);
        var paymentDeadline = deadline.toLocaleDateString('ms-MY', {
            day: 'numeric', 
            month: 'long', 
            year: 'numeric'
        });

        // ===== HARGA PARKING =====
        var parkingPrice = booking.type === 'premium' ? '50.00' : '30.00';
        var parkingTypeLabel = booking.type === 'premium' ? '⭐ Premium' : '🅿️ Basic';

        // ===== PARAMETER UNTUK TEMPLATE - GUNA "email" BUKAN "to_email" =====
        var templateParams = {
            email: studentEmail,  // ← INI YANG BETUL!
            student_name: booking.studentName || 'Student',
            booking_date: bookingDate,
            booking_time: bookingTime,
            plate_no: booking.plateNo || 'N/A',
            parking_type: parkingTypeLabel,
            parking_price: parkingPrice,
            payment_deadline: paymentDeadline,
            website_link: WEBSITE_LINK
        };

        console.log("📧 Template Params:", templateParams);

        // ===== SEND EMAIL =====
        emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        )
        .then(function(response) {
            console.log("✅ EMAIL SENT!", response.status);
            alert("✅ Email berjaya dihantar ke:\n" + studentEmail + 
                  "\n\n📌 Sila semak inbox/spam student.");
            showToast('✅ Email sent to ' + studentEmail, 'success');
            resolve(response);
        })
        .catch(function(error) {
            console.error("❌ EMAILJS ERROR:", error);
            
            var errorMsg = error.text || error.message || JSON.stringify(error);
            alert("❌ Email gagal dihantar.\n\n" +
                  "Error: " + errorMsg + "\n\n" +
                  "📌 Email: " + studentEmail + "\n" +
                  "📌 Template ID: " + EMAILJS_TEMPLATE_ID);
            
            showToast('❌ Email failed to send.', 'error');
            reject(error);
        });
    });
}

/* ============================================================
   APPROVE BOOKING
============================================================ */

function approveBooking(booking) {
    var studentEmail = getBookingEmail(booking);
    
    if (!confirm('Approve booking for ' + booking.studentName + ' (' + booking.type.toUpperCase() + ')?\n\nMatric: ' + booking.studentMatric + '\nCourse: ' + booking.studentCourse + '\n\n📧 Email: ' + (studentEmail || 'NOT FOUND'))) {
        return;
    }
    
    if (booking.type === 'premium') {
        var premiumSlots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
        var slot = premiumSlots.find(function(s) { return s.id == booking.slotId; });
        if (slot && slot.status === 'pending') {
            slot.status = 'approved';
            if (studentEmail) { slot.studentEmail = studentEmail; }
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
        }
        
        var premiumKey = 'myPremiumBooking_' + booking.studentId;
        var myPremiumBooking = JSON.parse(localStorage.getItem(premiumKey));
        if (myPremiumBooking && myPremiumBooking.slotId == booking.slotId) {
            myPremiumBooking.status = 'approved';
            if (studentEmail) { myPremiumBooking.studentEmail = studentEmail; }
            localStorage.setItem(premiumKey, JSON.stringify(myPremiumBooking));
        }
    } else if (booking.type === 'basic') {
        var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
        var index = allBasicBookings.findIndex(function(b) { return b.studentId === booking.studentId; });
        if (index !== -1) {
            allBasicBookings[index].status = 'approved';
            if (studentEmail) { allBasicBookings[index].studentEmail = studentEmail; }
            localStorage.setItem('allBasicBookings', JSON.stringify(allBasicBookings));
        }
        
        var basicKey = 'myBasicBooking_' + booking.studentId;
        var myBasicBooking = JSON.parse(localStorage.getItem(basicKey));
        if (myBasicBooking && myBasicBooking.studentId === booking.studentId) {
            myBasicBooking.status = 'approved';
            if (studentEmail) { myBasicBooking.studentEmail = studentEmail; }
            localStorage.setItem(basicKey, JSON.stringify(myBasicBooking));
        }
    }
    
    sendApprovalEmail(booking)
        .then(function() { loadAllData(); })
        .catch(function() { loadAllData(); });
}

/* ============================================================
   REJECT BOOKING
============================================================ */

function rejectBooking(booking) {
    if (!confirm('Reject booking for ' + booking.studentName + ' (' + booking.type.toUpperCase() + ')?\n\nSlot will become available again.')) {
        return;
    }
    
    if (booking.type === 'premium') {
        var premiumSlots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
        var slot = premiumSlots.find(function(s) { return s.id == booking.slotId; });
        if (slot) {
            slot.status = 'available';
            delete slot.bookedBy;
            delete slot.bookedByName;
            delete slot.studentIC;
            delete slot.studentMatric;
            delete slot.studentCourse;
            delete slot.studentSemester;
            delete slot.studentPhone;
            delete slot.studentEmail;
            delete slot.email;
            delete slot.plateNo;
            delete slot.bookingTime;
            localStorage.setItem('premiumSlots', JSON.stringify(premiumSlots));
        }
        var premiumKey = 'myPremiumBooking_' + booking.studentId;
        localStorage.removeItem(premiumKey);
    } else if (booking.type === 'basic') {
        var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
        var newBookings = allBasicBookings.filter(function(b) { return b.studentId !== booking.studentId; });
        localStorage.setItem('allBasicBookings', JSON.stringify(newBookings));
        var basicKey = 'myBasicBooking_' + booking.studentId;
        localStorage.removeItem(basicKey);
    }
    
    alert('❌ Booking for ' + booking.studentName + ' has been REJECTED.');
    loadAllData();
}

/* ============================================================
   STUDENT MODAL
============================================================ */

function openStudentModal(booking) {
    var body = document.getElementById('studentModalBody');
    var email = getBookingEmail(booking);
    
    body.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item full-width">
                <span class="label">👤 Name</span>
                <span class="value">${booking.studentName || 'N/A'}</span>
            </div>
            <div class="detail-item full-width" style="background:#e8f5e9; padding:10px; border-radius:8px;">
                <span class="label">📧 Email</span>
                <span class="value" style="color:#2e7d32; font-weight:bold;">${email || '❌ No email found'}</span>
            </div>
            <div class="detail-item"><span class="label">🪪 IC Number</span><span class="value">${booking.studentIC || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">🎓 Matric No.</span><span class="value">${booking.studentMatric || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">📖 Program</span><span class="value">${booking.studentCourse || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">📅 Semester</span><span class="value">${booking.studentSemester || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">📱 Phone</span><span class="value">${booking.studentPhone || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">🚗 Plate No.</span><span class="value">${booking.plateNo || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">🚙 Vehicle Type</span><span class="value">${booking.vehicleType || 'N/A'}</span></div>
            <div class="detail-item"><span class="label">🎨 Vehicle Color</span><span class="value">${booking.vehicleColor || 'N/A'}</span></div>
            <div class="detail-divider"></div>
            <div class="detail-item"><span class="label">🅿️ Booking Type</span><span class="value"><span class="tag ${booking.type === 'premium' ? 'tag-premium' : 'tag-basic'}">${booking.type || 'N/A'}</span></span></div>
            <div class="detail-item"><span class="label">📍 Slot</span><span class="value">${booking.slotId || 'Random'}</span></div>
            <div class="detail-item"><span class="label">📌 Status</span><span class="value"><span class="tag ${booking.status === 'pending' ? 'tag-pending' : booking.status === 'approved' ? 'tag-approved' : 'tag-paid'}">${booking.status || 'N/A'}</span></span></div>
        </div>
    `;
    
    document.getElementById('studentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ========== FILTER FUNCTIONS ==========

function filterByStatus(status) {
    document.getElementById('filterType').value = 'all';
    document.querySelectorAll('.stat-box').forEach(function(box) { box.classList.remove('active-filter'); });
    
    if (activeStatusFilter === status) {
        activeStatusFilter = null;
        document.getElementById('filterStatus').value = 'all';
        applyFilters();
        return;
    }
    
    activeStatusFilter = status;
    var statusMap = { 'all': 'statAll', 'pending': 'statPending', 'approved': 'statApproved', 'paid': 'statPaid' };
    if (statusMap[status]) {
        document.getElementById(statusMap[status]).classList.add('active-filter');
        document.getElementById('filterStatus').value = status;
    }
    applyFilters();
}

function filterPaidPremium() {
    document.getElementById('filterCourse').value = 'all';
    document.getElementById('filterSemester').value = 'all';
    document.getElementById('filterType').value = 'premium';
    document.getElementById('filterStatus').value = 'paid';
    document.querySelectorAll('.stat-box').forEach(function(box) { box.classList.remove('active-filter'); });
    activeStatusFilter = null;
    applyFilters();
}

function filterPaidBasic() {
    document.getElementById('filterCourse').value = 'all';
    document.getElementById('filterSemester').value = 'all';
    document.getElementById('filterType').value = 'basic';
    document.getElementById('filterStatus').value = 'paid';
    document.querySelectorAll('.stat-box').forEach(function(box) { box.classList.remove('active-filter'); });
    activeStatusFilter = null;
    applyFilters();
}

function openFilterModal() { document.getElementById('filterModal').classList.add('active'); }
function closeFilterModal() { document.getElementById('filterModal').classList.remove('active'); }
function applyFilterFromModal() { closeFilterModal(); activeStatusFilter = null; document.querySelectorAll('.stat-box').forEach(function(box) { box.classList.remove('active-filter'); }); applyFilters(); }
function resetFilters() {
    document.getElementById('filterCourse').value = 'all';
    document.getElementById('filterSemester').value = 'all';
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterStatus').value = 'all';
    activeStatusFilter = null;
    document.querySelectorAll('.stat-box').forEach(function(box) { box.classList.remove('active-filter'); });
    applyFilters();
}

function updateParkingBalance() {
    var premiumSlots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
    var premiumTotal = premiumSlots.length;
    var premiumPaid = premiumSlots.filter(function(s) { return s.bookedBy && s.bookedBy !== '' && (s.status === 'paid' || s.status === 'occupied'); }).length;
    document.getElementById('premiumAvailable').innerText = premiumPaid;
    document.getElementById('premiumTotal').innerText = premiumTotal;
    document.getElementById('premiumBar').style.width = (premiumTotal > 0 ? (premiumPaid / premiumTotal) * 100 : 0) + '%';
    
    var basicTotal = 55;
    var basicPaid = 0;
    var basicStudentIds = new Set();
    var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    allBasicBookings.forEach(function(b) {
        if (b.studentId && (b.status === 'paid' || b.status === 'occupied')) {
            if (!basicStudentIds.has(b.studentId)) { basicStudentIds.add(b.studentId); basicPaid++; }
        }
    });
    for (var key in localStorage) {
        if (key.startsWith('myBasicBooking_')) {
            try {
                var booking = JSON.parse(localStorage.getItem(key));
                if (booking && booking.studentId && (booking.status === 'paid' || booking.status === 'occupied')) {
                    if (!basicStudentIds.has(booking.studentId)) { basicStudentIds.add(booking.studentId); basicPaid++; }
                }
            } catch(e) {}
        }
    }
    if (basicPaid > basicTotal) basicPaid = basicTotal;
    document.getElementById('basicAvailable').innerText = basicPaid;
    document.getElementById('basicTotal').innerText = basicTotal;
    document.getElementById('basicBar').style.width = (basicTotal > 0 ? (basicPaid / basicTotal) * 100 : 0) + '%';
}

function updateStats(bookings) {
    var total = bookings.length;
    document.getElementById('totalBookings').innerText = total;
    document.getElementById('pendingCount').innerText = bookings.filter(function(b) { return b.status === 'pending'; }).length;
    document.getElementById('approvedCount').innerText = bookings.filter(function(b) { return b.status === 'approved'; }).length;
    document.getElementById('paidCount').innerText = bookings.filter(function(b) { return b.status === 'paid' || b.status === 'occupied'; }).length;
    document.getElementById('studentTotalCount').innerText = total;
}

function getAllBookings() {
    var bookings = [];
    var seen = new Set();
    
    var premiumSlots = JSON.parse(localStorage.getItem('premiumSlots')) || [];
    premiumSlots.forEach(function(slot) {
        if (slot.bookedBy) {
            var key = 'premium_' + slot.bookedBy + '_' + slot.id;
            if (!seen.has(key)) {
                seen.add(key);
                bookings.push({
                    studentId: slot.bookedBy,
                    studentName: slot.bookedByName || 'Unknown',
                    studentEmail: slot.studentEmail || '',
                    studentIC: slot.studentIC || 'N/A',
                    studentMatric: slot.studentMatric || 'N/A',
                    studentCourse: slot.studentCourse || slot.program || 'N/A',
                    studentSemester: slot.studentSemester || 'N/A',
                    studentPhone: slot.studentPhone || 'N/A',
                    plateNo: slot.plateNo || 'N/A',
                    slotId: slot.id,
                    type: 'premium',
                    status: slot.status || 'pending',
                    bookingTime: slot.bookingTime || new Date().toISOString(),
                    vehicleType: slot.vehicleType || 'N/A',
                    vehicleColor: slot.vehicleColor || 'N/A'
                });
            }
        }
    });
    
    for (var key in localStorage) {
        if (key.startsWith('myPremiumBooking_')) {
            try {
                var booking = JSON.parse(localStorage.getItem(key));
                if (booking && booking.studentId) {
                    var uniqueKey = 'premium_' + booking.studentId + '_' + (booking.slotId || '');
                    if (!seen.has(uniqueKey)) {
                        seen.add(uniqueKey);
                        bookings.push({
                            studentId: booking.studentId,
                            studentName: booking.studentName || 'Unknown',
                            studentEmail: booking.studentEmail || '',
                            studentIC: booking.studentIC || 'N/A',
                            studentMatric: booking.studentMatric || 'N/A',
                            studentCourse: booking.studentCourse || booking.program || 'N/A',
                            studentSemester: booking.studentSemester || 'N/A',
                            studentPhone: booking.studentPhone || 'N/A',
                            plateNo: booking.plateNo || 'N/A',
                            slotId: booking.slotId || 'N/A',
                            type: 'premium',
                            status: booking.status || 'pending',
                            bookingTime: booking.bookingTime || new Date().toISOString(),
                            vehicleType: booking.vehicleType || 'N/A',
                            vehicleColor: booking.vehicleColor || 'N/A'
                        });
                    }
                }
            } catch(e) {}
        }
    }
    
    var allBasicBookings = JSON.parse(localStorage.getItem('allBasicBookings')) || [];
    allBasicBookings.forEach(function(booking) {
        if (booking.studentId) {
            var key = 'basic_' + booking.studentId;
            if (!seen.has(key)) {
                seen.add(key);
                bookings.push({
                    studentId: booking.studentId,
                    studentName: booking.studentName || 'Unknown',
                    studentEmail: booking.studentEmail || '',
                    studentIC: booking.studentIC || 'N/A',
                    studentMatric: booking.studentMatric || 'N/A',
                    studentCourse: booking.studentCourse || booking.program || 'N/A',
                    studentSemester: booking.studentSemester || 'N/A',
                    studentPhone: booking.studentPhone || 'N/A',
                    plateNo: booking.plateNo || 'N/A',
                    slotId: 'Random',
                    type: 'basic',
                    status: booking.status || 'pending',
                    bookingTime: booking.bookingTime || new Date().toISOString(),
                    vehicleType: booking.vehicleType || 'N/A',
                    vehicleColor: booking.vehicleColor || 'N/A'
                });
            }
        }
    });
    
    for (var key2 in localStorage) {
        if (key2.startsWith('myBasicBooking_')) {
            try {
                var booking2 = JSON.parse(localStorage.getItem(key2));
                if (booking2 && booking2.studentId) {
                    var uniqueKey2 = 'basic_' + booking2.studentId;
                    if (!seen.has(uniqueKey2)) {
                        seen.add(uniqueKey2);
                        bookings.push({
                            studentId: booking2.studentId,
                            studentName: booking2.studentName || 'Unknown',
                            studentEmail: booking2.studentEmail || '',
                            studentIC: booking2.studentIC || 'N/A',
                            studentMatric: booking2.studentMatric || 'N/A',
                            studentCourse: booking2.studentCourse || booking2.program || 'N/A',
                            studentSemester: booking2.studentSemester || 'N/A',
                            studentPhone: booking2.studentPhone || 'N/A',
                            plateNo: booking2.plateNo || 'N/A',
                            slotId: 'Random',
                            type: 'basic',
                            status: booking2.status || 'pending',
                            bookingTime: booking2.bookingTime || new Date().toISOString(),
                            vehicleType: booking2.vehicleType || 'N/A',
                            vehicleColor: booking2.vehicleColor || 'N/A'
                        });
                    }
                }
            } catch(e) {}
        }
    }
    
    return bookings;
}

function applyFilters() {
    var course = document.getElementById('filterCourse').value;
    var semester = document.getElementById('filterSemester').value;
    var type = document.getElementById('filterType').value;
    var status = document.getElementById('filterStatus').value;
    
    filteredBookings = allBookings.filter(function(booking) {
        if (course !== 'all' && booking.studentCourse !== course) return false;
        if (semester !== 'all' && booking.studentSemester !== semester) return false;
        if (type !== 'all' && booking.type !== type) return false;
        if (status !== 'all' && booking.status !== status) return false;
        return true;
    });
    
    filteredBookings.sort(function(a, b) { return new Date(b.bookingTime) - new Date(a.bookingTime); });
    
    document.getElementById('filterResultCount').innerText = filteredBookings.length;
    renderTable(filteredBookings);
}

function renderTable(bookings) {
    var tbody = document.getElementById('bookingsBody');
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">📭 No bookings found.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    bookings.forEach(function(booking, index) {
        var row = tbody.insertRow();
        row.insertCell(0).innerText = index + 1;
        
        var nameCell = row.insertCell(1);
        var nameSpan = document.createElement('span');
        nameSpan.className = 'clickable-name';
        nameSpan.textContent = booking.studentName || 'Unknown';
        nameSpan.onclick = function() { openStudentModal(booking); };
        nameCell.appendChild(nameSpan);
        
        row.insertCell(2).innerHTML = '<span class="course-tag">' + (booking.studentCourse || 'N/A') + '</span>';
        row.insertCell(3).innerHTML = '<span class="semester-tag">Sem ' + (booking.studentSemester || 'N/A') + '</span>';
        row.insertCell(4).innerHTML = '<strong style="color:#1a237e;">' + (booking.plateNo || 'N/A') + '</strong>';
        
        var actionCell = row.insertCell(5);
        actionCell.style.display = 'flex';
        actionCell.style.gap = '5px';
        actionCell.style.flexWrap = 'wrap';
        actionCell.style.alignItems = 'center';
        
        var viewBtn = document.createElement('button');
        viewBtn.innerText = '👁️ View';
        viewBtn.className = 'btn-view';
        viewBtn.onclick = function() { openStudentModal(booking); };
        actionCell.appendChild(viewBtn);
        
        if (booking.status === 'pending') {
            var approveBtn = document.createElement('button');
            approveBtn.innerText = 'Approve';
            approveBtn.className = 'btn-approve';
            approveBtn.onclick = (function(b) { return function() { approveBooking(b); }; })(booking);
            actionCell.appendChild(approveBtn);
            
            var rejectBtn = document.createElement('button');
            rejectBtn.innerText = 'Reject';
            rejectBtn.className = 'btn-reject';
            rejectBtn.onclick = (function(b) { return function() { rejectBooking(b); }; })(booking);
            actionCell.appendChild(rejectBtn);
        }
    });
}

function loadAllBookings() {
    allBookings = getAllBookings();
    updateStats(allBookings);
    applyFilters();
}

function loadLecturers() {
    var lecturers = JSON.parse(localStorage.getItem('lecturers')) || [];
    document.getElementById('lecturerTotalCount').innerText = lecturers.length;
    var tbody = document.getElementById('lecturerBody');
    if (lecturers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">📭 No lecturers registered.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    lecturers.forEach(function(lecturer, index) {
        var row = tbody.insertRow();
        row.insertCell(0).innerText = index + 1;
        row.insertCell(1).innerHTML = '<strong>' + (lecturer.name || 'N/A') + '</strong>';
        row.insertCell(2).innerHTML = '<span class="staff-badge">' + (lecturer.staff_id || 'N/A') + '</span>';
        row.insertCell(3).innerText = lecturer.email || 'N/A';
        row.insertCell(4).innerText = lecturer.phone_no || 'N/A';
        row.insertCell(5).innerHTML = '<span class="program-tag">' + (lecturer.program || 'N/A') + '</span>';
        row.insertCell(6).innerHTML = lecturer.plate_no ? '<strong style="color:#1a237e;">' + lecturer.plate_no + '</strong>' : '<span style="color:#999;">-</span>';
        var actionCell = row.insertCell(7);
        var viewBtn = document.createElement('button');
        viewBtn.innerText = '👁️ View';
        viewBtn.className = 'btn-view';
        viewBtn.onclick = function() {
            alert('📋 Lecturer Details\n\nName: ' + lecturer.name + '\nStaff ID: ' + lecturer.staff_id + '\nEmail: ' + lecturer.email + '\nPhone: ' + lecturer.phone_no + '\nProgram: ' + (lecturer.program || 'N/A'));
        };
        actionCell.appendChild(viewBtn);
    });
}

function loadAllData() {
    loadAllBookings();
    updateParkingBalance();
}

document.getElementById('filterModal').addEventListener('click', function(e) {
    if (e.target === this) closeFilterModal();
});

loadAllData();
loadLecturers();
setInterval(loadAllData, 10000);
setInterval(loadLecturers, 30000);

console.log('🚀 Warden Dashboard ready!');
console.log('📧 Template ID:', EMAILJS_TEMPLATE_ID);
console.log('📧 Service ID:', EMAILJS_SERVICE_ID);
