const express = require("express");
const morgan = require("morgan");
const studentRoutes = require("./routes/student.routes");
const errorHandler = require("./middlewares/errorHandler");
const responseHandler = require("./middlewares/responseHandler");

const app = express();

// Middleware
app.use(express.json());
app.use(responseHandler); // success response formatter
app.use(morgan("dev")); // logging

// Routes
app.use("/api/students", studentRoutes);

// Error Middleware (last)
app.use(errorHandler);

module.exports = app;
