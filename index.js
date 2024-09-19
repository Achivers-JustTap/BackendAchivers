const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const mongoose = require('mongoose');
const Captain = require('./models/captainsmodel')

const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const client = require('twilio')(accountSid, authToken);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mongoURI = 'mongodb+srv://chandus1603:zXUHNPJRj9Ur3Fgt@achiversdb.gc6cr.mongodb.net/?retryWrites=true&w=majority&appName=AchiversDB'
mongoose.connect(mongoURI)
.then(() => {
  console.log('MongoDB Atlas connected successfully');
})
.catch(err => {
  console.error('Error connecting to MongoDB Atlas:', err);   

});

const randomNum = () => {
  let digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

let currentOTP = ""; 

app.post('/signup/signup', async (req, res) => {
  const { phoneNumber } = req.body;
  const OTP = randomNum();
  currentOTP = OTP; // Update the current OTP

  await client.messages.create({
    body: `Your OTP verification for user is ${OTP}`,
    from: '14017534626',
    to: "+917981124094" // Replace with your test phone number
  }).then(() => {
    res.status(200).json({
      msg: "Message sent"
    });
  })
  .catch(error => {
    console.error(error);
    res.status(500).json({
      error: "Error sending message"
    });
  });
});

app.post("/signup/verify", (req, res) => {
  try {
    const { otp } = req.body;
    if (otp === currentOTP) {
      res.status(200).json({
        msg: "OTP verified successfully"
      });
     

      currentOTP = ""; 
    } else {
      res.status(401).json({
        error: "Invalid OTP"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error verifying OTP"
    });
  }
});

app.post('/captains', async (req, res) => {
    try {
      const captainData = req.body;
      const newCaptain = new Captain(captainData);
      await newCaptain.save();
      res.status(201).json({ message: 'Captain data saved successfully' });
    } catch (error) {
      console.error('Error saving captain:', error);
      res.status(500).json({ error: 'Failed to save captain data' });
    }
  });

app.listen(8000, () => {
  console.log("Listening to the port");
});