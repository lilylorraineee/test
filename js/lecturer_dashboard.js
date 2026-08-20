<script>
// ============================================================
// CHECK LOGIN
// ============================================================
let lecturerData = JSON.parse(sessionStorage.getItem('loggedInLecturer'));

if (!lecturerData) {
    window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/lecturer/lecturer_login.html';
} else {
    // Display personal information
    document.getElementById('lecturerName').textContent = lecturerData.name || 'Lecturer';
    document.getElementById('lecturerEmail').textContent = lecturerData.email || '-';
    document.getElementById('lecturerStaffId').textContent = lecturerData.staff_id || '-';
    document.getElementById('lecturerPhone').textContent = lecturerData.phone_no || '-';
    
    // Display Program with badge
    let program = lecturerData.program || '-';
    if (program !== '-') {
        document.getElementById('lecturerProgram').innerHTML = `<span class="program-tag">${program}</span>`;
    } else {
        document.getElementById('lecturerProgram').textContent = '-';
    }

    // Display vehicle information
    let plateNo = lecturerData.plate_no || '';
    let vehicleType = lecturerData.vehicle_type || '';
    let vehicleColor = lecturerData.vehicle_color || '';

    if (plateNo || vehicleType || vehicleColor) {
        document.getElementById('vehicleStatus').textContent = '✅ Registered';
        document.getElementById('vehicleStatus').style.background = '#e8f5e9';
        document.getElementById('vehicleStatus').style.color = '#2e7d32';
        document.getElementById('lecturerPlateNo').textContent = plateNo || '-';
        document.getElementById('lecturerVehicleType').textContent = vehicleType || '-';
        document.getElementById('lecturerVehicleColor').textContent = vehicleColor || '-';
    } else {
        document.getElementById('vehicleStatus').textContent = '⚠️ No Vehicle';
        document.getElementById('vehicleStatus').style.background = '#fff3e0';
        document.getElementById('vehicleStatus').style.color = '#e65100';
    }
}

// ============================================================
// MENU FUNCTIONS
// ============================================================
function toggleMenu() {
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

// ============================================================
// ACTION FUNCTIONS
// ============================================================
function reportIssue() {
    alert('📋 Report Issue\n\nPlease describe your issue below:\n\n1. Parking spot damaged\n2. Unauthorized vehicle\n3. Other concerns\n\nOur team will investigate and resolve it.');
}

// ============================================================
// UPDATE VEHICLE MODAL FUNCTIONS
// ============================================================
function openUpdateModal() {
    // Load current vehicle data into modal
    let currentPlate = document.getElementById('lecturerPlateNo').textContent;
    let currentModel = document.getElementById('lecturerVehicleType').textContent;
    let currentColor = document.getElementById('lecturerVehicleColor').textContent;
    
    // Check if values are empty or placeholder
    if (currentPlate.includes('Not registered') || currentPlate === '-') currentPlate = '';
    if (currentModel.includes('Not registered') || currentModel === '-') currentModel = '';
    if (currentColor.includes('Not registered') || currentColor === '-') currentColor = '';
    
    document.getElementById('updatePlate').value = currentPlate;
    document.getElementById('updateModel').value = currentModel;
    document.getElementById('updateColor').value = currentColor;
    
    document.getElementById('updateModal').classList.add('active');
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
}

function saveVehicleUpdate() {
    let newPlate = document.getElementById('updatePlate').value.trim().toUpperCase();
    let newModel = document.getElementById('updateModel').value.trim();
    let newColor = document.getElementById('updateColor').value.trim();
    
    // Validation - at least one field must be filled
    if (!newPlate && !newModel && !newColor) {
        alert('⚠️ Please fill in at least one vehicle detail.');
        return;
    }

    // Validation - plate number minimum 3 characters if provided
    if (newPlate && newPlate.length < 3) {
        alert('⚠️ Plate number must be at least 3 characters.');
        return;
    }

    // ============================================================
    // KESELAMATAN: Sahkan lecturer ID sebelum update
    // ============================================================
    let lecturers = JSON.parse(localStorage.getItem('lecturers')) || [];
    
    // Cari lecturer berdasarkan ID yang sedang login
    let index = lecturers.findIndex(l => l.id === lecturerData.id);
    
    if (index === -1) {
        alert('❌ Error: Lecturer data not found. Please login again.');
        return;
    }

    // ============================================================
    // KESELAMATAN: Check jika plate number sudah digunakan oleh orang lain
    // ============================================================
    if (newPlate) {
        let existingLecturer = lecturers.find((l, i) => 
            l.plate_no === newPlate && i !== index
        );
        if (existingLecturer) {
            alert('❌ This plate number "' + newPlate + '" is already registered by another staff.');
            return;
        }
    }

    // ============================================================
    // UPDATE DATA
    // ============================================================
    // Simpan data lama untuk reference
    let oldPlate = lecturers[index].plate_no || 'Not registered';
    let oldModel = lecturers[index].vehicle_type || 'Not registered';
    let oldColor = lecturers[index].vehicle_color || 'Not registered';
    
    // Update lecturer data
    if (newPlate) lecturers[index].plate_no = newPlate;
    if (newModel) lecturers[index].vehicle_type = newModel;
    if (newColor) lecturers[index].vehicle_color = newColor;
    
    // Save back to localStorage
    localStorage.setItem('lecturers', JSON.stringify(lecturers));
    
    // Update sessionStorage
    if (newPlate) lecturerData.plate_no = newPlate;
    if (newModel) lecturerData.vehicle_type = newModel;
    if (newColor) lecturerData.vehicle_color = newColor;
    sessionStorage.setItem('loggedInLecturer', JSON.stringify(lecturerData));
    
    // Close modal
    closeUpdateModal();
    
    // Show success message with changes
    let changes = [];
    if (newPlate && newPlate !== oldPlate) changes.push('Plate: ' + oldPlate + ' → ' + newPlate);
    if (newModel && newModel !== oldModel) changes.push('Model: ' + oldModel + ' → ' + newModel);
    if (newColor && newColor !== oldColor) changes.push('Color: ' + oldColor + ' → ' + newColor);
    
    if (changes.length > 0) {
        alert('✅ Vehicle information updated successfully!\n\n' + changes.join('\n'));
    } else {
        alert('ℹ️ No changes were made to your vehicle information.');
    }
    
    // Refresh the page to show updated data
    location.reload();
}

// ============================================================
// CLOSE MODAL ON CLICK OUTSIDE
// ============================================================
document.getElementById('updateModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeUpdateModal();
    }
});

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('loggedInLecturer');
        window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/lecturer/lecturer_login.html';
    }
}
</script>
