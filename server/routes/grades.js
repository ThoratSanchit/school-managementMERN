import express from 'express';
import mongoose from 'mongoose';
import Grade from '../models/Grade.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all grades
// @route   GET /api/grades
// @access  Private (Admin, Teacher)
router.get('/', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      examId,
      classId,
      sectionId,
      subjectId,
      studentId,
      academicYear
    } = req.query;

    const query = { school: req.user.school };
    
    if (examId) query.exam = examId;
    if (classId) query.class = classId;
    if (sectionId) query.section = sectionId;
    if (subjectId) query.subject = subjectId;
    if (studentId) query.student = studentId;
    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query)
      .populate('student', 'studentId user')
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('exam', 'name type')
      .populate('subject', 'name code')
      .populate('class', 'name level')
      .populate('section', 'name')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Grade.countDocuments(query);

    res.status(200).json({
      success: true,
      count: grades.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: grades
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create/Update grades for multiple students
// @route   POST /api/grades/batch
// @access  Private (Admin, Teacher)
router.post('/batch', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { examId, subjectId, classId, sectionId, academicYear, grades } = req.body;

    // Validate top-level refs
    const errors = [];
    if (!mongoose.Types.ObjectId.isValid(examId)) errors.push('Invalid exam id');
    if (!mongoose.Types.ObjectId.isValid(subjectId)) errors.push('Invalid subject id');
    if (!mongoose.Types.ObjectId.isValid(classId)) errors.push('Invalid class id');
    if (sectionId && !mongoose.Types.ObjectId.isValid(sectionId)) errors.push('Invalid section id');
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });

    // Ensure entities belong to the same school
    const checks = await Promise.all([
      Exam.exists({ _id: examId, school: req.user.school }),
      Subject.exists({ _id: subjectId, school: req.user.school }),
      Class.exists({ _id: classId, school: req.user.school }),
      sectionId ? Section.exists({ _id: sectionId, school: req.user.school }) : Promise.resolve(true)
    ]);
    if (checks.some(v => !v)) return res.status(400).json({ success: false, message: 'Exam/Subject/Class/Section not found in this school' });

    const results = {
      success: [],
      errors: []
    };

    for (const gradeData of grades) {
      try {
        if (!mongoose.Types.ObjectId.isValid(gradeData.studentId)) {
          throw new Error('Invalid student id');
        }
        const studentInSchool = await Student.exists({ _id: gradeData.studentId, school: req.user.school });
        if (!studentInSchool) throw new Error('Student not found in this school');
        // Check if grade already exists
        const existingGrade = await Grade.findOne({
          student: gradeData.studentId,
          exam: examId,
          subject: subjectId,
          school: req.user.school
        });

        if (existingGrade) {
          // Update existing grade
          const updatedGrade = await Grade.findByIdAndUpdate(
            existingGrade._id,
            {
              marks: gradeData.marks,
              remarks: gradeData.remarks,
              teacher: req.user.teacherId || req.user.id
            },
            { new: true, runValidators: true }
          ).populate('student', 'studentId user')
           .populate({
             path: 'student',
             populate: {
               path: 'user',
               select: 'firstName lastName'
             }
           });

          results.success.push(updatedGrade);
        } else {
          // Create new grade
          const newGrade = await Grade.create({
            school: req.user.school,
            student: gradeData.studentId,
            exam: examId,
            subject: subjectId,
            class: classId,
            section: sectionId,
            marks: gradeData.marks,
            remarks: gradeData.remarks,
            teacher: req.user.teacherId || req.user.id,
            academicYear
          });

          const populatedGrade = await Grade.findById(newGrade._id)
            .populate('student', 'studentId user')
            .populate({
              path: 'student',
              populate: {
                path: 'user',
                select: 'firstName lastName'
              }
            });

          results.success.push(populatedGrade);
        }
      } catch (error) {
        results.errors.push({
          studentId: gradeData.studentId,
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

// @desc    Get student grade report
// @route   GET /api/grades/student/:studentId/report
// @access  Private (Admin, Teacher, Student - own record)
router.get('/student/:studentId/report', protect, async (req, res, next) => {
  try {
    const { academicYear, examType } = req.query;

    // Check authorization for student access
    if (req.user.role === 'student') {
      const student = await Student.findById(req.params.studentId);
      if (!student || student.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this grade report'
        });
      }
    }

    const query = {
      student: req.params.studentId,
      school: req.user.school
    };

    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query)
      .populate('exam', 'name type startDate endDate')
      .populate('subject', 'name code department')
      .sort({ 'exam.startDate': -1 });

    // Group grades by exam
    const examGroups = {};
    grades.forEach(grade => {
      const examId = grade.exam._id.toString();
      if (!examGroups[examId]) {
        examGroups[examId] = {
          exam: grade.exam,
          subjects: [],
          totalMarks: 0,
          obtainedMarks: 0,
          percentage: 0,
          status: 'pass'
        };
      }

      examGroups[examId].subjects.push({
        subject: grade.subject,
        marks: grade.marks,
        grade: grade.grade,
        remarks: grade.remarks
      });

      examGroups[examId].totalMarks += grade.marks.total;
      examGroups[examId].obtainedMarks += grade.marks.obtained;

      if (grade.grade.status === 'fail') {
        examGroups[examId].status = 'fail';
      }
    });

    // Calculate percentages
    Object.values(examGroups).forEach(examGroup => {
      examGroup.percentage = examGroup.totalMarks > 0 
        ? Math.round((examGroup.obtainedMarks / examGroup.totalMarks) * 100 * 100) / 100 
        : 0;
    });

    res.status(200).json({
      success: true,
      data: Object.values(examGroups)
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get class performance analytics
// @route   GET /api/grades/analytics/class/:classId
// @access  Private (Admin, Teacher)
router.get('/analytics/class/:classId', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { examId, academicYear } = req.query;

    const matchQuery = {
      class: req.params.classId,
      school: req.user.school
    };

    if (examId) matchQuery.exam = examId;
    if (academicYear) matchQuery.academicYear = academicYear;

    const analytics = await Grade.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$subject',
          totalStudents: { $sum: 1 },
          averageMarks: { $avg: '$marks.obtained' },
          totalMarks: { $first: '$marks.total' },
          passCount: {
            $sum: {
              $cond: [{ $eq: ['$grade.status', 'pass'] }, 1, 0]
            }
          },
          failCount: {
            $sum: {
              $cond: [{ $eq: ['$grade.status', 'fail'] }, 1, 0]
            }
          },
          highestMarks: { $max: '$marks.obtained' },
          lowestMarks: { $min: '$marks.obtained' }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: '$subject'
      },
      {
        $project: {
          subject: '$subject.name',
          subjectCode: '$subject.code',
          totalStudents: 1,
          averageMarks: { $round: ['$averageMarks', 2] },
          totalMarks: 1,
          averagePercentage: {
            $round: [{ $multiply: [{ $divide: ['$averageMarks', '$totalMarks'] }, 100] }, 2]
          },
          passCount: 1,
          failCount: 1,
          passPercentage: {
            $round: [{ $multiply: [{ $divide: ['$passCount', '$totalStudents'] }, 100] }, 2]
          },
          highestMarks: 1,
          lowestMarks: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

export default router;
