import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private (Admin, Teacher)
router.get('/', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      class: classId,
      section: sectionId,
      date,
      month,
      year,
      academicYear,
      status
    } = req.query;

    const query = { school: req.user.school };

    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;
    if (date) query.date = new Date(date);
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate('student', 'studentId user')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('class', 'name level')
      .populate('section', 'name')
      .populate('markedBy', 'user')
      .populate({
        path: 'markedBy',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: attendance
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark attendance for a class/section
// @route   POST /api/attendance/mark
// @access  Private (Admin, Teacher)
router.post('/mark', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { classId, sectionId, section, date, attendanceData, academicYear } = req.body;

    if (!classId) return res.status(400).json({ success: false, message: 'Please select class' });
    const effectiveSectionId = sectionId || section;
    if (!effectiveSectionId) return res.status(400).json({ success: false, message: 'Please select section' });
    if (!date) return res.status(400).json({ success: false, message: 'Please provide attendance date' });
    if (!academicYear) return res.status(400).json({ success: false, message: 'Please provide academic year' });

    const attendanceRecords = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        // Check if attendance already exists for this student on this date
        const existingAttendance = await Attendance.findOne({
          student: record.studentId,
          date: new Date(date),
          school: req.user.school
        });

        if (existingAttendance) {
          // Update existing record
          const updatedAttendance = await Attendance.findByIdAndUpdate(
            existingAttendance._id,
            {
              status: record.status,
              timeIn: record.timeIn,
              timeOut: record.timeOut,
              remarks: record.remarks,
              markedBy: req.user.teacherId || req.user.id
            },
            { new: true }
          ).populate('student', 'studentId user')
            .populate({
              path: 'student',
              populate: {
                path: 'user',
                select: 'firstName lastName'
              }
            });

          attendanceRecords.push(updatedAttendance);
        } else {
          // Create new record
          const attendance = await Attendance.create({
            school: req.user.school,
            student: record.studentId,
            class: classId,
            section: effectiveSectionId,
            date: new Date(date),
            status: record.status,
            timeIn: record.timeIn,
            timeOut: record.timeOut,
            remarks: record.remarks,
            markedBy: req.user.teacherId || req.user.id,
            academicYear
          });

          const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('student', 'studentId user')
            .populate({
              path: 'student',
              populate: {
                path: 'user',
                select: 'firstName lastName'
              }
            });

          attendanceRecords.push(populatedAttendance);
        }
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        attendanceRecords,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get attendance summary
// @route   GET /api/attendance/summary
// @access  Private (Admin, Teacher)
router.get('/summary', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { classId, sectionId, month, year, academicYear } = req.query;

    const matchQuery = { school: req.user.school };
    if (classId) matchQuery.class = classId;
    if (sectionId) matchQuery.section = sectionId;
    if (month) matchQuery.month = parseInt(month);
    if (year) matchQuery.year = parseInt(year);
    if (academicYear) matchQuery.academicYear = academicYear;

    const summary = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalStudents = await Student.countDocuments({
      school: req.user.school,
      ...(classId && { class: classId }),
      ...(sectionId && { section: sectionId }),
      status: 'active'
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        totalStudents
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get student attendance report
// @route   GET /api/attendance/student/:studentId
// @access  Private (Admin, Teacher, Student - own record)
router.get('/student/:studentId', protect, async (req, res, next) => {
  try {
    const { month, year, academicYear } = req.query;

    // Check if user can access this student's attendance
    if (req.user.role === 'student') {
      const student = await Student.findById(req.params.studentId);
      if (!student || student.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this attendance record'
        });
      }
    }

    const query = {
      student: req.params.studentId,
      school: req.user.school
    };

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (academicYear) query.academicYear = academicYear;

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('markedBy', 'user')
      .populate({
        path: 'markedBy',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

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
      ? Math.round(((summary.presentDays + summary.halfDays * 0.5) / summary.totalDays) * 100 * 100) / 100
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

export default router;
