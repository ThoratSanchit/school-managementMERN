import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: [true, 'Please add attendance date'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'medical_leave', 'authorized_leave'],
    required: [true, 'Please specify attendance status']
  },
  timeIn: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time format should be HH:MM']
  },
  timeOut: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time format should be HH:MM']
  },
  markedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher',
    required: true
  },
  remarks: String,
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
attendanceSchema.index({ school: 1, student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ school: 1, class: 1, section: 1, date: 1 });
attendanceSchema.index({ school: 1, academicYear: 1, month: 1 });

// Ensure month/year are set before validation
attendanceSchema.pre('validate', function(next) {
  if (this.date) {
    this.month = this.month || (this.date.getMonth() + 1);
    this.year = this.year || this.date.getFullYear();
  }
  next();
});

export default mongoose.model('Attendance', attendanceSchema);
