import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
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
  studentId: {
    type: String,
    required: [true, 'Please add student ID'],
    unique: true,
    uppercase: true
  },
  admissionNumber: {
    type: String,
    required: [true, 'Please add admission number'],
    unique: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Please add roll number']
  },
  class: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: mongoose.Schema.ObjectId,
    ref: 'Section'
  },
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  personalInfo: {
    dateOfBirth: {
      type: Date,
      required: [true, 'Please add date of birth']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Please specify gender']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    nationality: {
      type: String,
      default: 'Indian'
    },
    religion: String,
    caste: String,
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'Other']
    },
    aadharNumber: {
      type: String,
      match: [/^\d{12}$/, 'Aadhar number must be 12 digits']
    },
    address: {
      permanent: {
        street: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        pincode: String
      },
      current: {
        street: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        pincode: String,
        sameAsPermanent: { type: Boolean, default: true }
      }
    }
  },
  parentInfo: {
    father: {
      name: { type: String, required: true },
      occupation: String,
      phone: String,
      email: String,
      income: Number,
      education: String
    },
    mother: {
      name: { type: String, required: true },
      occupation: String,
      phone: String,
      email: String,
      income: Number,
      education: String
    },
    guardian: {
      name: String,
      relation: String,
      phone: String,
      email: String,
      address: String
    },
    emergencyContact: {
      name: { type: String, required: true },
      relation: { type: String, required: true },
      phone: { type: String, required: true }
    }
  },
  academicInfo: {
    admissionDate: {
      type: Date,
      required: [true, 'Please add admission date']
    },
    previousSchool: {
      name: String,
      board: String,
      lastClass: String,
      tcNumber: String,
      tcDate: Date
    },
    subjects: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Subject'
    }],
    stream: {
      type: String,
      enum: ['Science', 'Commerce', 'Arts', 'Vocational']
    },
    medium: {
      type: String,
      enum: ['English', 'Hindi', 'Regional'],
      default: 'English'
    }
  },
  healthInfo: {
    height: Number, // in cm
    weight: Number, // in kg
    allergies: [String],
    medicalConditions: [String],
    medications: [String],
    doctorName: String,
    doctorPhone: String,
    insuranceDetails: {
      provider: String,
      policyNumber: String,
      validTill: Date
    }
  },
  transportInfo: {
    usesTransport: { type: Boolean, default: false },
    route: {
      type: mongoose.Schema.ObjectId,
      ref: 'TransportRoute'
    },
    pickupPoint: String,
    dropPoint: String
  },
  feeInfo: {
    category: {
      type: String,
      enum: ['Regular', 'Scholarship', 'Concession', 'Staff_Ward'],
      default: 'Regular'
    },
    scholarshipPercentage: { type: Number, default: 0 },
    concessionAmount: { type: Number, default: 0 },
    totalFeeAmount: { type: Number, required: true }
  },
  documents: [{
    type: {
      type: String,
      enum: ['birth_certificate', 'aadhar_card', 'photo', 'transfer_certificate', 'mark_sheet', 'caste_certificate', 'income_certificate', 'other'],
      required: true
    },
    fileName: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated', 'dropped_out', 'suspended'],
    default: 'active'
  },
  remarks: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
studentSchema.index({ school: 1, studentId: 1 });
studentSchema.index({ school: 1, class: 1, section: 1 });
studentSchema.index({ school: 1, academicYear: 1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Virtual for age
studentSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.personalInfo.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

export default mongoose.model('Student', studentSchema);
