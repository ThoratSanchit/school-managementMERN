import express from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Grade from '../models/Grade.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Admin, Teacher)
router.get('/', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { academicYear, type, status, classId } = req.query;

    const query = { school: req.user.school };
    if (academicYear) query.academicYear = academicYear;
    if (type) query.type = type;
    if (status) query.status = status;
    if (classId) query.classes = { $in: [classId] };

    const exams = await Exam.find(query)
      .populate('classes', 'name level')
      .populate('subjects.subject', 'name code')
      .populate('subjects.examiner', 'user')
      .populate({
        path: 'subjects.examiner',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private (Admin, Teacher)
router.get('/:id', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('classes', 'name level currentStrength')
      .populate('subjects.subject', 'name code department')
      .populate('subjects.examiner', 'user professionalInfo.department')
      .populate({
        path: 'subjects.examiner',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('createdBy', 'firstName lastName email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Validate references
    const errors = [];
    if (Array.isArray(req.body.classes) && req.body.classes.length) {
      const invalid = req.body.classes.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalid.length) errors.push('Invalid class id(s)');
      const count = await Class.countDocuments({ _id: { $in: req.body.classes }, school: req.user.school });
      if (count !== req.body.classes.length) errors.push('Some classes not found in this school');
    }
    if (Array.isArray(req.body.subjects) && req.body.subjects.length) {
      for (const s of req.body.subjects) {
        if (!s.subject || !mongoose.Types.ObjectId.isValid(s.subject)) errors.push('Invalid subject id');
        else {
          const ok = await Subject.exists({ _id: s.subject, school: req.user.school });
          if (!ok) errors.push('Subject not found in this school');
        }
        if (s.examiner) {
          if (!mongoose.Types.ObjectId.isValid(s.examiner)) errors.push('Invalid examiner id');
          else {
            const ok = await Teacher.exists({ _id: s.examiner, school: req.user.school });
            if (!ok) errors.push('Examiner not found in this school');
          }
        }
      }
    }
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });

    const exam = await Exam.create({
      ...req.body,
      school: req.user.school,
      createdBy: req.user.id
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate('classes', 'name level')
      .populate('subjects.subject', 'name code')
      .populate('subjects.examiner', 'user');

    res.status(201).json({
      success: true,
      data: populatedExam
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Validate references if provided
    const errors = [];
    if (Array.isArray(req.body.classes) && req.body.classes.length) {
      const invalid = req.body.classes.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalid.length) errors.push('Invalid class id(s)');
      const count = await Class.countDocuments({ _id: { $in: req.body.classes }, school: req.user.school });
      if (count !== req.body.classes.length) errors.push('Some classes not found in this school');
    }
    if (Array.isArray(req.body.subjects) && req.body.subjects.length) {
      for (const s of req.body.subjects) {
        if (s.subject && !mongoose.Types.ObjectId.isValid(s.subject)) errors.push('Invalid subject id');
        if (s.subject) {
          const ok = await Subject.exists({ _id: s.subject, school: req.user.school });
          if (!ok) errors.push('Subject not found in this school');
        }
        if (s.examiner) {
          if (!mongoose.Types.ObjectId.isValid(s.examiner)) errors.push('Invalid examiner id');
          else {
            const ok = await Teacher.exists({ _id: s.examiner, school: req.user.school });
            if (!ok) errors.push('Examiner not found in this school');
          }
        }
      }
    }
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('classes', 'name level')
     .populate('subjects.subject', 'name code');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Delete associated grades
    await Grade.deleteMany({ exam: req.params.id });

    await Exam.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get exam results
// @route   GET /api/exams/:id/results
// @access  Private (Admin, Teacher)
router.get('/:id/results', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { classId, sectionId } = req.query;

    const query = { exam: req.params.id, school: req.user.school };
    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;

    const results = await Grade.find(query)
      .populate('student', 'studentId user')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('subject', 'name code')
      .populate('class', 'name level')
      .populate('section', 'name')
      .sort({ 'student.user.firstName': 1 });

    // Group results by student
    const studentResults = {};
    results.forEach(grade => {
      const studentId = grade.student._id.toString();
      if (!studentResults[studentId]) {
        studentResults[studentId] = {
          student: grade.student,
          class: grade.class,
          section: grade.section,
          subjects: [],
          totalMarks: 0,
          obtainedMarks: 0,
          percentage: 0,
          status: 'pass'
        };
      }

      studentResults[studentId].subjects.push({
        subject: grade.subject,
        marks: grade.marks,
        grade: grade.grade
      });

      studentResults[studentId].totalMarks += grade.marks.total;
      studentResults[studentId].obtainedMarks += grade.marks.obtained;

      if (grade.grade.status === 'fail') {
        studentResults[studentId].status = 'fail';
      }
    });

    // Calculate percentages
    Object.values(studentResults).forEach(result => {
      result.percentage = result.totalMarks > 0 
        ? Math.round((result.obtainedMarks / result.totalMarks) * 100 * 100) / 100 
        : 0;
    });

    res.status(200).json({
      success: true,
      data: Object.values(studentResults)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
