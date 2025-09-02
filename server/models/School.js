import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add school name'],
    trim: true,
    maxlength: [100, 'School name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add school code'],
    unique: true,
    uppercase: true,
    maxlength: [10, 'School code cannot be more than 10 characters']
  },
  type: {
    type: String,
    enum: ['primary', 'secondary', 'higher_secondary', 'college', 'university', 'coaching_center'],
    required: [true, 'Please specify school type']
  },
  board: {
    type: String,
    enum: ['CBSE', 'ICSE', 'State_Board', 'IB', 'Cambridge', 'Other'],
    required: [true, 'Please specify education board']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String,
    fax: String
  },
  principal: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  establishedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  logo: {
    type: String,
    default: 'no-logo.jpg'
  },
  settings: {
    academicYear: {
      startMonth: { type: Number, default: 4 }, // April
      endMonth: { type: Number, default: 3 }    // March
    },
    workingDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    timings: {
      schoolStart: { type: String, default: '08:00' },
      schoolEnd: { type: String, default: '15:00' },
      periodDuration: { type: Number, default: 45 }, // minutes
      breakDuration: { type: Number, default: 15 }   // minutes
    },
    grading: {
      system: {
        type: String,
        enum: ['percentage', 'gpa', 'cgpa', 'letter_grade'],
        default: 'percentage'
      },
      passingMarks: { type: Number, default: 35 },
      maxMarks: { type: Number, default: 100 }
    },
    fees: {
      currency: { type: String, default: 'INR' },
      lateFeePercentage: { type: Number, default: 5 },
      installments: { type: Number, default: 4 }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxStudents: { type: Number, default: 100 },
    maxTeachers: { type: Number, default: 10 },
    features: [{
      type: String,
      enum: ['attendance', 'grades', 'fees', 'library', 'transport', 'hr', 'analytics', 'mobile_app']
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create index for geospatial queries
schoolSchema.index({ 'address.coordinates': '2dsphere' });

export default mongoose.model('School', schoolSchema);
