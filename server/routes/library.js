import express from 'express';
import mongoose from 'mongoose';
import Library from '../models/Library.js';
import Subject from '../models/Subject.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/library - list/search books
router.get('/', protect, authorize('admin', 'librarian', 'teacher'), async (req, res, next) => {
  try {
    const { page = 1, limit = 25, category, status, q } = req.query;
    const query = { school: req.user.school };
    if (category) query['book.category'] = category;
    if (status) query.status = status;
    if (q) query.$text = { $search: q };

    const books = await Library.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Library.countDocuments(query);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      pagination: { page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      data: books
    });
  } catch (err) { next(err); }
});

// POST /api/library - add a new book
router.post('/', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const payload = { ...req.body, school: req.user.school };
    const book = await Library.create(payload);
    res.status(201).json({ success: true, data: book });
  } catch (err) { next(err); }
});

// GET /api/library/:id
router.get('/:id', protect, authorize('admin', 'librarian', 'teacher'), async (req, res, next) => {
  try {
    const item = await Library.findOne({ _id: req.params.id, school: req.user.school });
    if (!item) return res.status(404).json({ success: false, message: 'Book not found' });
    res.status(200).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PUT /api/library/:id
router.put('/:id', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const item = await Library.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Book not found' });
    await item.save(); // to trigger inventory recalculation
    res.status(200).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE /api/library/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await Library.findOneAndDelete({ _id: req.params.id, school: req.user.school });
    if (!deleted) return res.status(404).json({ success: false, message: 'Book not found' });
    res.status(200).json({ success: true, message: 'Book deleted' });
  } catch (err) { next(err); }
});

// POST /api/library/:id/issue - issue a book
router.post('/:id/issue', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const { student, teacher, dueDate } = req.body;
    if (!student && !teacher) return res.status(400).json({ success: false, message: 'Provide student or teacher to issue to' });
    if (!dueDate) return res.status(400).json({ success: false, message: 'Provide dueDate' });

    const book = await Library.findOne({ _id: req.params.id, school: req.user.school });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    if (book.inventory.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'No available copies to issue' });
    }

    book.issueHistory.push({
      student: student || undefined,
      teacher: teacher || undefined,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      status: 'issued',
      issuedBy: req.user.librarianId || req.user._id
    });

    book.inventory.issuedCopies += 1;
    book.popularity.totalIssues += 1;
    book.popularity.currentlyIssued += 1;

    await book.save();

    res.status(200).json({ success: true, data: book });
  } catch (err) { next(err); }
});

// POST /api/library/:id/return - return a book
router.post('/:id/return', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const { historyId } = req.body; // id of issueHistory entry

    const book = await Library.findOne({ _id: req.params.id, school: req.user.school });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const entry = book.issueHistory.id(historyId);
    if (!entry) return res.status(404).json({ success: false, message: 'Issue record not found' });
    if (entry.status === 'returned') return res.status(400).json({ success: false, message: 'Already returned' });

    entry.status = 'returned';
    entry.returnDate = new Date();
    entry.returnedBy = req.user.librarianId || req.user._id;

    // Simple overdue handling: if past due, mark status previously as overdue, fine remains as is or 0
    if (entry.dueDate && entry.dueDate < new Date()) {
      entry.status = 'returned';
    }

    // Update inventory counts
    if (book.popularity.currentlyIssued > 0) book.popularity.currentlyIssued -= 1;
    if (book.inventory.issuedCopies > 0) book.inventory.issuedCopies -= 1;

    await book.save();

    res.status(200).json({ success: true, data: book });
  } catch (err) { next(err); }
});

// POST /api/library/:id/report - report lost/damaged
router.post('/:id/report', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const { historyId, type } = req.body; // type: 'lost' | 'damaged'
    if (!['lost', 'damaged'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid type' });

    const book = await Library.findOne({ _id: req.params.id, school: req.user.school });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const entry = historyId ? book.issueHistory.id(historyId) : null;

    if (type === 'lost') {
      if (entry && entry.status !== 'returned') entry.status = 'lost';
      book.inventory.lostCopies += 1;
      if (book.popularity.currentlyIssued > 0) book.popularity.currentlyIssued -= 1;
      if (book.inventory.issuedCopies > 0) book.inventory.issuedCopies -= 1;
    } else if (type === 'damaged') {
      if (entry && entry.status !== 'returned') entry.status = 'damaged';
      book.inventory.damagedCopies += 1;
      if (book.popularity.currentlyIssued > 0) book.popularity.currentlyIssued -= 1;
      if (book.inventory.issuedCopies > 0) book.inventory.issuedCopies -= 1;
    }

    await book.save();

    res.status(200).json({ success: true, data: book });
  } catch (err) { next(err); }
});

// GET /api/library/stats/summary
router.get('/stats/summary', protect, authorize('admin', 'librarian'), async (req, res, next) => {
  try {
    const match = { school: req.user.school };

    const byCategory = await Library.aggregate([
      { $match: match },
      { $group: { _id: '$book.category', totalBooks: { $sum: '$inventory.totalCopies' }, available: { $sum: '$inventory.availableCopies' }, issued: { $sum: '$inventory.issuedCopies' } } },
      { $sort: { totalBooks: -1 } }
    ]);

    const topIssued = await Library.find(match)
      .sort({ 'popularity.totalIssues': -1 })
      .limit(10)
      .select('book.title book.author popularity.totalIssues inventory');

    res.status(200).json({ success: true, data: { byCategory, topIssued } });
  } catch (err) { next(err); }
});

// Subjects minimal CRUD for setup
// @desc    Create subject
// @route   POST /api/library/subjects
// @access  Private (Admin)
router.post('/subjects', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, code, type, category, department, periodsPerWeek } = req.body;
    if (!name || !code || !department || !periodsPerWeek) {
      return res.status(400).json({ success: false, message: 'Please provide name, code, department, periodsPerWeek' });
    }

    const subject = await Subject.create({
      school: req.user.school,
      name,
      code,
      type,
      category,
      department,
      periodsPerWeek
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
});

// @desc    List subjects
// @route   GET /api/library/subjects
// @access  Private (Admin, Teacher)
router.get('/subjects', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const { department, q } = req.query;
    const query = { school: req.user.school };
    if (department) query.department = department;
    if (q) query.name = { $regex: q, $options: 'i' };
    const subjects = await Subject.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
});

// @desc    Bulk create subjects
// @route   POST /api/library/subjects/bulk
// @access  Private (Admin)
router.post('/subjects/bulk', protect, authorize('admin'), async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [];
    if (!payload.length) {
      return res.status(400).json({ success: false, message: 'Please provide an array of subjects' });
    }

    const docs = [];
    const errors = [];

    for (let i = 0; i < payload.length; i++) {
      const s = payload[i];
      if (!s?.name || !s?.code || !s?.department || !s?.periodsPerWeek) {
        errors.push({ index: i, error: 'Missing required fields (name, code, department, periodsPerWeek)' });
        continue;
      }
      docs.push({
        school: req.user.school,
        name: s.name,
        code: s.code,
        type: s.type,
        category: s.category,
        department: s.department,
        periodsPerWeek: s.periodsPerWeek
      });
    }

    let inserted = [];
    if (docs.length) {
      try {
        inserted = await Subject.insertMany(docs, { ordered: false });
      } catch (bulkErr) {
        // Collect duplicate/validation errors with readable messages
        if (bulkErr?.writeErrors?.length) {
          bulkErr.writeErrors.forEach(we => {
            const err = we.err || we;
            let msg = err.errmsg || err.message || 'Insert error';
            // Friendly duplicate message
            if (msg && msg.includes('duplicate key')) {
              const codeVal = docs[we.index]?.code;
              msg = `Subject with code ${codeVal} already exists`;
            }
            errors.push({ index: we.index, error: msg });
          });
        } else if (bulkErr.message) {
          errors.push({ index: null, error: bulkErr.message });
        }
        // Find successfully inserted docs for response
        inserted = await Subject.find({ school: req.user.school, code: { $in: docs.map(d => d.code) } });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        insertedCount: inserted.length,
        inserted: inserted.map(d => ({ id: d._id, name: d.name, code: d.code })),
        errors
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
