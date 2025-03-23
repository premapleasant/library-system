const API_URL = "https://library-system-rwqb.onrender.com";

        async function fetchBooks(searchQuery = "") {
            try {
                const response = await fetch(`${API_URL}/books?search=${encodeURIComponent(searchQuery)}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch books");
                }
                const books = await response.json();
                let resultsDiv = document.getElementById("bookResults");
                resultsDiv.innerHTML = "";
                
                if (!books || books.length === 0) {
                    resultsDiv.innerHTML = "<p>No books found.</p>";
                    return;
                }
                
                books.forEach(book => {
                    resultsDiv.innerHTML += `
                        <div class="book-card">
                            <h3>${book.title}</h3>
                            <p><strong>Author:</strong> ${book.author}</p>
                            <p><strong>Availability:</strong> ${book.availability ? "Available" : "Not Available"}</p>
                        </div>
                    `;
                });
            } catch (error) {
                console.error("Error fetching books:", error);
                document.getElementById("bookResults").innerHTML = "<p>Error loading books. Please try again later.</p>";
            }
        }

        function searchBooks() {
            let searchQuery = document.getElementById("search").value.trim();
            fetchBooks(searchQuery);
        }

        async function checkUserSession() {
            let token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/verifyToken`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error("Invalid session");
                }
                const data = await response.json();
                if (data.success) {
                    document.getElementById("loginBtn").style.display = "none";
                    document.getElementById("registerBtn").style.display = "none";
                    document.getElementById("logoutBtn").style.display = "inline-block";
                    alert("Welcome back, " + data.user.name + "!");
                } else {
                    localStorage.removeItem("token");
                }
            } catch (error) {
                console.error("Session check failed:", error);
            }
        }

        function logout() {
            localStorage.removeItem("token");
            alert("Logged out successfully!");
            location.reload();
        }

        // Load all books on page load
        document.addEventListener("DOMContentLoaded", () => {
            fetchBooks();
            checkUserSession();
        });