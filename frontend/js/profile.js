document.addEventListener("DOMContentLoaded", async function () {
    const userId = localStorage.getItem("user_id"); // Get user ID from localStorage

    if (!userId) {
        alert("User not found! Redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    // Fetch user details from backend
    async function fetchUserProfile() {
        const response = await fetch(`http://localhost:5000/profile/${userId}`);
        const data = await response.json();
        if (data.success) {
            document.getElementById("userName").innerText = data.data.name;
            document.getElementById("userEmail").innerText = data.data.email;
        } else {
            alert("Error fetching user details.");
        }
    }

    fetchUserProfile();

    // Update Profile
    document.getElementById("editProfileForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const newName = document.getElementById("newName").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();
        const newEmail = document.getElementById("newEmail").value.trim();

        const messageEl = document.getElementById("message");

        const updateData = {};
        if (newName) updateData.name = newName;
        if (newPassword) updateData.password = newPassword;
        if (newEmail) updateData.email = newEmail;

        if (Object.keys(updateData).length === 0) {
            messageEl.style.color = "red";
            messageEl.textContent = "No changes made.";
            return;
        }

        const response = await fetch(`http://localhost:5000/profile/update/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
        });

        const result = await response.json();
        if (result.success) {
            messageEl.style.color = "green";
            messageEl.textContent = "Profile updated successfully!";
            fetchUserProfile();
        } else {
            messageEl.style.color = "red";
            messageEl.textContent = "Failed to update profile.";
        }
    });
});