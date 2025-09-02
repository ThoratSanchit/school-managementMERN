import express from 'express';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin, Teacher)
router.get('/', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      designation,
      status = 'active',
      search
    } = req.query;

    const query = { school: req.user.school };
    
    if (department) query['professionalInfo.department'] = department;
    if (designation) query['professionalInfo.designation'] = designation;
    if (status) query.status = status;

    let userQuery = {};
    if (search) {
      userQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const teachers = await Teacher.find(query)
      .populate({
        path: 'user',
        match: userQuery,
        select: 'firstName lastName email phone avatar'
      })
      .populate('professionalInfo.subjects', 'name code')
      .populate('professionalInfo.classes.class', 'name level')
      .populate('professionalInfo.classes.section', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const filteredTeachers = teachers.filter(teacher => teacher.user);
    const total = await Teacher.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filteredTeachers.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: filteredTeachers
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private (Admin, Teacher - own record)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'firstName lastName email phone avatar')
      .populate('professionalInfo.subjects', 'name code department')
      .populate('professionalInfo.classes.class', 'name level')
      .populate('professionalInfo.classes.section', 'name')
      .populate('school', 'name code');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check authorization
    if (req.user.role === 'teacher' && teacher.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this teacher record'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  const mongoose = (await import('mongoose')).default;

  const createWithoutTransaction = async () => {
    let createdUserId;
    try {
      const { userData, teacherData } = req.body;

      const userDoc = await User.create({
        ...userData,
        role: 'teacher',
        school: req.user.school
      });
      createdUserId = userDoc._id;

      const teacherDoc = await Teacher.create({
        ...teacherData,
        user: createdUserId,
        school: req.user.school
      });

      const populatedTeacher = await Teacher.findById(teacherDoc._id)
        .populate('user', 'firstName lastName email phone')
        .populate('professionalInfo.subjects', 'name code')
        .populate('professionalInfo.classes.class', 'name level');

      return res.status(201).json({ success: true, data: populatedTeacher });
    } catch (err) {
      if (createdUserId) {
        try { await User.findByIdAndDelete(createdUserId); } catch (_) {}
      }
      if (err && err.code === 11000) {
        const fields = Object.keys(err.keyValue || {});
        return res.status(400).json({ success: false, message: `Duplicate value for field(s): ${fields.join(', ')}` });
      }
      return next(err);
    }
  };

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { userData, teacherData } = req.body;

    const user = await User.create([
      { ...userData, role: 'teacher', school: req.user.school }
    ], { session });

    const teacher = await Teacher.create([
      { ...teacherData, user: user[0]._id, school: req.user.school }
    ], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedTeacher = await Teacher.findById(teacher[0]._id)
      .populate('user', 'firstName lastName email phone')
      .populate('professionalInfo.subjects', 'name code')
      .populate('professionalInfo.classes.class', 'name level');

    return res.status(201).json({ success: true, data: populatedTeacher });
  } catch (error) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
    }

    // If transactions are not supported on this MongoDB deployment, fall back
    if (error && (error.code === 20 || error.codeName === 'IllegalOperation')) {
      return createWithoutTransaction();
    }

    if (error && error.code === 11000) {
      const fields = Object.keys(error.keyValue || {});
      return res.status(400).json({ success: false, message: `Duplicate value for field(s): ${fields.join(', ')}` });
    }

    return next(error);
  }
});

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { userData, teacherData } = req.body;

    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (userData) {
      await User.findByIdAndUpdate(teacher.user, userData);
    }

    teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      teacherData,
      { new: true, runValidators: true }
    );

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', 'firstName lastName email phone')
      .populate('professionalInfo.subjects', 'name code')
      .populate('professionalInfo.classes.class', 'name level');

    res.status(200).json({
      success: true,
      data: populatedTeacher
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    await User.findByIdAndDelete(teacher.user);
    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
