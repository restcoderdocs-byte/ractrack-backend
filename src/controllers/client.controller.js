const mongoose = require("mongoose");
const Client = require("../models/client.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Client
exports.createClient = async (req, res, next) => {
  try {
    const { photo, name } = req.body;

    if (!photo || !name) {
      return res.status(400).json({ success: false, message: "Photo and name are required" });
    }

    const client = await Client.create({ photo, name });
    return res.status(201).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// Get All Clients (optimized with aggregation + pagination)
exports.getClients = async (req, res, next) => {
  try {
    let { limit = 10, after, includeDeleted = false } = req.query;
    limit = parseInt(limit);

    const matchStage = {};
    if (!JSON.parse(includeDeleted)) {
      matchStage.isDeleted = false;
    }

    const pipeline = [{ $match: matchStage }, { $sort: { _id: 1 } }, { $limit: limit }];

    if (after && isValidObjectId(after)) {
      pipeline.unshift({ $match: { ...matchStage, _id: { $gt: new mongoose.Types.ObjectId(after) } } });
    }

    const clients = await Client.aggregate(pipeline).exec();

    return res.status(200).json({ success: true, data: clients });
  } catch (error) {
    next(error);
  }
};

// Get Single Client
exports.getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const client = await Client.findOne(filter).lean();

    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.status(200).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// Update Client
exports.updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    const updated = await Client.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
exports.softDeleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    const deleted = await Client.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
exports.restoreClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    const restored = await Client.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
exports.hardDeleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    const removed = await Client.findByIdAndDelete(id).lean();

    if (!removed) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.status(200).json({ success: true, message: "Client permanently deleted" });
  } catch (error) {
    next(error);
  }
};






// Bulk Insert
// exports.bulkInsertClients = async (req, res, next) => {
//   try {
//     const { clients } = req.body;

//     if (!Array.isArray(clients) || clients.length === 0) {
//       return res.status(400).json({ success: false, message: "Clients array is required" });
//     }

//     // Validate each client
//     for (let c of clients) {
//       if (!c.photo || !c.name) {
//         return res.status(400).json({ success: false, message: "Photo and name are required for each client" });
//       }
//     }

//     const inserted = await Client.insertMany(clients, { ordered: false });
//     return res.status(201).json({ success: true, count: inserted.length, data: inserted });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Soft Delete
// exports.bulkSoftDeleteClients = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Client.updateMany(
//       { _id: { $in: validIds } },
//       { $set: { isDeleted: true, deletedAt: new Date() } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} clients soft deleted`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Restore
// exports.bulkRestoreClients = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Client.updateMany(
//       { _id: { $in: validIds } },
//       { $set: { isDeleted: false, deletedAt: null } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} clients restored`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Hard Delete
// exports.bulkHardDeleteClients = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Client.deleteMany({ _id: { $in: validIds } });

//     return res.status(200).json({
//       success: true,
//       message: `${result.deletedCount} clients permanently deleted`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
