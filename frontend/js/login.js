function login() {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();
    let spinner = document.getElementById("spinner");
    let errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "none";

    if (email === "" || password === "") {
        errorMessage.innerText = "Please enter both email and password!";
        errorMessage.style.display = "block";
        return;
    }

    spinner.style.display = "block";

    fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        spinner.style.display = "none";
        if (data.error) {
            errorMessage.innerText = data.error;
            errorMessage.style.display = "block";
        } else {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("username", data.username);
            localStorage.setItem("user_id", data.user_id);
            window.location.href = "student_dashboard.html";
        }
    })
    .catch(error => {
        spinner.style.display = "none";
        errorMessage.innerText = "Login failed! Please try again.";
        errorMessage.style.display = "block";
    });
}