<script>
function toggleMenu(){
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

function registerStudent() {
    // Get form values
    var fullname = document.getElementById('fullname').value.trim();
    var ic_no = document.getElementById('ic_no').value.trim();
    var matric_no = document.getElementById('matric_no').value.trim();
    var semester = document.getElementById('semester').value;
    var program = document.getElementById('program').value;
    var phone_no = document.getElementById('phone_no').value.trim();
    var email = document.getElementById('email').value.trim();
    var plate_no = document.getElementById('plate_no').value.trim().toUpperCase();
    var vehicle_type = document.getElementById('vehicle_type').value.trim();
    var vehicle_color = document.getElementById('vehicle_color').value.trim();
    var password = document.getElementById('password').value;
    var confirm_password = document.getElementById('confirm_password').value;
    var errorMsg = document.getElementById('errorMsg');

    // Clear previous error
    errorMsg.style.display = 'none';
    errorMsg.innerHTML = '';

    // Validation - Check all fields
    if (!fullname || !ic_no || !matric_no || !semester || !program || !phone_no || !email || !password || !confirm_password) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Please fill in all fields.';
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

    // Validation - Plate Number
    if(plate_no.length < 3) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Please enter a valid vehicle plate number (min 3 characters)';
        return false;
    }

    // Validation - Vehicle Type
    if(vehicle_type.length < 2) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Please enter your vehicle type/model';
        return false;
    }

    // Validation - Vehicle Color
    if(vehicle_color.length < 2) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Please enter your vehicle color';
        return false;
    }

    // Get existing students
    var students = JSON.parse(localStorage.getItem('students'));
    if(!students) {
        students = [];
    }

    // Check if email already exists
    for (var i = 0; i < students.length; i++) {
        if (students[i].email === email) {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Email already registered. Please login.';
            return false;
        }
    }

    // Check if matric number already exists
    for (var j = 0; j < students.length; j++) {
        if (students[j].matric_no === matric_no) {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ Matric number already registered';
            return false;
        }
    }

    // Check if plate number already exists
    for (var k = 0; k < students.length; k++) {
        if (students[k].plate_no === plate_no && students[k].plate_no !== '') {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ This plate number is already registered by another student';
            return false;
        }
    }

    // Create new student object WITH vehicle details
    var newStudent = {
        id: Date.now(),
        name: fullname,
        ic_no: ic_no,
        matric_no: matric_no,
        semester: semester,
        program: program,
        phone_no: phone_no,
        email: email,
        password: password,
        plate_no: plate_no,
        vehicle_type: vehicle_type,
        vehicle_color: vehicle_color
    };

    // Save to localStorage
    students.push(newStudent);
    localStorage.setItem('students', JSON.stringify(students));

    // Save to sessionStorage for auto login
    var loggedInStudent = {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        matric_no: newStudent.matric_no,
        ic_no: newStudent.ic_no,
        phone_no: newStudent.phone_no,
        plate_no: newStudent.plate_no,
        vehicle_type: newStudent.vehicle_type,
        vehicle_color: newStudent.vehicle_color,
        semester: newStudent.semester,
        program: newStudent.program
    };
    sessionStorage.setItem('loggedInStudent', JSON.stringify(loggedInStudent));

    // Redirect to student dashboard
    window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/student/student_dashboard.html';
    
    return false;
}
</script>
