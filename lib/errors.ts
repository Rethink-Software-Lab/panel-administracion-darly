export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthorizationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AuthorizationError";
    if (!message) {
      this.message = "No autorizado";
    }
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
