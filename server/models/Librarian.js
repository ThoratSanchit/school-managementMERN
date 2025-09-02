import mongoose from 'mongoose';

const librarianSchema = new mongoose.Schema({
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
      enum: ['Head_Librarian', 'Assistant_Librarian', 'Library_Assistant'],
      default: 'Librarian'
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
    },
    workingHours: {
      type: String,
      enum: ['full_time', 'part_time'],
      default: 'full_time'
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning'
    }
  },
  qualifications: [{
    degree: {
      type: String,
      required: true,
      enum: ['B.Lib', 'M.Lib', 'B.A', 'M.A', 'B.Sc', 'M.Sc', 'Diploma', 'Certificate', 'Other']
    },
    subject: String,
    university: String,
    year: Number,
    percentage: Number
  }],
  responsibilities: [{
    type: String,
    enum: [
      'book_management',
      'student_services',
      'digital_resources',
      'cataloging',
      'circulation',
      'reference_services',
      'library_events',
      'inventory_management',
      'fine_collection',
      'reading_programs'
    ]
  }],
  permissions: {
    canIssueBooks: { type: Boolean, default: true },
    canCollectFines: { type: Boolean, default: true },
    canAddBooks: { type: Boolean, default: false },
    canDeleteBooks: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false },
    canGenerateReports: { type: Boolean, default: false }
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
      other: { type: Number, default: 0 }
    },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash'],
      default: 'bank_transfer'
    }
  },
  performance: {
    booksProcessed: { type: Number, default: 0 },
    studentsServed: { type: Number, default: 0 },
    eventsOrganized: { type: Number, default: 0 },
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
librarianSchema.index({ school: 1, employeeId: 1 });
librarianSchema.index({ school: 1, status: 1 });

// Virtual for full name
librarianSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

export default mongoose.model('Librarian', librarianSchema);
