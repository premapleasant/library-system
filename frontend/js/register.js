function register() {
    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();
    let spinner = document.getElementById("spinner");
    let errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "none";

    if (name === "" || email === "" || password === "") {
        errorMessage.innerText = "Please fill all fields!";
        errorMessage.style.display = "block";
        return;
    }

    spinner.style.display = "block";

    fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => response.json())
    .then(data => {
        spinner.style.display = "none";
        if (data.error) {
            errorMessage.innerText = data.error;
            errorMessage.style.display = "block";
        } else {
            window.location.href = "login.html";
        }
    })
    .catch(error => {
        spinner.style.display = "none";
        errorMessage.innerText = "Registration failed! Please try again.";
        errorMessage.style.display = "block";
    });
}