import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin, Teacher)
router.get('/', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      class: classId,
      section: sectionId,
      academicYear,
      status = 'active',
      search
    } = req.query;

    // Build query
    const query = { school: req.user.school };
    
    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    // Search functionality
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

    const students = await Student.find(query)
      .populate({
        path: 'user',
        match: userQuery,
        select: 'firstName lastName email phone avatar'
      })
      .populate('class', 'name level')
      .populate('section', 'name')
      .populate('school', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Filter out students where user population failed due to search
    const filteredStudents = students.filter(student => student.user);

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filteredStudents.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: filteredStudents
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Admin, Teacher, Student - own record)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'firstName lastName email phone avatar')
      .populate('class', 'name level subjects fees')
      .populate('section', 'name sectionTeacher classroom')
      .populate('school', 'name code address contact')
      .populate('subjects', 'name code department')
      .populate('transportInfo.route', 'routeName vehicleNumber');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && student.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student record'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin)
router.post('/', protect, authorize('admin','teacher'), async (req, res, next) => {
  try {
    const {
      userData,
      studentData
    } = req.body;

    // Validate referenced IDs to avoid CastError
    const errors = [];
    if (!studentData?.class) {
      errors.push('Please select class');
    } else if (!mongoose.Types.ObjectId.isValid(studentData.class)) {
      errors.push('Invalid class id');
    }
    if (studentData?.section && !mongoose.Types.ObjectId.isValid(studentData.section)) {
      errors.push('Invalid section id');
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    // Create user first
    const user = await User.create({
      ...userData,
      role: 'student',
      school: req.user.school
    });

    // Create student profile
    const student = await Student.create({
      ...studentData,
      user: user._id,
      school: req.user.school
    });

    // Update class current strength
    if (student.class) {
      await Class.findByIdAndUpdate(
        student.class,
        { $inc: { currentStrength: 1 } }
      );
    }

    // Update section current strength
    if (student.section) {
      await Section.findByIdAndUpdate(
        student.section,
        { 
          $inc: { currentStrength: 1 },
          $push: { students: student._id }
        }
      );
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email phone')
      .populate('class', 'name level')
      .populate('section', 'name');

    res.status(201).json({
      success: true,
      data: populatedStudent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { userData, studentData } = req.body;

    // Validate references if provided
    const errors = [];
    if (studentData?.class && !mongoose.Types.ObjectId.isValid(studentData.class)) {
      errors.push('Invalid class id');
    }
    if (studentData?.section && !mongoose.Types.ObjectId.isValid(studentData.section)) {
      errors.push('Invalid section id');
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update user data if provided
    if (userData) {
      await User.findByIdAndUpdate(student.user, userData);
    }

    // Handle class/section changes
    const oldClass = student.class;
    const oldSection = student.section;
    const newClass = studentData.class;
    const newSection = studentData.section;

    // Update student data
    student = await Student.findByIdAndUpdate(
      req.params.id,
      studentData,
      { new: true, runValidators: true }
    );

    // Update class strengths if class changed
    if (oldClass && oldClass.toString() !== newClass?.toString()) {
      await Class.findByIdAndUpdate(oldClass, { $inc: { currentStrength: -1 } });
      if (newClass) {
        await Class.findByIdAndUpdate(newClass, { $inc: { currentStrength: 1 } });
      }
    }

    // Update section strengths if section changed
    if (oldSection && oldSection.toString() !== newSection?.toString()) {
      await Section.findByIdAndUpdate(
        oldSection,
        { 
          $inc: { currentStrength: -1 },
          $pull: { students: student._id }
        }
      );
      if (newSection) {
        await Section.findByIdAndUpdate(
          newSection,
          { 
            $inc: { currentStrength: 1 },
            $push: { students: student._id }
          }
        );
      }
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email phone')
      .populate('class', 'name level')
      .populate('section', 'name');

    res.status(200).json({
      success: true,
      data: populatedStudent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update class current strength
    if (student.class) {
      await Class.findByIdAndUpdate(
        student.class,
        { $inc: { currentStrength: -1 } }
      );
    }

    // Update section current strength
    if (student.section) {
      await Section.findByIdAndUpdate(
        student.section,
        { 
          $inc: { currentStrength: -1 },
          $pull: { students: student._id }
        }
      );
    }

    // Delete associated user
    await User.findByIdAndDelete(student.user);

    // Delete student
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get student attendance summary
// @route   GET /api/students/:id/attendance
// @access  Private (Admin, Teacher, Student - own record)
router.get('/:id/attendance', protect, async (req, res, next) => {
  try {
    const { month, year, academicYear } = req.query;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && student.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this attendance record'
      });
    }

    // Import Attendance model dynamically to avoid circular dependency
    const { default: Attendance } = await import('../models/Attendance.js');

    const query = { student: req.params.id };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (academicYear) query.academicYear = academicYear;

    const attendance = await Attendance.find(query).sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      lateDays: attendance.filter(a => a.status === 'late').length,
      halfDays: attendance.filter(a => a.status === 'half_day').length,
      leaveDays: attendance.filter(a => ['medical_leave', 'authorized_leave'].includes(a.status)).length
    };

    summary.attendancePercentage = summary.totalDays > 0 
      ? Math.round((summary.presentDays / summary.totalDays) * 100 * 100) / 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get student grades
// @route   GET /api/students/:id/grades
// @access  Private (Admin, Teacher, Student - own record)
router.get('/:id/grades', protect, async (req, res, next) => {
  try {
    const { examId, academicYear } = req.query;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && student.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this grade record'
      });
    }

    // Import Grade model dynamically
    const { default: Grade } = await import('../models/Grade.js');

    const query = { student: req.params.id };
    if (examId) query.exam = examId;
    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query)
      .populate('exam', 'name type')
      .populate('subject', 'name code')
      .sort({ 'exam.startDate': -1 });

    res.status(200).json({
      success: true,
      data: grades
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Bulk import students
// @route   POST /api/students/bulk-import
// @access  Private (Admin)
router.post('/bulk-import', protect, authorize('admin','teacher'), async (req, res, next) => {
  try {
    const { students } = req.body;
    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < students.length; i++) {
      try {
        const { userData, studentData } = students[i];

        // Create user
        const user = await User.create({
          ...userData,
          role: 'student',
          school: req.user.school
        });

        // Create student
        const student = await Student.create({
          ...studentData,
          user: user._id,
          school: req.user.school
        });

        results.success.push({
          index: i,
          studentId: student.studentId,
          name: `${userData.firstName} ${userData.lastName}`
        });

      } catch (error) {
        results.errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

export default router;
