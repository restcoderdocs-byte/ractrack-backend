// src/controllers/student.controller.js
'use strict';

const mongoose = require('mongoose');
const Student = require('../models/student.model');
const Audit = require('../models/audit.model');

const sendResponse = require('../utils/sendResponse');
const tryCatch = require('../utils/tryCatch');
const { buildQueryFromReq } = require('../utils/apiFeatures'); // must parse filters/limit/sort/cursor
const { isValidObjectId } = mongoose;

/**
 * Helper: create audit entry. If session provided, create within it.
 * action: string ('create'|'update'|'softDelete'|...)
 * entity: string ('Student')
 * entityId: ObjectId or null (for bulk ops)
 * userId: ObjectId
 * before: snapshot or null
 * after: snapshot or null
 */
async function createAudit({ action, entity, entityId = null, userId = null, before = null, after = null, session = null }) {
  const payload = {
    action,
    entity,
    entityId,
    user: userId,
    before,
    after,
    timestamp: new Date()
  };

  if (session && session.inTransaction()) {
    await Audit.create([payload], { session });
  } else {
    await Audit.create(payload);
  }
}

/**
 * Create a student
 * POST /students
 */
exports.createStudent = tryCatch(async (req, res) => {
  const payload = req.body;

  // Optional: basic validation here (you may rely on validator middleware)
  if (!payload.name || !payload.email || !payload.phone) {
    return sendResponse({ res, status: 400, success: false, message: 'name, email and phone are required' });
  }

  // Use transaction to both create student and audit atomically (if replica set)
  const session = await mongoose.startSession().catch(() => null);

  if (session) await session.startTransaction();

  try {
    const [student] = await Student.create([payload], session ? { session } : undefined);

    await createAudit({
      action: 'create',
      entity: 'Student',
      entityId: student._id,
      userId: req.user?._id || null,
      before: null,
      after: student,
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, status: 201, data: student, message: 'Student created' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) { /* ignore */ }
      session.endSession();
    }
    throw err;
  }
});

/**
 * Get students with pagination (cursor preferred) and filters.
 * GET /students
 * Query params handled by buildQueryFromReq:
 * - filter: object
 * - sort: object
 * - limit: number
 * - cursor: { sortField, sortOrder, lastValue }  (cursor parsing can be encoded in buildQueryFromReq)
 */
exports.getStudents = tryCatch(async (req, res) => {
  const {
    filter = {},
    projection = null,
    sort = { createdAt: -1 },
    limit = 10,
    cursor = null,
    useAggregation = false
  } = buildQueryFromReq(req);

  // Always exclude soft-deleted by default
  filter.deleted = false;

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  // Cursor-based pagination:
  // cursor = { sortField: 'createdAt', sortOrder: -1, lastValue: '2025-01-01T...' }
  const queryFilter = { ...filter };
  if (cursor && cursor.sortField && typeof cursor.lastValue !== 'undefined') {
    const op = cursor.sortOrder === 1 ? '$gt' : '$lt';
    queryFilter[cursor.sortField] = { [op]: cursor.lastValue };
  }

  // Prefer lean reads for performance
  const docs = await Student.find(queryFilter, projection)
    .sort(sort)
    .limit(parsedLimit + 1) // fetch one extra to detect next cursor
    .lean();

  let nextCursor = null;
  if (docs.length > parsedLimit) {
    const last = docs[parsedLimit - 1];
    const sortField = Object.keys(Array.isArray(sort) ? sort[0] : sort)[0] || 'createdAt';
    nextCursor = {
      sortField,
      sortOrder: Array.isArray(sort) ? Object.values(sort)[0] : Object.values(sort)[0] || -1,
      lastValue: last[sortField]
    };
    docs.splice(parsedLimit, 1);
  }

  return sendResponse({ res, data: docs, meta: { nextCursor } });
});

/**
 * Get single student by id
 * GET /students/:id
 * ?includeDeleted=true   -> returns even soft-deleted records
 */
exports.getStudentById = tryCatch(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return sendResponse({ res, status: 400, success: false, message: 'Invalid id' });

  const includeDeleted = req.query.includeDeleted === 'true';

  let query = Student.findById(id);
  if (!includeDeleted) query = query.where({ deleted: false });

  const student = await query.lean();
  if (!student) return sendResponse({ res, status: 404, success: false, message: 'Student not found' });

  return sendResponse({ res, data: student });
});

/**
 * Update student by id
 * PATCH /students/:id
 */
exports.updateStudent = tryCatch(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  if (!isValidObjectId(id)) return sendResponse({ res, status: 400, success: false, message: 'Invalid id' });

  const before = await Student.findById(id).lean();
  if (!before) return sendResponse({ res, status: 404, success: false, message: 'Student not found' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const updated = await Student.findByIdAndUpdate(id, payload, { new: true, runValidators: true, context: 'query', session }).lean();

    await createAudit({
      action: 'update',
      entity: 'Student',
      entityId: id,
      userId: req.user?._id || null,
      before,
      after: updated,
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, data: updated, message: 'Student updated' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) { /* ignore */ }
      session.endSession();
    }
    throw err;
  }
});

/**
 * Soft-delete a student
 * DELETE /students/:id  (soft)
 */
exports.softDeleteStudent = tryCatch(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return sendResponse({ res, status: 400, success: false, message: 'Invalid id' });

  const before = await Student.findById(id).lean();
  if (!before) return sendResponse({ res, status: 404, success: false, message: 'Student not found' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const updated = await Student.findByIdAndUpdate(
      id,
      { $set: { deleted: true, deletedAt: new Date(), deletedBy: req.user?._id || null } },
      { new: true, session }
    ).lean();

    await createAudit({
      action: 'softDelete',
      entity: 'Student',
      entityId: id,
      userId: req.user?._id || null,
      before,
      after: updated,
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, data: updated, message: 'Student soft-deleted' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/**
 * Restore a soft-deleted student
 * POST /students/:id/restore
 */
exports.restoreStudent = tryCatch(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return sendResponse({ res, status: 400, success: false, message: 'Invalid id' });

  const before = await Student.findById(id).lean();
  if (!before) return sendResponse({ res, status: 404, success: false, message: 'Student not found' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const updated = await Student.findByIdAndUpdate(
      id,
      { $set: { deleted: false, deletedAt: null, deletedBy: null } },
      { new: true, session }
    ).lean();

    await createAudit({
      action: 'restore',
      entity: 'Student',
      entityId: id,
      userId: req.user?._id || null,
      before,
      after: updated,
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, data: updated, message: 'Student restored' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/**
 * Hard-delete a student (permanent). Admin only check should be in middleware,
 * but double-check here as well.
 * DELETE /students/:id/hard
 */
exports.hardDeleteStudent = tryCatch(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return sendResponse({ res, status: 400, success: false, message: 'Invalid id' });

  if (!req.user?.isAdmin) return sendResponse({ res, status: 403, success: false, message: 'Admin required' });

  const before = await Student.findById(id).lean();
  if (!before) return sendResponse({ res, status: 404, success: false, message: 'Student not found' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    await Student.deleteOne({ _id: id }, { session });

    await createAudit({
      action: 'hardDelete',
      entity: 'Student',
      entityId: id,
      userId: req.user?._id || null,
      before,
      after: null,
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, message: 'Student permanently deleted' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/**
 * Bulk operations
 * - bulkCreate: POST /students/bulk
 * - bulkUpdate: PATCH /students/bulk
 * - bulkSoftDelete: POST /students/bulk/soft-delete
 * - bulkRestore: POST /students/bulk/restore
 * - bulkHardDelete: POST /students/bulk/hard-delete
 */

/* Bulk create (array of students). Limit to prevent abuse. */
exports.bulkCreate = tryCatch(async (req, res) => {
  const payload = req.body; // expect array of student objects
  if (!Array.isArray(payload) || payload.length === 0) return sendResponse({ res, status: 400, success: false, message: 'Array of students required' });
  if (payload.length > 500) return sendResponse({ res, status: 400, success: false, message: 'max 500 students per request' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const docs = await Student.insertMany(payload, session ? { session } : undefined);

    await createAudit({
      action: 'bulkCreate',
      entity: 'Student',
      entityId: null,
      userId: req.user?._id || null,
      before: null,
      after: { count: docs.length },
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, status: 201, data: docs, message: 'Bulk create completed' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/* Bulk update: expect [{ _id, ...updates }, ...] */
exports.bulkUpdate = tryCatch(async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) return sendResponse({ res, status: 400, success: false, message: 'Array required' });
  if (items.length > 500) return sendResponse({ res, status: 400, success: false, message: 'max 500 items' });

  // Build bulkWrite ops
  const ops = [];
  for (const it of items) {
    if (!it._id || !isValidObjectId(it._id)) continue;
    const { _id, ...rest } = it;
    ops.push({
      updateOne: {
        filter: { _id },
        update: { $set: rest }
      }
    });
  }

  if (ops.length === 0) return sendResponse({ res, status: 400, success: false, message: 'No valid items to update' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const result = await Student.bulkWrite(ops, session ? { session } : undefined);

    // Single audit entry summarizing bulk update
    await createAudit({
      action: 'bulkUpdate',
      entity: 'Student',
      entityId: null,
      userId: req.user?._id || null,
      before: null,
      after: { result },
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, data: result, message: 'Bulk update executed' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/* Bulk soft-delete */
exports.bulkSoftDelete = tryCatch(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return sendResponse({ res, status: 400, success: false, message: 'ids[] required' });
  if (ids.length > 1000) return sendResponse({ res, status: 400, success: false, message: 'max 1000 ids allowed' });

  const ops = ids
    .filter(id => isValidObjectId(id))
    .map(id => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { deleted: true, deletedAt: new Date(), deletedBy: req.user?._id || null } }
      }
    }));

  if (ops.length === 0) return sendResponse({ res, status: 400, success: false, message: 'No valid ids provided' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const result = await Student.bulkWrite(ops, session ? { session } : undefined);

    await createAudit({
      action: 'bulkSoftDelete',
      entity: 'Student',
      entityId: null,
      userId: req.user?._id || null,
      before: null,
      after: { ids, result },
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, message: 'Bulk soft delete executed', data: result });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/* Bulk restore */
exports.bulkRestore = tryCatch(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return sendResponse({ res, status: 400, success: false, message: 'ids[] required' });
  if (ids.length > 1000) return sendResponse({ res, status: 400, success: false, message: 'max 1000 ids allowed' });

  const ops = ids
    .filter(id => isValidObjectId(id))
    .map(id => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { deleted: false, deletedAt: null, deletedBy: null } }
      }
    }));

  if (ops.length === 0) return sendResponse({ res, status: 400, success: false, message: 'No valid ids provided' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const result = await Student.bulkWrite(ops, session ? { session } : undefined);

    await createAudit({
      action: 'bulkRestore',
      entity: 'Student',
      entityId: null,
      userId: req.user?._id || null,
      before: null,
      after: { ids, result },
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, message: 'Bulk restore executed', data: result });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});

/* Bulk hard delete - admin only */
exports.bulkHardDelete = tryCatch(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return sendResponse({ res, status: 400, success: false, message: 'ids[] required' });
  if (!req.user?.isAdmin) return sendResponse({ res, status: 403, success: false, message: 'Admin required' });

  const validIds = ids.filter(id => isValidObjectId(id));
  if (validIds.length === 0) return sendResponse({ res, status: 400, success: false, message: 'No valid ids provided' });

  const session = await mongoose.startSession().catch(() => null);
  if (session) await session.startTransaction();

  try {
    const result = await Student.deleteMany({ _id: { $in: validIds } }, { session });

    await createAudit({
      action: 'bulkHardDelete',
      entity: 'Student',
      entityId: null,
      userId: req.user?._id || null,
      before: null,
      after: { ids: validIds, result },
      session
    });

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    return sendResponse({ res, message: 'Bulk hard delete executed', data: result });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (e) {}
      session.endSession();
    }
    throw err;
  }
});
