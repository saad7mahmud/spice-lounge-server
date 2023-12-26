const express = require("express");
const mysql = require("mysql");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "spice-lounge-db",
});

// Route to get user information from the database
app.get("/users", (req, res) => {
  const sql = "SELECT * FROM users";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});
// Route to get foods information from the database
app.get("/foods", (req, res) => {
  const sql = "SELECT * FROM foods";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});

// Send User Info to DB
app.post("/users", (req, res) => {
  const userInfo = req.body;

  // Check if userEmail already exists
  const checkQuery = "SELECT * FROM users WHERE userEmail = ?";

  db.query(checkQuery, [userInfo.userEmail], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("Error checking user email:", checkErr);
      res.status(500).send("Internal Server Error");
      return;
    }

    // If user with userEmail already exists
    if (checkResult.length > 0) {
      console.log("User with the email already exists");
      res.status(409).send("User with the email already exists");
    } else {
      // Insert user data into the database
      const insertQuery = "INSERT INTO users SET ?";

      db.query(insertQuery, userInfo, (insertErr, result) => {
        if (insertErr) {
          console.error("Error inserting user data:", insertErr);
          res.status(500).send("Internal Server Error");
          return;
        }

        console.log("User data inserted successfully");
        res.status(200).send("User data inserted successfully");
      });
    }
  });
});

// Add foods to DB
app.post("/foods", (req, res) => {
  const foodInfo = req.body;

  const query = "INSERT INTO foods SET ?";

  db.query(query, foodInfo, (err, result) => {
    if (err) {
      console.error("Error inserting user data: " + err.stack);
      res.status(500).send("Internal Server Error");
      return;
    }

    console.log("Food data inserted successfully");
    res.status(200).send("Food data inserted successfully");
  });
});

// Create a simple route
app.get("/", (req, res) => {
  res.send("Spice Lounge is Running");
});

app.listen(3000, () => {
  console.log("Connected Successfully...");
});
