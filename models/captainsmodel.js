const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  vehicleType: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String, 
  },
  location: {
    type: String,
    required: true,
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
  },
  panNumber: {
    type: String,
    required: true,
    unique: true,
  },
  drivingLicenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  rcBookNumber: {
    type: String,
    required: true,
    unique: true,
  },
  bankAccountDetails: {
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    upi: {
      type: String,
      required: true,
    },
  },
  aadharFront: {
    type: String, 
  },
  aadharBack: {
    type: String, 
  },
  panFront: {
    type: String, 
  },
  panBack: {
    type: String, 
  },
  drivingLicenseFront: {
    type: String, 
  },
  drivingLicenseBack: {
    type: String, 
  },
  rcFront: {
    type: String, 
  },
  rcBack: {
    type: String, 
  },
});

const Captain = mongoose.model('Captain', captainSchema);

module.exports = Captain;