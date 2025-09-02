import express from 'express';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Admin, Teacher)
router.get('/', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { academicYear, level, stream } = req.query;

    const query = { school: req.user.school };
    if (academicYear) query.academicYear = academicYear;
    if (level) query.level = level;
    if (stream) query.stream = stream;

    const classes = await Class.find(query)
      .populate('sections', 'name currentStrength')
      .populate('subjects', 'name code')
      .populate('classTeacher', 'user')
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ level: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private (Admin, Teacher)
router.get('/:id', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('sections')
      .populate('subjects', 'name code department')
      .populate('classTeacher', 'user professionalInfo.department')
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Validate references if provided
    const errors = [];

    if (req.body.classTeacher) {
      if (!mongoose.Types.ObjectId.isValid(req.body.classTeacher)) {
        errors.push('Invalid class teacher id');
      } else {
        const teacher = await Teacher.findOne({ _id: req.body.classTeacher, school: req.user.school });
        if (!teacher) errors.push('Class teacher not found in this school');
      }
    }

    if (Array.isArray(req.body.subjects) && req.body.subjects.length) {
      const invalidSubjectIds = req.body.subjects.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidSubjectIds.length) errors.push('Invalid subject id(s)');
      const count = await Subject.countDocuments({ _id: { $in: req.body.subjects }, school: req.user.school });
      if (count !== req.body.subjects.length) errors.push('Some subjects not found in this school');
    }

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const classData = await Class.create({
      ...req.body,
      school: req.user.school
    });

    const populatedClass = await Class.findById(classData._id)
      .populate('subjects', 'name code')
      .populate('classTeacher', 'user');

    res.status(201).json({
      success: true,
      data: populatedClass
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Validate references if provided
    const errors = [];
    if (req.body.classTeacher) {
      if (!mongoose.Types.ObjectId.isValid(req.body.classTeacher)) {
        errors.push('Invalid class teacher id');
      } else {
        const teacher = await Teacher.findOne({ _id: req.body.classTeacher, school: req.user.school });
        if (!teacher) errors.push('Class teacher not found in this school');
      }
    }
    if (Array.isArray(req.body.subjects) && req.body.subjects.length) {
      const invalidSubjectIds = req.body.subjects.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidSubjectIds.length) errors.push('Invalid subject id(s)');
      const count = await Subject.countDocuments({ _id: { $in: req.body.subjects }, school: req.user.school });
      if (count !== req.body.subjects.length) errors.push('Some subjects not found in this school');
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subjects', 'name code')
     .populate('classTeacher', 'user');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Delete associated sections
    await Section.deleteMany({ class: req.params.id });

    await Class.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Additional section routes under a class
// @desc    Create section for a class
// @route   POST /api/classes/:id/sections
// @access  Private (Admin)
router.post('/:id/sections', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, academicYear, sectionTeacher, maxStudents } = req.body;

    // Basic validation
    if (!name) return res.status(400).json({ success: false, message: 'Please add section name' });
    if (!academicYear) return res.status(400).json({ success: false, message: 'Please add academic year' });

    const classDoc = await Class.findOne({ _id: req.params.id, school: req.user.school });
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });

    if (sectionTeacher) {
      if (!mongoose.Types.ObjectId.isValid(sectionTeacher)) {
        return res.status(400).json({ success: false, message: 'Invalid section teacher id' });
      }
      const teacher = await Teacher.findOne({ _id: sectionTeacher, school: req.user.school });
      if (!teacher) return res.status(400).json({ success: false, message: 'Section teacher not found in this school' });
    }

    const section = await Section.create({
      school: req.user.school,
      class: classDoc._id,
      name,
      academicYear,
      sectionTeacher: sectionTeacher || undefined,
      maxStudents: maxStudents || undefined
    });

    // Attach to class
    await Class.findByIdAndUpdate(classDoc._id, { $addToSet: { sections: section._id } });

    const populated = await Section.findById(section._id)
      .populate('class', 'name level')
      .populate('sectionTeacher', 'user')
      .populate({ path: 'sectionTeacher', populate: { path: 'user', select: 'firstName lastName' } });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
});

// @desc    List sections for a class
// @route   GET /api/classes/:id/sections
// @access  Private (Admin, Teacher)
router.get('/:id/sections', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const classDoc = await Class.findOne({ _id: req.params.id, school: req.user.school });
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });

    const sections = await Section.find({ class: classDoc._id, school: req.user.school })
      .populate('sectionTeacher', 'user')
      .populate({ path: 'sectionTeacher', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ name: 1 });

    res.status(200).json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    next(error);
  }
});

export default router;
