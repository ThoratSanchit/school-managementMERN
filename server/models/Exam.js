import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add exam name'],
    trim: true,
    maxlength: [100, 'Exam name cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['unit_test', 'quarterly', 'half_yearly', 'annual', 'entrance', 'competitive', 'internal', 'board_exam'],
    required: [true, 'Please specify exam type']
  },
  classes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Class'
  }],
  subjects: [{
    subject: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time format should be HH:MM']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time format should be HH:MM']
    },
    duration: {
      type: Number,
      required: true // in minutes
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },
    passingMarks: {
      type: Number,
      required: true,
      min: 1
    },
    examiner: {
      type: mongoose.Schema.ObjectId,
      ref: 'Teacher'
    },
    room: String,
    instructions: String
  }],
  startDate: {
    type: Date,
    required: [true, 'Please add exam start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add exam end date']
  },
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  resultPublishDate: Date,
  instructions: [String],
  gradingSystem: {
    type: String,
    enum: ['percentage', 'gpa', 'cgpa', 'letter_grade'],
    default: 'percentage'
  },
  gradeScale: [{
    grade: String,
    minMarks: Number,
    maxMarks: Number,
    points: Number
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
examSchema.index({ school: 1, academicYear: 1, type: 1 });
examSchema.index({ school: 1, startDate: 1, endDate: 1 });

// Validation: End date should be after start date
examSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

export default mongoose.model('Exam', examSchema);
