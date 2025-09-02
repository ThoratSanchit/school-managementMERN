import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  parentId: {
    type: String,
    required: [true, 'Please add parent ID'],
    unique: true,
    uppercase: true
  },
  personalInfo: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    nationality: {
      type: String,
      default: 'Indian'
    },
    religion: String,
    aadharNumber: {
      type: String,
      match: [/^\d{12}$/, 'Aadhar number must be 12 digits']
    },
    panNumber: {
      type: String,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String
    }
  },
  professionalInfo: {
    occupation: String,
    designation: String,
    company: String,
    workAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    workPhone: String,
    workEmail: String,
    monthlyIncome: Number,
    experience: Number
  },
  children: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'Student',
      required: true
    },
    relation: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'stepfather', 'stepmother', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'],
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  emergencyContacts: [{
    name: { type: String, required: true },
    relation: String,
    phone: { type: String, required: true },
    email: String,
    address: String
  }],
  preferences: {
    communicationMode: {
      type: String,
      enum: ['email', 'sms', 'phone', 'app_notification'],
      default: 'email'
    },
    language: {
      type: String,
      enum: ['English', 'Hindi', 'Regional'],
      default: 'English'
    },
    receiveUpdates: {
      attendance: { type: Boolean, default: true },
      grades: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      fees: { type: Boolean, default: true },
      disciplinary: { type: Boolean, default: true }
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['photo', 'aadhar_card', 'pan_card', 'income_certificate', 'address_proof', 'other'],
      required: true
    },
    fileName: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  loginCredentials: {
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    passwordResetRequired: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  remarks: String
}, {
  timestamps: true
});

// Indexes
parentSchema.index({ school: 1, parentId: 1 });
parentSchema.index({ 'children.student': 1 });

// Virtual for full name
parentSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

export default mongoose.model('Parent', parentSchema);
