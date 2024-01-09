const express = require("express");
const mysql = require("mysql");
const util = require("util");
const app = express();
require("dotenv").config();
var jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 4000;

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

// JWT Related APIs
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1hr",
  });
  res.send({ token });
});

// ----------------------

// Middlewares
// Verify Token
const verifyToken = (req, res, next) => {
  console.log("inside verify", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};

// Verify Admin
const verifyAdmin = (req, res, next) => {
  const email = req.decoded.email;

  const sql = "SELECT userRole FROM users WHERE userEmail = ?";

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    const isAdmin =
      results && results.length > 0 && results[0].userRole === "admin";

    if (!isAdmin) {
      return res.status(403).send({ message: "Forbidden Access" });
    }

    next();
  });
};

const queryAsync = util.promisify(db.query);

// Route to get user information from the database
app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const sql = "SELECT * FROM users";

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.json(results);
    });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to get orders information by user email from the database
app.get("/orders/:email", (req, res) => {
  const userEmail = req.params.email;

  const query = "SELECT * FROM orders WHERE customerEmail = ?";

  db.query(query, [userEmail], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Always respond with a 200 status code
    res.status(200).json(results);
  });
});

// Route to get all orders information by admin
app.get("/orders", (req, res) => {
  const query = "SELECT * FROM orders";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 0) {
      // No orders found for the provided email
      return res.status(404).send("Orders not found");
    }

    // Orders found, send the orders information in the response
    res.json(results);
  });
});
// Route to get orders information by manager email from the database
app.get("/orders/manager/:email", (req, res) => {
  const userEmail = req.params.email;

  const query = "SELECT * FROM orders WHERE managerEmail = ?";

  db.query(query, [userEmail], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.status(200).json(results);
  });
});
// Route to get orders information by Cashier email from the database
app.get("/delivered-orders", (req, res) => {
  const query = "SELECT * FROM orders WHERE deliveryStatus = 'delivered'";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log("check", results);
    if (results.length === 0) {
      // No orders found for the provided email
      return res.status(404).send("Delivered item not found");
    }

    // Orders found, send the orders information in the response
    res.json(results);
    console.log("test", results);
  });
});
// Route to get foods information by manager email from the database
app.get("/foods/manager/:email", (req, res) => {
  const userEmail = req.params.email;

  const query = "SELECT * FROM foods WHERE managerEmail = ?";

  db.query(query, [userEmail], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 0) {
      // No orders found for the provided email
      return res.status(404).send("Food not found");
    }

    // Orders found, send the orders information in the response
    res.json(results);
  });
});

// Check isAdmin
app.get("/users/admin/:email", verifyToken, (req, res) => {
  const email = req.params.email;
  console.log("email is", email);

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const sql = "SELECT userRole FROM users WHERE userEmail = ?";

  db.query(sql, [email], (err, user) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log(user);
    let admin = false;
    if (user && user.length > 0) {
      admin = user[0].userRole === "admin";
    }

    res.send({ admin });
  });
});
// Check isManager
app.get("/users/manager/:email", verifyToken, (req, res) => {
  const email = req.params.email;
  console.log("email is", email);

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const sql = "SELECT userRole FROM users WHERE userEmail = ?";

  db.query(sql, [email], (err, user) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log(user);
    let manager = false;
    if (user && user.length > 0) {
      manager = user[0].userRole === "manager";
    }

    res.send({ manager });
  });
});
// Check Customer
app.get("/users/customer/:email", verifyToken, (req, res) => {
  const email = req.params.email;
  console.log("email is", email);

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const sql = "SELECT userRole FROM users WHERE userEmail = ?";

  db.query(sql, [email], (err, user) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log(user);
    let customer = false;
    if (user && user.length > 0) {
      customer = user[0].userRole === "customer";
    }

    res.send({ customer });
  });
});
// Check Cashier
app.get("/users/cashier/:email", verifyToken, (req, res) => {
  const email = req.params.email;
  console.log("email is", email);

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const sql = "SELECT userRole FROM users WHERE userEmail = ?";

  db.query(sql, [email], (err, user) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log(user);
    let cashier = false;
    if (user && user.length > 0) {
      cashier = user[0].userRole === "cashier";
    }

    res.send({ cashier });
  });
});
// Check Employee
app.get("/employee", (req, res) => {
  const sql = "SELECT * FROM users WHERE userRole != 'customer'";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});

// Make Admin

app.patch("/users/admin/:id", (req, res) => {
  const id = req.params.id;
  console.log("make admin id", id);

  const sql = 'UPDATE users SET userRole = "admin" WHERE userID = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(result);
  });
});
// Make Manager

app.patch("/users/manager/:id", (req, res) => {
  const id = req.params.id;
  console.log("make manager id", id);

  const sql = 'UPDATE users SET userRole = "manager" WHERE userID = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(result);
  });
});
// Make Cashier

app.patch("/users/cashier/:id", (req, res) => {
  const id = req.params.id;
  console.log("make cashier id", id);

  const sql = 'UPDATE users SET userRole = "cashier" WHERE userID = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(result);
  });
});
// Change Salary
app.put("/salary/:id", (req, res) => {
  const id = req.params.id;
  console.log("test", req.body);
  const updatedSalary = req.body;

  const sql = `
    UPDATE users
    SET
      salary = ?
    WHERE userID = ?
  `;

  const values = [updatedSalary.salary, id];

  // Execute the SQL query using db.query
  db.query(sql, values, (error, result) => {
    if (error) {
      console.error("Error updating salary:", error);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

// Change Status Delivered

app.patch("/orders/:id", (req, res) => {
  const id = req.params.id;

  const sql = 'UPDATE orders SET deliveryStatus = "delivered" WHERE foodID = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Food not found" });
    }

    res.send(result);
  });
});

// Endpoint to get a food item by foodID
app.get("/all-foods/:id", (req, res) => {
  const foodID = req.params.id;
  console.log(foodID);
  const query = "SELECT * FROM foods WHERE foodID = ?";

  db.query(query, [foodID], (err, result) => {
    if (err) {
      console.error("Error retrieving food:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (result.length === 0) {
      // No matching food item found
      res.status(404).send("Food not found");
    } else {
      // Food item found, send it in the response
      const foodItem = result[0];
      res.send(foodItem);
    }
  });
});

// Endpoint to delete a user
app.delete("/users/:id", (req, res) => {
  const id = req.params.id; // Assuming the ID is passed in the URL
  const query = "DELETE FROM users WHERE userID = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    console.log("User deleted successfully");
    res.status(200).send("User deleted successfully");
  });
});
// Endpoint to delete a order
app.delete("/orders/:id", (req, res) => {
  const id = req.params.id; // Assuming the ID is passed in the URL
  const query = "DELETE FROM orders WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error cancelling order:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    console.log("Order cancelled successfully");
    res.status(200).send("Order cancelled successfully");
  });
});

// Update Foods
app.put("/foods/:id", (req, res) => {
  const id = req.params.id;
  console.log("Request params:", req.params);

  console.log("check id", id);
  const updateFoodInfo = req.body;
  console.log("Body", updateFoodInfo);

  // Use a template string to create the SQL query
  const sql = `
    UPDATE foods
    SET
      foodTitle = ?,
      foodDescription = ?,
      foodImage = ?,
      foodPrice = ?,
      foodCategory = ?
    WHERE foodID = ?
  `;

  const values = [
    updateFoodInfo.foodTitle,
    updateFoodInfo.foodDescription,
    updateFoodInfo.foodImage,
    updateFoodInfo.foodPrice,
    updateFoodInfo.foodCategory,
    id,
  ];

  // Execute the SQL query using db.query
  db.query(sql, values, (error, result) => {
    if (error) {
      console.error("Error updating food:", error);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(result);
    }
  });
});

// Endpoint to Food a order
app.delete("/foods/:id", (req, res) => {
  const id = req.params.id; // Assuming the ID is passed in the URL
  const query = "DELETE FROM foods WHERE foodID = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error cancelling order:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    console.log("Order cancelled successfully");
    res.status(200).send("Order cancelled successfully");
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
// Add Order to DB with Validation
app.post("/orders", (req, res) => {
  const orderInfo = req.body;

  // Insert the order into the database
  const insertQuery = "INSERT INTO orders SET ?";

  db.query(insertQuery, orderInfo, (insertErr, result) => {
    if (insertErr) {
      console.error("Error inserting order data: " + insertErr.stack);
      res.status(500).send("Internal Server Error");
      return;
    }

    console.log("Order data inserted successfully");
    res.status(200).send("Order data inserted successfully");
  });
});

// Create a simple route
app.get("/", (req, res) => {
  res.send("Spice Lounge is Running");
});

app.listen(port, () => {
  console.log("Connected Successfully...");
});
