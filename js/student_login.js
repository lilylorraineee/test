<script>
function toggleMenu(){
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

function loginStudent() {
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var errorMsg = document.getElementById('errorMsg');
    var successMsg = document.getElementById('successMsg');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    var students = JSON.parse(localStorage.getItem('students')) || [];
    var student = null;
    
    for (var i = 0; i < students.length; i++) {
        if (students[i].email === email && students[i].password === password) {
            student = students[i];
            break;
        }
    }

    if(student) {
        // Save all student data including email
        var loggedInStudent = {
            id: student.id,
            name: student.name,
            email: student.email,
            matric_no: student.matric_no,
            ic_no: student.ic_no,
            phone_no: student.phone_no,
            plate_no: student.plate_no || '',
            vehicle_type: student.vehicle_type || '',
            vehicle_color: student.vehicle_color || '',
            semester: student.semester,
            program: student.program || student.course || ''
        };
        sessionStorage.setItem('loggedInStudent', JSON.stringify(loggedInStudent));
        
        console.log('✅ Student logged in:', loggedInStudent);
        
        window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/student/student_dashboard.html';
    } else {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Invalid email or password. Please try again.';
    }
    return false;
}
</script>
