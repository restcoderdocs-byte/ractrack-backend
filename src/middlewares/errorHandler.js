// centralized error handler
const formatValidationError = (err) => {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return errors.join(", ");
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return `${field} must be unique. '${err.keyValue[field]}' is already taken.`;
  }
  return err.message || "Internal Server Error";
};

const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  let statusCode = 500;
  let message = "Internal Server Error";

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.name === "ValidationError" || err.code === 11000) {
    statusCode = 400;
    message = formatValidationError(err);
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
