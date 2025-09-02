import express from 'express';
import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/fees - list fees with filters
router.get('/', protect, authorize('admin', 'accountant'), async (req, res, next) => {
  try {
    const { page = 1, limit = 25, student, class: classId, status, academicYear } = req.query;
    const query = { school: req.user.school };
    if (student) query.student = student;
    if (classId) query.class = classId;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query)
      .populate({ path: 'student', select: 'studentId user', populate: { path: 'user', select: 'firstName lastName' }})
      .populate('class', 'name level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Fee.countDocuments(query);

    res.status(200).json({
      success: true,
      count: fees.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: fees
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/fees - create fee record
router.post('/', protect, authorize('admin', 'accountant'), async (req, res, next) => {
  try {
    // Validate refs
    const errors = [];
    if (!mongoose.Types.ObjectId.isValid(req.body.student)) errors.push('Invalid student id');
    if (req.body.class && !mongoose.Types.ObjectId.isValid(req.body.class)) errors.push('Invalid class id');
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });

    const [studentOk, classOk] = await Promise.all([
      Student.exists({ _id: req.body.student, school: req.user.school }),
      req.body.class ? Class.exists({ _id: req.body.class, school: req.user.school }) : Promise.resolve(true)
    ]);
    if (!studentOk) return res.status(400).json({ success: false, message: 'Student not found in this school' });
    if (!classOk) return res.status(400).json({ success: false, message: 'Class not found in this school' });

    const payload = { ...req.body, school: req.user.school };
    const fee = await Fee.create(payload);
    const populated = await Fee.findById(fee._id)
      .populate({ path: 'student', select: 'studentId user', populate: { path: 'user', select: 'firstName lastName' }})
      .populate('class', 'name level');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/:id
router.get('/:id', protect, authorize('admin', 'accountant'), async (req, res, next) => {
  try {
    const fee = await Fee.findOne({ _id: req.params.id, school: req.user.school })
      .populate({ path: 'student', select: 'studentId user', populate: { path: 'user', select: 'firstName lastName' }})
      .populate('class', 'name level');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
    res.status(200).json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
});

// PUT /api/fees/:id - update fee (structure/discounts/remarks etc.)
router.put('/:id', protect, authorize('admin', 'accountant'), async (req, res, next) => {
  try {
    const fee = await Fee.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school },
      req.body,
      { new: true, runValidators: true }
    )
    .populate({ path: 'student', select: 'studentId user', populate: { path: 'user', select: 'firstName lastName' }})
    .populate('class', 'name level');

    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
    // Ensure pre-save-like recalculation in case $set bypassed pre('save')
    await fee.save();
    res.status(200).json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/fees/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const fee = await Fee.findOneAndDelete({ _id: req.params.id, school: req.user.school });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
    res.status(200).json({ success: true, message: 'Fee deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/fees/:id/pay - record a payment
router.post('/:id/pay', protect, authorize('admin', 'accountant'), async (req, res, next) => {
  try {
    const { amount, paymentMethod, transactionId, receiptNumber, bankDetails, remarks, installmentNumber } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const fee = await Fee.findOne({ _id: req.params.id, school: req.user.school });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });

    // Add payment record
    fee.payments.push({
      amount,
      paymentMethod,
      transactionId,
      receiptNumber: receiptNumber || `REC-${Date.now()}`,
      collectedBy: req.user._id,
      bankDetails,
      remarks
    });

    // Update paid/due and status
    fee.paidAmount = (fee.paidAmount || 0) + amount;
    fee.dueAmount = Math.max(0, fee.totalAmount - fee.paidAmount);
    if (fee.paidAmount >= fee.totalAmount) fee.status = 'paid';
    else if (fee.paidAmount > 0) fee.status = 'partial';

    // Optionally mark an installment
    if (installmentNumber) {
      const inst = fee.installments.find(i => i.installmentNumber === Number(installmentNumber));
      if (inst) {
        inst.paidAmount = (inst.paidAmount || 0) + amount;
        inst.paidDate = new Date();
        if (inst.paidAmount >= inst.amount) inst.status = 'paid';
        else if (inst.paidAmount > 0) inst.status = 'partial';
      }
    }

    await fee.save();

    const populated = await Fee.findById(fee._id)
      .populate({ path: 'student', select: 'studentId user', populate: { path: 'user', select: 'firstName lastName' }})
      .populate('class', 'name level');

    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/student/:studentId - student fee summary
router.get('/student/:studentId', protect, authorize('admin', 'accountant', 'teacher', 'student', 'parent'), async (req, res, next) => {
  try {
    const { academicYear } = req.query;

    // If student is accessing, ensure it's their own record
    if (req.user.role === 'student') {
      const student = await Student.findById(req.params.studentId);
      if (!student || student.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this record' });
      }
    }

    const query = { school: req.user.school, student: req.params.studentId };
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query).sort({ createdAt: -1 });

    const summary = fees.reduce((acc, f) => {
      acc.totalBilled += f.totalAmount || 0;
      acc.totalPaid += f.paidAmount || 0;
      acc.totalDue += f.dueAmount || 0;
      return acc;
    }, { totalBilled: 0, totalPaid: 0, totalDue: 0 });

    res.status(200).json({ success: true, data: { fees, summary } });
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/summary - finance dashboard summary
router.get('/summary/dashboard', protect, authorize('admin', 'accountant'), async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const match = { school: req.user.school };
    if (academicYear) match.academicYear = academicYear;

    const byStatus = await Fee.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, totalDue: { $sum: '$dueAmount' }, totalPaid: { $sum: '$paidAmount' }, totalAmount: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]);

    const monthly = await Fee.aggregate([
      { $match: match },
      { $unwind: { path: '$payments', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { month: { $month: { $ifNull: ['$payments.paymentDate', '$createdAt'] } }, year: { $year: { $ifNull: ['$payments.paymentDate', '$createdAt'] } } },
                  amount: { $sum: { $ifNull: ['$payments.amount', 0] } } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({ success: true, data: { byStatus, monthly } });
  } catch (err) {
    next(err);
  }
});

export default router;
