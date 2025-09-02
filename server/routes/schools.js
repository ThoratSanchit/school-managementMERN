import express from 'express';
import School from '../models/School.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Register a new School and initial Admin user
// @route   POST /api/schools/register
// @access  Private (Super Admin)
router.post('/register', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { school: schoolPayload, admin: adminPayload } = req.body || {};

    if (!schoolPayload || !adminPayload) {
      return res.status(400).json({
        success: false,
        message: 'Both school and admin payloads are required'
      });
    }

    // Create School
    const school = await School.create({
      name: schoolPayload.name,
      code: schoolPayload.code,
      type: schoolPayload.type,
      board: schoolPayload.board,
      address: schoolPayload.address,
      contact: schoolPayload.contact,
      principal: schoolPayload.principal,
      establishedYear: schoolPayload.establishedYear,
      logo: schoolPayload.logo,
      settings: schoolPayload.settings,
      subscription: schoolPayload.subscription,
      isActive: true
    });

    // Create initial Admin user for the school
    const admin = await User.create({
      firstName: adminPayload.firstName,
      lastName: adminPayload.lastName,
      email: adminPayload.email,
      password: adminPayload.password,
      phone: adminPayload.phone,
      role: 'admin',
      school: school._id,
      isActive: true
    });

    const token = admin.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      data: {
        school: {
          id: school._id,
          name: school.name,
          code: school.code
        },
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all schools (Super Admin overview)
// @route   GET /api/schools
// @access  Private (Super Admin)
router.get('/', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};
    if (typeof isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    const schools = await School.find(query)
      .select('name code type board address.city contact.email isActive subscription.plan createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await School.countDocuments(query);

    res.status(200).json({
      success: true,
      count: schools.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: schools
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single school (Super Admin overview)
// @route   GET /api/schools/:id
// @access  Private (Super Admin)
router.get('/:id', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id)
      .select('-__v');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    next(error);
  }
});

export default router;
