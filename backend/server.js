const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dotenv = require("dotenv")

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config()
app.use("/", (req, res, next) => {
  console.log(req.method);
  next();
});
// Database Connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port:process.env.MYSQL_PORT,
  ssl: { rejectUnauthorized: false}, // Aiven requires SSL
  connectTimeout: 10000,
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected...");
});

// User Registration
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  const sql =
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')";

  db.query(sql, [name, email, hashedPassword], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: " User registered successfully!" });
  });
});

// User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: "Invalid password" });

    res.json({
      message: "✅ Login successful",
      username: user.name,
      role: user.role,
      user_id: user.user_id,
    });
  });
});
// Fetch User Profile
app.get("/profile/:user_id", (req, res) => {
  const { user_id } = req.params;
  console.log(user_id);
  const sql = "SELECT user_id, name, email FROM users WHERE user_id = ?";

  db.query(sql, [user_id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length === 0)
      return res.status(404).json({ error: " User not found" });
    console.log(result[0]);
    res.status(200).json({ success: true, data: result[0] });
  });
});

app.put("/profile/update/:user_id", (req, res) => {
  const { name, password, email } = req.body;
  const { user_id } = req.params;

  console.log(name, password, email, user_id);
  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, error: "User ID is required" });
  }

  let updateFields = [];
  let values = [];

  if (name) {
    updateFields.push("name = ?");
    values.push(name);
  }

  if (email) {
    updateFields.push("email = ?");
    values.push(email);
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 8);
    updateFields.push("password = ?");
    values.push(hashedPassword);
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: " No fields to update" });
  }

  values.push(user_id);
  const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`;

  db.query(sql, values, (err, result) => {
    console.log("Database Update Result:", result); // Debugging

    if (err) {
      return res
        .status(500)
        .json({ success: false, error: " Failed to update profile" });
    }

    if (result.affectedRows > 0) {
      return res.json({
        success: true,
        message: "✅ Profile updated successfully!",
      });
    } else {
      return res.json({ success: false, error: " No changes detected" });
    }
  });
});

// Fetch All Books (With Search)
app.get("/books", (req, res) => {
  let searchQuery = req.query.search;
  let sql;
  let values = [];

  if (searchQuery) {
    sql = "SELECT * FROM books WHERE title LIKE ?";
    values.push(`%${searchQuery}%`);
  } else {
    sql = "SELECT * FROM books";
  }

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

// Fetch Borrowed Books (For a User)
app.get("/borrowed-books", (req, res) => {
  const userId = req.query.user_id;
  console.log(userId);
  const sql = `
    SELECT bb.borrow_id, b.book_id, b.title, b.author, bb.borrow_date, bb.due_date, bb.status
    FROM borrowed_books bb
    JOIN books b ON bb.book_id = b.book_id
    WHERE bb.user_id = ? AND bb.status = 'borrowed'
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
});

// Borrow Book (Prevents Duplicate Borrowing)
app.post("/borrow", (req, res) => {
  const { user_id, book_id } = req.body;
  console.log(user_id, book_id);
  if (!user_id || !book_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID and Book ID are required" });
  }

  const checkAlreadyBorrowed = `SELECT * FROM borrowed_books WHERE user_id = ? AND book_id = ? AND status = 'borrowed'`;
  db.query(checkAlreadyBorrowed, [user_id, book_id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length > 0) {
      return res
        .status(400)
        .json({ error: "You have already borrowed this book!" });
    }

    const checkAvailability = `SELECT availability FROM books WHERE book_id = ?`;
    db.query(checkAvailability, [book_id], (checkErr, checkResult) => {
      if (checkErr) return res.status(500).json({ error: "Database error" });
      if (checkResult.length === 0)
        return res.status(404).json({ error: " Book not found" });

      if (checkResult[0].availability <= 0) {
        return res.status(400).json({ error: "Book is out of stock" });
      }
      console.log(user_id, book_id);
      const borrowQuery = `INSERT INTO borrowed_books (user_id, book_id, borrow_date, due_date, status) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'borrowed')`;
      db.query(borrowQuery, [user_id, book_id], (borrowErr) => {
        if (borrowErr)
          return res.status(500).json({ error: "Failed to borrow book" });

        const updateQuery = `UPDATE books SET availability = availability - 1 WHERE book_id = ?`;
        db.query(updateQuery, [book_id], (updateErr) => {
          if (updateErr)
            return res
              .status(500)
              .json({ error: "Failed to update book availability" });

          res.json({ success: true, message: "✅ Book borrowed successfully" });
        });
      });
    });
  });
});

// Return Book (With Transactions)
app.post("/return", (req, res) => {
  const { borrow_id, user_id, book_id } = req.body;
  console.log(borrow_id, user_id, book_id);

  if (!borrow_id || !user_id || !book_id) {
    return res.status(400).json({
      success: false,
      message: "Borrow ID, User ID, and Book ID are required",
    });
  }

  const updateBorrowQuery = `UPDATE borrowed_books SET status = 'returned', return_date = NOW() WHERE borrow_id = ? AND user_id = ? AND book_id = ? AND status = 'borrowed'`;
  const updateBookQuery = `UPDATE books SET availability = availability + 1 WHERE book_id = ?`;

  console.log("Returning Book: ", borrow_id, user_id, book_id);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Transaction error" });

    db.query(
      updateBorrowQuery,
      [borrow_id, user_id, book_id],
      (err, result) => {
        if (err || result.affectedRows === 0) {
          return db.rollback(() =>
            res.status(400).json({ error: "No record found to update" })
          );
        }

        db.query(updateBookQuery, [book_id], (err) => {
          if (err)
            return db.rollback(() =>
              res
                .status(500)
                .json({ error: "Failed to update book availability" })
            );

          db.commit((err) => {
            if (err)
              return db.rollback(() =>
                res.status(500).json({ error: "Commit error" })
              );

            res.json({
              success: true,
              message: "✅ Book returned successfully!",
            });
          });
        });
      }
    );
  });
});

// Server Listening
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
