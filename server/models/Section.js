import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  class: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add section name'],
    trim: true,
    maxlength: [10, 'Section name cannot be more than 10 characters']
  },
  sectionTeacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher'
  },
  students: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Student'
  }],
  maxStudents: {
    type: Number,
    default: 40
  },
  currentStrength: {
    type: Number,
    default: 0
  },
  classroom: {
    roomNumber: String,
    floor: String,
    building: String,
    capacity: Number
  },
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
sectionSchema.index({ school: 1, class: 1, name: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('Section', sectionSchema);
