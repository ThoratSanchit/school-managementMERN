import mongoose from 'mongoose';

const transportManagerSchema = new mongoose.Schema({
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
    licenseNumber: {
      type: String,
      required: [true, 'Please add driving license number']
    },
    licenseType: {
      type: String,
      enum: ['LMV', 'HMV', 'MCWG', 'MCWOG'],
      required: [true, 'Please specify license type']
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'Please add license expiry date']
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
    designation: {
      type: String,
      enum: ['Transport_Manager', 'Senior_Driver', 'Driver', 'Transport_Supervisor', 'Route_Coordinator'],
      default: 'Transport_Manager'
    },
    joiningDate: {
      type: Date,
      required: [true, 'Please add joining date']
    },
    experience: {
      type: Number,
      required: [true, 'Please add driving experience in years']
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'temporary', 'contract'],
      default: 'permanent'
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'both'],
      default: 'both'
    }
  },
  assignedRoutes: [{
    route: {
      type: mongoose.Schema.ObjectId,
      ref: 'TransportRoute'
    },
    vehicle: {
      type: mongoose.Schema.ObjectId,
      ref: 'Vehicle'
    },
    isPrimary: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date
  }],
  responsibilities: [{
    type: String,
    enum: [
      'route_management',
      'vehicle_maintenance',
      'driver_supervision',
      'student_safety',
      'fuel_management',
      'schedule_coordination',
      'emergency_response',
      'documentation',
      'parent_communication'
    ]
  }],
  permissions: {
    canManageRoutes: { type: Boolean, default: true },
    canAssignDrivers: { type: Boolean, default: false },
    canManageVehicles: { type: Boolean, default: false },
    canCollectFees: { type: Boolean, default: true },
    canGenerateReports: { type: Boolean, default: true }
  },
  certifications: [{
    name: {
      type: String,
      enum: ['Defensive_Driving', 'First_Aid', 'Vehicle_Maintenance', 'Safety_Training', 'Other']
    },
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
      da: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      fuel: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 }
    },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash'],
      default: 'bank_transfer'
    }
  },
  workingHours: {
    morningShift: {
      start: { type: String, default: '06:30' },
      end: { type: String, default: '09:30' }
    },
    afternoonShift: {
      start: { type: String, default: '14:00' },
      end: { type: String, default: '17:00' }
    },
    workingDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }
  },
  performance: {
    onTimePerformance: { type: Number, default: 100 }, // percentage
    safetyRecord: {
      accidentFree: { type: Boolean, default: true },
      lastAccidentDate: Date,
      totalAccidents: { type: Number, default: 0 }
    },
    studentsTransported: { type: Number, default: 0 },
    fuelEfficiency: Number, // km per liter
    rating: { type: Number, min: 1, max: 5 },
    lastReviewDate: Date,
    achievements: [String]
  },
  healthInfo: {
    medicalCertificate: {
      issueDate: Date,
      expiryDate: Date,
      issuingAuthority: String
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    emergencyMedicalInfo: String
  },
  emergencyContact: {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true }
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'medical_certificate', 'police_verification', 'experience_certificate', 'photo', 'other'],
      required: true
    },
    fileName: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now },
    expiryDate: Date
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'suspended', 'terminated'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
transportManagerSchema.index({ school: 1, employeeId: 1 });
transportManagerSchema.index({ school: 1, 'assignedRoutes.route': 1 });
transportManagerSchema.index({ 'personalInfo.licenseExpiry': 1 });

// Virtual for full name
transportManagerSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Virtual to check if license is expiring soon (within 30 days)
transportManagerSchema.virtual('isLicenseExpiringSoon').get(function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.personalInfo.licenseExpiry <= thirtyDaysFromNow;
});

export default mongoose.model('TransportManager', transportManagerSchema);
