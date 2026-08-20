<script>
function toggleMenu(){
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

function registerLecturer() {
    // Get form values
    let fullname = document.getElementById('fullname').value.trim();
    let staff_id = document.getElementById('staff_id').value.trim();
    let email = document.getElementById('email').value.trim();
    let phone_no = document.getElementById('phone_no').value.trim();
    let program = document.getElementById('program').value;
    let plate_no = document.getElementById('plate_no').value.trim().toUpperCase();
    let vehicle_type = document.getElementById('vehicle_type').value.trim();
    let vehicle_color = document.getElementById('vehicle_color').value.trim();
    let password = document.getElementById('password').value;
    let confirm_password = document.getElementById('confirm_password').value;
    
    let errorMsg = document.getElementById('errorMsg');

    // Clear previous error
    errorMsg.style.display = 'none';
    errorMsg.innerHTML = '';

    // Validation - Required fields
    if(!fullname || !staff_id || !email || !phone_no || !program || !password || !confirm_password) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Please fill in all required fields';
        return false;
    }

    // Validation - Staff ID must be 6 digits
    if(!/^\d{6}$/.test(staff_id)) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Staff ID must be exactly 6 digits (e.g., 123456)';
        return false;
    }

    // Validation - Password
    if(password !== confirm_password) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Passwords do not match';
        return false;
    }

    if(password.length < 6) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Password must be at least 6 characters';
        return false;
    }

    // Get existing lecturers
    let lecturers = JSON.parse(localStorage.getItem('lecturers'));
    if(!lecturers) {
        lecturers = [];
    }

    // Check if email already exists
    if(lecturers.some(l => l.email === email)) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Email already registered. Please login.';
        return false;
    }

    // Check if staff_id already exists
    if(lecturers.some(l => l.staff_id === staff_id)) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Staff ID already registered';
        return false;
    }

    // Check if plate number already exists (if provided)
    if(plate_no && lecturers.some(l => l.plate_no === plate_no)) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ This plate number is already registered by another staff';
        return false;
    }

    // Create new lecturer object
    let newLecturer = {
        id: Date.now(),
        name: fullname,
        staff_id: staff_id,
        email: email,
        phone_no: phone_no,
        program: program,
        plate_no: plate_no || '',
        vehicle_type: vehicle_type || '',
        vehicle_color: vehicle_color || '',
        password: password,
        registered_at: new Date().toISOString()
    };

    // Save to localStorage
    lecturers.push(newLecturer);
    localStorage.setItem('lecturers', JSON.stringify(lecturers));

    // Show loading overlay
    document.getElementById('loadingOverlay').classList.add('active');

    // Auto login - Save to sessionStorage
    let lecturerData = {
        id: newLecturer.id,
        name: newLecturer.name,
        email: newLecturer.email,
        staff_id: newLecturer.staff_id,
        phone_no: newLecturer.phone_no,
        program: newLecturer.program,
        plate_no: newLecturer.plate_no,
        vehicle_type: newLecturer.vehicle_type,
        vehicle_color: newLecturer.vehicle_color
    };
    
    sessionStorage.setItem('loggedInLecturer', JSON.stringify(lecturerData));

    // Redirect to dashboard after 1.5 seconds
    setTimeout(function() {
        window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/lecturer/lecturer_dashboard.html';
    }, 1500);

    return false;
}
</script>
