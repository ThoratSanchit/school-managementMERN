import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add class name'],
    trim: true,
    maxlength: [50, 'Class name cannot be more than 50 characters']
  },
  level: {
    type: String,
    required: [true, 'Please add class level'],
    enum: ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  sections: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Section'
  }],
  subjects: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Subject'
  }],
  classTeacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher'
  },
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  maxStudents: {
    type: Number,
    default: 40
  },
  currentStrength: {
    type: Number,
    default: 0
  },
  stream: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'Vocational'],
    required: function() {
      return ['11', '12'].includes(this.level);
    }
  },
  board: {
    type: String,
    enum: ['CBSE', 'ICSE', 'State_Board', 'IB', 'Cambridge'],
    required: true
  },
  medium: {
    type: String,
    enum: ['English', 'Hindi', 'Regional'],
    default: 'English'
  },
  fees: {
    tuitionFee: { type: Number, required: true },
    admissionFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    libraryFee: { type: Number, default: 0 },
    labFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    otherFees: { type: Number, default: 0 }
  },
  timetable: {
    periodsPerDay: { type: Number, default: 7 },
    periodDuration: { type: Number, default: 45 }, // minutes
    breakTime: {
      start: { type: String, default: '11:00' },
      end: { type: String, default: '11:15' }
    },
    lunchTime: {
      start: { type: String, default: '13:00' },
      end: { type: String, default: '13:45' }
    }
  },
  examSchedule: [{
    examType: {
      type: String,
      enum: ['unit_test', 'mid_term', 'final_term', 'annual']
    },
    startDate: Date,
    endDate: Date,
    subjects: [{
      subject: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subject'
      },
      date: Date,
      time: String,
      duration: Number, // minutes
      maxMarks: Number
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  remarks: String
}, {
  timestamps: true
});

// Indexes
classSchema.index({ school: 1, level: 1, academicYear: 1 });
classSchema.index({ school: 1, classTeacher: 1 });

// Virtual for total fees
classSchema.virtual('totalFees').get(function() {
  const fees = this.fees;
  return fees.tuitionFee + fees.admissionFee + fees.examFee + fees.libraryFee + fees.labFee + fees.transportFee + fees.otherFees;
});

export default mongoose.model('Class', classSchema);
