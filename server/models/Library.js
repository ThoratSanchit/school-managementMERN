import mongoose from 'mongoose';

const librarySchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.ObjectId,
    ref: 'School',
    required: true
  },
  book: {
    title: {
      type: String,
      required: [true, 'Please add book title'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Please add author name']
    },
    isbn: {
      type: String,
      unique: true,
      match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
    },
    publisher: String,
    publicationYear: Number,
    edition: String,
    language: {
      type: String,
      enum: ['English', 'Hindi', 'Regional', 'Other'],
      default: 'English'
    },
    category: {
      type: String,
      enum: ['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Biography', 'Science', 'History', 'Geography', 'Mathematics', 'Literature', 'Other'],
      required: true
    },
    subject: String,
    class: String,
    description: String,
    pages: Number,
    price: Number,
    location: {
      shelf: String,
      rack: String,
      floor: String
    }
  },
  inventory: {
    totalCopies: {
      type: Number,
      required: [true, 'Please add total copies'],
      min: 1
    },
    availableCopies: {
      type: Number,
      required: true
    },
    issuedCopies: {
      type: Number,
      default: 0
    },
    damagedCopies: {
      type: Number,
      default: 0
    },
    lostCopies: {
      type: Number,
      default: 0
    }
  },
  acquisitionInfo: {
    acquisitionDate: {
      type: Date,
      default: Date.now
    },
    acquisitionType: {
      type: String,
      enum: ['purchase', 'donation', 'exchange', 'gift'],
      default: 'purchase'
    },
    vendor: String,
    billNumber: String,
    cost: Number
  },
  issueHistory: [{
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'Student'
    },
    teacher: {
      type: mongoose.Schema.ObjectId,
      ref: 'Teacher'
    },
    issueDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnDate: Date,
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue', 'lost', 'damaged'],
      default: 'issued'
    },
    fine: {
      type: Number,
      default: 0
    },
    issuedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Librarian',
      required: true
    },
    returnedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Librarian'
    },
    remarks: String
  }],
  digitalInfo: {
    hasEbook: { type: Boolean, default: false },
    ebookUrl: String,
    hasAudiobook: { type: Boolean, default: false },
    audiobookUrl: String,
    digitalAccess: {
      type: String,
      enum: ['free', 'subscription', 'purchase'],
      default: 'free'
    }
  },
  popularity: {
    totalIssues: { type: Number, default: 0 },
    currentlyIssued: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    reviews: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      date: { type: Date, default: Date.now }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'damaged', 'lost', 'under_repair'],
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
librarySchema.index({ school: 1, 'book.isbn': 1 });
librarySchema.index({ school: 1, 'book.category': 1 });
librarySchema.index({ school: 1, 'book.title': 'text', 'book.author': 'text' });

// Pre-save middleware to update available copies
librarySchema.pre('save', function(next) {
  this.inventory.availableCopies = this.inventory.totalCopies - 
                                  this.inventory.issuedCopies - 
                                  this.inventory.damagedCopies - 
                                  this.inventory.lostCopies;
  next();
});

export default mongoose.model('Library', librarySchema);
