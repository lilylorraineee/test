<script>
function toggleMenu(){
    var menu = document.getElementById("menu");
    var overlay = document.getElementById("overlay");
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}

// Check for success message from signup
const urlParams = new URLSearchParams(window.location.search);
const success = urlParams.get('success');
if(success) {
    document.getElementById('successMsg').style.display = 'block';
    document.getElementById('successMsg').innerHTML = '✅ ' + success;
}

function loginLecturer() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let errorMsg = document.getElementById('errorMsg');
    let successMsg = document.getElementById('successMsg');

    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    let lecturers = JSON.parse(localStorage.getItem('lecturers')) || [];
    let lecturer = lecturers.find(l => l.email === email && l.password === password);

    if(lecturer) {
        let lecturerData = {
            id: lecturer.id,
            name: lecturer.name,
            email: lecturer.email,
            staff_id: lecturer.staff_id,
            ic_no: lecturer.ic_no,
            phone_no: lecturer.phone_no,
            department: lecturer.department,
            position: lecturer.position,
            plate_no: lecturer.plate_no || ''
        };
        
        sessionStorage.setItem('loggedInLecturer', JSON.stringify(lecturerData));
        window.location.href = 'https://saver-systm.lilylorraineee.workers.dev/lecturer/lecturer_dashbaord.html';
    } else {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '❌ Invalid email or password';
    }
    return false;
}
</script>
