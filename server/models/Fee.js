import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: [true, 'Please add academic year'],
    match: [/^\d{4}-\d{4}$/, 'Academic year format should be YYYY-YYYY']
  },
  feeStructure: {
    tuitionFee: { type: Number, required: true },
    admissionFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    libraryFee: { type: Number, default: 0 },
    labFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    sportsFee: { type: Number, default: 0 },
    developmentFee: { type: Number, default: 0 },
    miscellaneousFee: { type: Number, default: 0 }
  },
  discounts: {
    scholarshipPercentage: { type: Number, default: 0, min: 0, max: 100 },
    siblingDiscount: { type: Number, default: 0 },
    staffWardDiscount: { type: Number, default: 0 },
    otherDiscount: { type: Number, default: 0 },
    discountReason: String
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    required: true
  },
  installments: [{
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partial'],
      default: 'pending'
    },
    paidAmount: { type: Number, default: 0 },
    paidDate: Date,
    lateFee: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'online', 'bank_transfer', 'card']
    },
    transactionId: String,
    receiptNumber: String
  }],
  payments: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'online', 'bank_transfer', 'card'],
      required: true
    },
    transactionId: String,
    receiptNumber: { type: String, required: true },
    collectedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    bankDetails: {
      bankName: String,
      chequeNumber: String,
      chequeDate: Date
    },
    remarks: String
  }],
  lateFees: {
    totalLateFee: { type: Number, default: 0 },
    lateFeePercentage: { type: Number, default: 5 },
    gracePeriodDays: { type: Number, default: 7 }
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'waived'],
    default: 'pending'
  },
  remarks: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
feeSchema.index({ school: 1, student: 1, academicYear: 1 });
feeSchema.index({ school: 1, status: 1 });
feeSchema.index({ 'installments.dueDate': 1 });

// Pre-save middleware to calculate totals
feeSchema.pre('save', function(next) {
  // Calculate total fee amount
  const fees = this.feeStructure;
  const grossAmount = fees.tuitionFee + fees.admissionFee + fees.examFee + 
                     fees.libraryFee + fees.labFee + fees.transportFee + 
                     fees.sportsFee + fees.developmentFee + fees.miscellaneousFee;
  
  // Calculate total discount
  const totalDiscount = this.discounts.scholarshipPercentage > 0 
    ? (grossAmount * this.discounts.scholarshipPercentage / 100) 
    : 0;
  
  const otherDiscounts = this.discounts.siblingDiscount + 
                        this.discounts.staffWardDiscount + 
                        this.discounts.otherDiscount;
  
  this.totalAmount = grossAmount - totalDiscount - otherDiscounts + this.lateFees.totalLateFee;
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount === 0) {
    this.status = 'pending';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  
  next();
});

// Virtual for discount amount
feeSchema.virtual('totalDiscountAmount').get(function() {
  const fees = this.feeStructure;
  const grossAmount = fees.tuitionFee + fees.admissionFee + fees.examFee + 
                     fees.libraryFee + fees.labFee + fees.transportFee + 
                     fees.sportsFee + fees.developmentFee + fees.miscellaneousFee;
  
  const scholarshipDiscount = this.discounts.scholarshipPercentage > 0 
    ? (grossAmount * this.discounts.scholarshipPercentage / 100) 
    : 0;
  
  return scholarshipDiscount + this.discounts.siblingDiscount + 
         this.discounts.staffWardDiscount + this.discounts.otherDiscount;
});

export default mongoose.model('Fee', feeSchema);
