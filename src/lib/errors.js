class ApiError extends Error {
  constructor(message, errorCode, errorData, statusCode) {
    super(message)
    this.name = 'ApiError'
    this.errorCode = errorCode
    this.errorData = errorData
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}
class InvalidParameterError extends ApiError {
  constructor(
    message = 'Invalid Parameters',
    errorCode = ErrorCode.InvalidParameters,
    errorData
  ) {
    super(message, errorCode, errorData, 400)
    this.name = 'InvalidParameterError'
  }
}

const ErrorPrefix = {
  Common: '00',
  Auth: '01',
  User: '02',
}
const ErrorCode = {
  InternalError: ErrorPrefix.Common + '0000',
  InvalidParameters: ErrorPrefix.Common + '0001',
  InvalidEmail: ErrorPrefix.Common + '0002',
  FeatureUnavailable: ErrorPrefix.Common + '0003',
  Unauthorized: ErrorPrefix.Auth + '0000',
  InvalidCredentials: ErrorPrefix.Auth + '0001',
}
module.exports = {
  ApiError,
  ErrorCode,
  InvalidParameterError,
}
