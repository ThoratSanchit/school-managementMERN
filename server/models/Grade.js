import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'Student',
    required: true
  },
  exam: {
    type: mongoose.Schema.ObjectId,
    ref: 'Exam',
    required: true
  },
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: mongoose.Schema.ObjectId,
    ref: 'Section',
    required: true
  },
  marks: {
    obtained: {
      type: Number,
      required: [true, 'Please add obtained marks'],
      min: 0
    },
    total: {
      type: Number,
      required: [true, 'Please add total marks'],
      min: 1
    },
    practical: {
      obtained: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    internal: {
      obtained: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },
  grade: {
    letter: String, // A+, A, B+, B, etc.
    points: Number,  // GPA points
    percentage: Number,
    status: {
      type: String,
      enum: ['pass', 'fail', 'absent', 'exempted'],
      default: 'pass'
    }
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher',
    required: true
  },
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  remarks: String,
  entryDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
gradeSchema.index({ school: 1, student: 1, exam: 1, subject: 1 }, { unique: true });
gradeSchema.index({ school: 1, class: 1, section: 1, exam: 1 });
gradeSchema.index({ school: 1, academicYear: 1 });

// Pre-save middleware to calculate percentage and determine pass/fail
gradeSchema.pre('save', function(next) {
  // Calculate total marks including practical and internal
  const totalObtained = this.marks.obtained + this.marks.practical.obtained + this.marks.internal.obtained;
  const totalMarks = this.marks.total + this.marks.practical.total + this.marks.internal.total;
  
  // Calculate percentage
  this.grade.percentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100 * 100) / 100 : 0;
  
  // Determine pass/fail status (assuming 35% is passing)
  if (this.grade.status !== 'absent' && this.grade.status !== 'exempted') {
    this.grade.status = this.grade.percentage >= 35 ? 'pass' : 'fail';
  }
  
  next();
});

export default mongoose.model('Grade', gradeSchema);
