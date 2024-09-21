require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Captain = require("./models/captainsmodel");
const client = require("twilio")(process.env.accountSid, process.env.authToken);

const app = express();
app.use(cors());
app.use(bodyParser.json());

let loggedOutTokens = []; // Store invalidated tokens

// MongoDB connection using environment variable
const mongoURI = process.env.mongoURI;
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB Atlas connected successfully");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Generate random OTP
const randomNum = () => {
  let digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

let currentOTP = "";

app.post("/signup/signup", async (req, res) => {
  const { phoneNumber } = req.body;
  const OTP = randomNum();
  currentOTP = OTP; // Update the current OTP

  await client.messages
    .create({
      body: `Your OTP verification for user is ${OTP}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber, // Replace with actual phone number from request
    })
    .then(() => {
      res.status(200).json({
        msg: "Message sent",
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        error: "Error sending message",
      });
    });
});

app.post("/signup/verify", (req, res) => {
  try {
    const { otp } = req.body;
    if (otp === currentOTP) {
      // Generate JWT after OTP is verified without expiration
      const token = jwt.sign({ phoneNumber: req.body.phoneNumber }, JWT_SECRET);

      res.status(200).json({
        msg: "OTP verified successfully",
        token, // Send the token back to the client
      });

      currentOTP = ""; // Clear OTP
    } else {
      res.status(401).json({
        error: "Invalid OTP",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error verifying OTP",
    });
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  // Check if the token is in the loggedOutTokens array
  if (loggedOutTokens.includes(token)) {
    return res.status(401).json({ error: "Token is invalid" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Failed to authenticate token" });
    }
    req.user = decoded;
    next();
  });
};

// Protect the /captains route with JWT
app.post("/captains", verifyToken, async (req, res) => {
  try {
    const captainData = req.body;
    const newCaptain = new Captain(captainData);
    await newCaptain.save();
    res.status(201).json({ message: "Captain data saved successfully" });
  } catch (error) {
    console.error("Error saving captain:", error);
    res.status(500).json({ error: "Failed to save captain data" });
  }
});

// Logout route
app.post("/logout", verifyToken, (req, res) => {
  const token = req.headers["authorization"];

  // Add the token to the loggedOutTokens array
  loggedOutTokens.push(token);

  res.status(200).json({
    msg: "Logged out successfully",
  });
});

app.listen(8000, () => {
  console.log("Listening to the port");
});

// require("dotenv").config(); // Load environment variables from .env file
// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const Captain = require("./models/captainsmodel");
// const client = require("twilio")(process.env.accountSid, process.env.authToken);

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // MongoDB connection using environment variable
// const mongoURI = process.env.mongoURI;
// mongoose
//   .connect(mongoURI)
//   .then(() => {
//     console.log("MongoDB Atlas connected successfully");
//   })
//   .catch((err) => {
//     console.error("Error connecting to MongoDB Atlas:", err);
//   });

// // Secret key for JWT
// const JWT_SECRET = process.env.JWT_SECRET;

// // Generate random OTP
// const randomNum = () => {
//   let digits = "0123456789";
//   let otp = "";
//   for (let i = 0; i < 4; i++) {
//     otp += digits[Math.floor(Math.random() * 10)];
//   }
//   return otp;
// };

// let currentOTP = "";

// app.post("/signup/signup", async (req, res) => {
//   const { phoneNumber } = req.body;
//   const OTP = randomNum();
//   currentOTP = OTP; // Update the current OTP

//   await client.messages
//     .create({
//       body: `Your OTP verification for user is ${OTP}`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: phoneNumber, // Replace with actual phone number from request
//     })
//     .then(() => {
//       res.status(200).json({
//         msg: "Message sent",
//       });
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json({
//         error: "Error sending message",
//       });
//     });
// });

// app.post("/signup/verify", (req, res) => {
//   try {
//     const { otp } = req.body;
//     if (otp === currentOTP) {
//       // Generate JWT after OTP is verified
//       const token = jwt.sign(
//         { phoneNumber: req.body.phoneNumber },
//         JWT_SECRET,
//         { expiresIn: "1h" }
//       );

//       res.status(200).json({
//         msg: "OTP verified successfully",
//         token, // Send the token back to the client
//       });

//       currentOTP = ""; // Clear OTP
//     } else {
//       res.status(401).json({
//         error: "Invalid OTP",
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Error verifying OTP",
//     });
//   }
// });

// // Middleware to verify JWT
// const verifyToken = (req, res, next) => {
//   const token = req.headers["authorization"];
//   if (!token) {
//     return res.status(403).json({ error: "No token provided" });
//   }

//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ error: "Failed to authenticate token" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

// // Protect the /captains route with JWT
// app.post("/captains", verifyToken, async (req, res) => {
//   try {
//     const captainData = req.body;
//     const newCaptain = new Captain(captainData);
//     await newCaptain.save();
//     res.status(201).json({ message: "Captain data saved successfully" });
//   } catch (error) {
//     console.error("Error saving captain:", error);
//     res.status(500).json({ error: "Failed to save captain data" });
//   }
// });

// app.listen(8000, () => {
//   console.log("Listening to the port");
// });

// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const jwt = require("jsonwebtoken"); // For JWT
// const mongoose = require("mongoose");
// const Captain = require("./models/captainsmodel");
// // const accountSid = "AC9c89a4b015beb87b66207280496a8c8d";
// // const authToken = "f0c8cb107fecae1128cd579869b2fceb";
// const client = require("twilio")(accountSid, authToken);

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // const mongoURI =
// //   "mongodb+srv://chandus1603:zXUHNPJRj9Ur3Fgt@achiversdb.gc6cr.mongodb.net/?retryWrites=true&w=majority&appName=AchiversDB";
// mongoose
//   .connect(mongoURI)
//   .then(() => {
//     console.log("MongoDB Atlas connected successfully");
//   })
//   .catch((err) => {
//     console.error("Error connecting to MongoDB Atlas:", err);
//   });

// // Secret key for JWT
// // const JWT_SECRET =
// //   "71eca01b0fe5ea11bc704dbcccc3de691e9cb753aafea5d12fd86d296468c833";

// // Generate random OTP
// const randomNum = () => {
//   let digits = "0123456789";
//   let otp = "";
//   for (let i = 0; i < 4; i++) {
//     otp += digits[Math.floor(Math.random() * 10)];
//   }
//   return otp;
// };

// let currentOTP = "";

// app.post("/signup/signup", async (req, res) => {
//   const { phoneNumber } = req.body;
//   const OTP = randomNum();
//   currentOTP = OTP; // Update the current OTP

//   await client.messages
//     .create({
//       body: `Your OTP verification for user is ${OTP}`,
//       from: "14017534626",
//       to: phoneNumber, // Replace with actual phone number from request
//     })
//     .then(() => {
//       res.status(200).json({
//         msg: "Message sent",
//       });
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json({
//         error: "Error sending message",
//       });
//     });
// });

// app.post("/signup/verify", (req, res) => {
//   try {
//     const { otp } = req.body;
//     if (otp === currentOTP) {
//       // Generate JWT after OTP is verified
//       const token = jwt.sign(
//         { phoneNumber: req.body.phoneNumber },
//         JWT_SECRET,
//         { expiresIn: "1h" }
//       );

//       res.status(200).json({
//         msg: "OTP verified successfully",
//         token, // Send the token back to the client
//       });

//       currentOTP = ""; // Clear OTP
//     } else {
//       res.status(401).json({
//         error: "Invalid OTP",
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Error verifying OTP",
//     });
//   }
// });

// // Middleware to verify JWT
// const verifyToken = (req, res, next) => {
//   const token = req.headers["authorization"];
//   if (!token) {
//     return res.status(403).json({ error: "No token provided" });
//   }

//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ error: "Failed to authenticate token" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

// // Protect the /captains route with JWT
// app.post("/captains", verifyToken, async (req, res) => {
//   try {
//     const captainData = req.body;
//     const newCaptain = new Captain(captainData);
//     await newCaptain.save();
//     res.status(201).json({ message: "Captain data saved successfully" });
//   } catch (error) {
//     console.error("Error saving captain:", error);
//     res.status(500).json({ error: "Failed to save captain data" });
//   }
// });

// app.listen(8000, () => {
//   console.log("Listening to the port");
// });

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');
// const Captain = require('./models/captainsmodel')

// const accountSid = 'AC9c89a4b015beb87b66207280496a8c8d';
// const authToken = 'f0c8cb107fecae1128cd579869b2fceb';
// const client = require('twilio')(accountSid, authToken);

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// const mongoURI = 'mongodb+srv://chandus1603:zXUHNPJRj9Ur3Fgt@achiversdb.gc6cr.mongodb.net/?retryWrites=true&w=majority&appName=AchiversDB'
// mongoose.connect(mongoURI)
// .then(() => {
//   console.log('MongoDB Atlas connected successfully');
// })
// .catch(err => {
//   console.error('Error connecting to MongoDB Atlas:', err);

// });

// const randomNum = () => {
//   let digits = "0123456789";
//   let otp = "";
//   for (let i = 0; i < 4; i++) {
//     otp += digits[Math.floor(Math.random() * 10)];
//   }
//   return otp;
// };

// let currentOTP = "";

// app.post('/signup/signup', async (req, res) => {
//   const { phoneNumber } = req.body;
//   const OTP = randomNum();
//   currentOTP = OTP; // Update the current OTP

//   await client.messages.create({
//     body: `Your OTP verification for user is ${OTP}`,
//     from: '14017534626',
//     to: "+917981124094" // Replace with your test phone number
//   }).then(() => {
//     res.status(200).json({
//       msg: "Message sent"
//     });
//   })
//   .catch(error => {
//     console.error(error);
//     res.status(500).json({
//       error: "Error sending message"
//     });
//   });
// });

// app.post("/signup/verify", (req, res) => {
//   try {
//     const { otp } = req.body;
//     if (otp === currentOTP) {
//       res.status(200).json({
//         msg: "OTP verified successfully"
//       });

//       currentOTP = "";
//     } else {
//       res.status(401).json({
//         error: "Invalid OTP"
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       error: "Error verifying OTP"
//     });
//   }
// });

// app.post('/captains', async (req, res) => {
//     try {
//       const captainData = req.body;
//       const newCaptain = new Captain(captainData);
//       await newCaptain.save();
//       res.status(201).json({ message: 'Captain data saved successfully' });
//     } catch (error) {
//       console.error('Error saving captain:', error);
//       res.status(500).json({ error: 'Failed to save captain data' });
//     }
//   });

// app.listen(8000, () => {
//   console.log("Listening to the port");
// });
