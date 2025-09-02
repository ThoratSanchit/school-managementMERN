import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
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
  employeeId: {
    type: String,
    required: [true, 'Please add employee ID'],
    unique: true,
    uppercase: true
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
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed']
    },
    aadharNumber: {
      type: String,
      match: [/^\d{12}$/, 'Aadhar number must be 12 digits']
    },
    panNumber: {
      type: String,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format']
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
  professionalInfo: {
    department: {
      type: String,
      required: [true, 'Please specify department'],
      enum: ['Mathematics', 'Science', 'English', 'Hindi', 'Social_Studies', 'Computer_Science', 'Physical_Education', 'Arts', 'Music', 'Other']
    },
    designation: {
      type: String,
      required: [true, 'Please specify designation'],
      enum: ['Principal', 'Vice_Principal', 'Head_Teacher', 'Senior_Teacher', 'Teacher', 'Assistant_Teacher', 'PRT', 'TGT', 'PGT', 'Librarian', 'Lab_Assistant', 'Other']
    },
    subjects: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Subject'
    }],
    classes: [{
      class: {
        type: mongoose.Schema.ObjectId,
        ref: 'Class'
      },
      section: {
        type: mongoose.Schema.ObjectId,
        ref: 'Section'
      },
      isClassTeacher: { type: Boolean, default: false }
    }],
    specialization: [String],
    teachingExperience: {
      type: Number,
      required: [true, 'Please add teaching experience in years']
    },
    joiningDate: {
      type: Date,
      required: [true, 'Please add joining date']
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'temporary', 'contract', 'substitute'],
      default: 'permanent'
    },
    workingHours: {
      type: String,
      enum: ['full_time', 'part_time'],
      default: 'full_time'
    }
  },
  qualifications: [{
    degree: {
      type: String,
      required: true,
      enum: ['B.Ed', 'M.Ed', 'B.A', 'M.A', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'Ph.D', 'Diploma', 'Certificate', 'Other']
    },
    subject: String,
    university: String,
    year: Number,
    percentage: Number,
    grade: String
  }],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  salaryInfo: {
    basicSalary: {
      type: Number,
      required: [true, 'Please add basic salary']
    },
    allowances: {
      da: { type: Number, default: 0 }, // Dearness Allowance
      hra: { type: Number, default: 0 }, // House Rent Allowance
      ta: { type: Number, default: 0 },  // Transport Allowance
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      pf: { type: Number, default: 0 },  // Provident Fund
      esi: { type: Number, default: 0 }, // Employee State Insurance
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash'],
      default: 'bank_transfer'
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String
    }
  },
  attendanceInfo: {
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    lateComings: { type: Number, default: 0 }
  },
  leaveInfo: {
    totalLeaves: { type: Number, default: 24 }, // Annual leaves
    usedLeaves: { type: Number, default: 0 },
    remainingLeaves: { type: Number, default: 24 },
    sickLeaves: { type: Number, default: 12 },
    usedSickLeaves: { type: Number, default: 0 }
  },
  emergencyContact: {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
    address: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'photo', 'aadhar_card', 'pan_card', 'degree_certificate', 'experience_certificate', 'salary_certificate', 'other'],
      required: true
    },
    fileName: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  performance: {
    rating: { type: Number, min: 1, max: 5 },
    lastReviewDate: Date,
    reviewComments: String,
    achievements: [String],
    trainingCompleted: [{
      name: String,
      completionDate: Date,
      certificateUrl: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated', 'retired'],
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
teacherSchema.index({ school: 1, employeeId: 1 });
teacherSchema.index({ school: 1, 'professionalInfo.department': 1 });
teacherSchema.index({ school: 1, status: 1 });

// Virtual for full name
teacherSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Virtual for age
teacherSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.personalInfo.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for gross salary
teacherSchema.virtual('grossSalary').get(function() {
  const allowances = this.salaryInfo.allowances;
  return this.salaryInfo.basicSalary + allowances.da + allowances.hra + allowances.ta + allowances.medical + allowances.other;
});

// Virtual for net salary
teacherSchema.virtual('netSalary').get(function() {
  const deductions = this.salaryInfo.deductions;
  return this.grossSalary - (deductions.pf + deductions.esi + deductions.tax + deductions.other);
});

export default mongoose.model('Teacher', teacherSchema);
