import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add subject name'],
    trim: true,
    maxlength: [100, 'Subject name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add subject code'],
    uppercase: true,
    maxlength: [10, 'Subject code cannot be more than 10 characters']
  },
  type: {
    type: String,
    enum: ['core', 'elective', 'optional', 'extra_curricular'],
    default: 'core'
  },
  category: {
    type: String,
    enum: ['theory', 'practical', 'both'],
    default: 'theory'
  },
  department: {
    type: String,
    enum: ['Mathematics', 'Science', 'English', 'Hindi', 'Social_Studies', 'Computer_Science', 'Physical_Education', 'Arts', 'Music', 'Other'],
    required: true
  },
  classes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Class'
  }],
  teachers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Teacher'
  }],
  syllabus: {
    description: String,
    topics: [String],
    books: [{
      title: String,
      author: String,
      publisher: String,
      isbn: String
    }],
    references: [String]
  },
  assessment: {
    theoryMarks: { type: Number, default: 80 },
    practicalMarks: { type: Number, default: 20 },
    internalMarks: { type: Number, default: 20 },
    externalMarks: { type: Number, default: 80 },
    passingMarks: { type: Number, default: 35 }
  },
  periodsPerWeek: {
    type: Number,
    required: [true, 'Please add periods per week'],
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
subjectSchema.index({ school: 1, code: 1 }, { unique: true });
subjectSchema.index({ school: 1, department: 1 });

export default mongoose.model('Subject', subjectSchema);
