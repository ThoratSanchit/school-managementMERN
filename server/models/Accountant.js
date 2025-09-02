import mongoose from 'mongoose';

const accountantSchema = new mongoose.Schema({
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
    nationality: {
      type: String,
      default: 'Indian'
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
      enum: ['Chief_Accountant', 'Senior_Accountant', 'Junior_Accountant', 'Accounts_Assistant', 'Finance_Manager'],
      default: 'Accountant'
    },
    department: {
      type: String,
      enum: ['Finance', 'Accounts', 'Administration'],
      default: 'Accounts'
    },
    joiningDate: {
      type: Date,
      required: [true, 'Please add joining date']
    },
    experience: {
      type: Number,
      required: [true, 'Please add experience in years']
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'temporary', 'contract'],
      default: 'permanent'
    }
  },
  qualifications: [{
    degree: {
      type: String,
      required: true,
      enum: ['B.Com', 'M.Com', 'BBA', 'MBA', 'CA', 'CS', 'CMA', 'Other']
    },
    subject: String,
    university: String,
    year: Number,
    percentage: Number
  }],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date
  }],
  responsibilities: [{
    type: String,
    enum: [
      'fee_collection',
      'salary_processing',
      'expense_management',
      'budget_planning',
      'financial_reporting',
      'tax_compliance',
      'audit_support',
      'vendor_payments',
      'bank_reconciliation',
      'petty_cash_management'
    ]
  }],
  permissions: {
    canCollectFees: { type: Boolean, default: true },
    canProcessSalaries: { type: Boolean, default: false },
    canMakePayments: { type: Boolean, default: false },
    canGenerateReports: { type: Boolean, default: true },
    canManageBudget: { type: Boolean, default: false },
    canAccessBankAccounts: { type: Boolean, default: false },
    maxTransactionLimit: { type: Number, default: 10000 }
  },
  salaryInfo: {
    basicSalary: {
      type: Number,
      required: [true, 'Please add basic salary']
    },
    allowances: {
      da: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      ta: { type: Number, default: 0 },
      professional: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'cheque'],
      default: 'bank_transfer'
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String
    }
  },
  workingHours: {
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    lunchBreak: {
      start: { type: String, default: '13:00' },
      end: { type: String, default: '14:00' }
    },
    workingDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }
  },
  performance: {
    feesCollected: { type: Number, default: 0 },
    reportsGenerated: { type: Number, default: 0 },
    accuracy: { type: Number, default: 100 }, // percentage
    rating: { type: Number, min: 1, max: 5 },
    lastReviewDate: Date,
    achievements: [String]
  },
  emergencyContact: {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
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
accountantSchema.index({ school: 1, employeeId: 1 });
accountantSchema.index({ school: 1, 'professionalInfo.department': 1 });

// Virtual for full name
accountantSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Virtual for gross salary
accountantSchema.virtual('grossSalary').get(function() {
  const allowances = this.salaryInfo.allowances;
  return this.salaryInfo.basicSalary + allowances.da + allowances.hra + allowances.ta + allowances.professional + allowances.other;
});

export default mongoose.model('Accountant', accountantSchema);
