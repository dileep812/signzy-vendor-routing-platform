export class AppError extends Error {
  constructor(message, statusCode, extra = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class RoutingError extends AppError {
  constructor(message) {
    super(message, 502);
  }
}
