const API_URL = "https://library-system-rwqb.onrender.com";
      let userId = localStorage.getItem("user_id");

      document.getElementById("studentName").innerText =
        localStorage.getItem("username");

      function showNotification(message, isError = false) {
        const notification = document.getElementById("notification");
        notification.innerText = message;
        notification.classList.toggle("error", isError);
        notification.style.display = "block";

        setTimeout(() => {
          notification.style.display = "none";
        }, 3000);
      }

      function loadBooks() {
        let search = document.getElementById("searchBook").value;
        fetch(`${API_URL}/books?search=${search}`)
          .then((res) => res.json())
          .then((books) => {
            let bookList = document.getElementById("bookList");
            bookList.innerHTML = "";
            books.forEach((book) => {
              let bookElement = document.createElement("div");
              bookElement.className = "book";
              bookElement.innerHTML = `
                <div class="book-info">
                  <i class="fas fa-book icon"></i>
                  <span>${book.title} by ${book.author}</span>
                </div>
                <button class="btn borrow-btn" onclick="borrowBook(${book.book_id})" ${book.availability ? "" : "disabled"}>Borrow</button>
                <button class="btn return-btn" onclick="returnBook(this)" disabled>Return</button>
              `;
              bookList.appendChild(bookElement);
            });
            loadBorrowedBooks();
          })
          .catch(() => showNotification("Error loading books", true));
      }

      function loadBorrowedBooks() {
        fetch(`${API_URL}/borrowed-books?user_id=${userId}`)
          .then((res) => res.json())
          .then((borrowedBooks) => {
            let books = document.querySelectorAll(".book");
            borrowedBooks.forEach((borrowed) => {
              books.forEach((book) => {
                if (book.innerText.includes(borrowed.title)) {
                  book.querySelector(".borrow-btn").disabled = true;
                  let returnBtn = book.querySelector(".return-btn");
                  returnBtn.disabled = false;
                  returnBtn.setAttribute("data-borrow-id", borrowed.borrow_id);
                  returnBtn.setAttribute("data-book-id", borrowed.book_id);
                }
              });
            });
          });
      }

      function borrowBook(bookId) {
        fetch(`${API_URL}/borrow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, book_id: bookId }),
        })
          .then((res) => res.json())
          .then(() => {
            showNotification("✅ Book borrowed successfully!");
            loadBooks();
          })
          .catch(() => showNotification("❌ Error borrowing book", true));
      }

      function returnBook(button) {
    let borrowId = button.getAttribute("data-borrow-id");
    let bookId = button.getAttribute("data-book-id");

    fetch(`${API_URL}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrow_id: borrowId, user_id: userId  ,book_id : bookId}),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            showNotification("✅ Book returned successfully!");

            // Enable the Borrow button and disable the Return button
            let bookElement = button.closest(".book");
            let borrowButton = bookElement.querySelector(".borrow-btn");
            borrowButton.disabled = false;
            button.disabled = true;

            // Remove data attributes from return button
            button.removeAttribute("data-borrow-id");
            button.removeAttribute("data-book-id");
        } else {
            showNotification("❌ Error returning book", true);
        }
    })
    .catch(() => showNotification("❌ Error returning book", true));
}

      function logout() {
        localStorage.clear();
        window.location.href = "login.html";
      }

      function goToProfile() {
        window.location.href = "profile.html";
      }

      loadBooks();