import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios"; 
import env from "dotenv";       //import environment variables   to install... npm i dotenv, use it = env.config();

const app = express();
const port = 3000;
env.config();  // use environment variables

app.set("view engine", "ejs"); // Set the view engine to EJS

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let books = [];

  let users = [];
  
  
  //Render the home page with the books reviewed
  app.get("/", async (req, res) => {
    try {
      const booksResult = await db.query("SELECT * FROM books ORDER BY id ASC");
      const books = booksResult.rows;
  
      // Fetch cover URLs for each book
      for (const book of books) {
        try {
          const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);
          book.coverUrl = response.request.res.responseUrl; // update the coverUrl property
        } catch (error) {
          console.error(error);
          // Handle error (e.g., set a default cover image)
          book.coverUrl = "default-cover.jpg";
        }
      }
  
      res.render("index.ejs", {
        books: books,
      });
    } catch (err) {
      console.log(err);
    }
  });

  app.get("/add" , async (req, res) => {
    res.render("add.ejs");
  });



  //Create new book review
  app.post("/add", async (req, res) => {
  const { title, author, isbn, summary, notes, rating, dateRead, coverUrl } = req.body;
  try {
    await db.query("INSERT INTO books (title, author, isbn, summary, notes, rating, dateRead, coverURL) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [title, author, isbn, summary, notes, rating, dateRead, coverUrl]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding book");
  }
});



  //Delete a book
  app.post("/delete", async (req, res) => {
    const id = req.body.deleteItemId;
    try {
      await db.query("DELETE FROM books WHERE id = $1", [id]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  });

// MODIFY GET route for displaying the form to modify a book review
app.get("/modify/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    console.log("Result:", result.rows); // Log the fetched data
    const book = result.rows[0];
    res.render("modify.ejs", { book: book });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving book data");
  }
});



// MODIFY POST route for modifying a book review
app.post("/modify/:id", async (req, res) => {
  const bookId = req.params.id;
  const { title, author, isbn, summary, notes, rating, dateRead, coverUrl } = req.body;
  try {
    await db.query("UPDATE books SET title = $1, author = $2, isbn = $3, summary = $4, notes = $5, rating = $6, dateRead = $7, coverURL = $8 WHERE id = $9",
      [title, author, isbn, summary, notes, rating, dateRead, coverUrl, bookId]);
    res.redirect(`/`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating book review");
  }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  /*
app.post("/addUser", async (req, res) => {
  const { username } = req.body;
  try {
    const result = await db.query("INSERT INTO users (username) VALUES ($1) RETURNING id", [username]);
    const userId = result.rows[0].id;
    res.redirect(`/user/${userId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding user");
  }
});
*/

  /*
  //route for a new user
  app.get("/user/:id", async (req, res) => {
    const userId = req.params.id;
    try {
      const userResult = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
      const user = userResult.rows[0];
      
      const booksResult = await db.query("SELECT * FROM books WHERE users_id = $1 ORDER BY id ASC", [userId]);
      const books = booksResult.rows;
  
      res.render("user.ejs", {
        username: user.username,
        books: books
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Error retrieving user data");
    }
  });
  */
  
/*
  //new users route to add a book with id 
  app.post("/addReview", async (req, res) => {
    const { title, author, isbn, summary, notes, rating, dateRead, coverUrl } = req.body;
    try {
      await db.query("INSERT INTO books (title, author, isbn, summary, notes, rating, dateRead, coverURL, users_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [title, author, isbn, summary, notes, rating, dateRead, coverUrl, req.params.id]); // Assuming req.params.id contains the user ID
      res.redirect(`/user/${req.params.id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding book review");
    }
  });
  */