function successResponse(res, statusCode, data, message = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, statusCode, errorCode, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details,
    },
  });
}

module.exports = { successResponse, errorResponse };
