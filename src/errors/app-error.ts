export class AppError extends Error {
    constructor(
        public readonly message: string,
        public readonly statusCode: number,
        public readonly isOperational: boolean = true,
    ) {
        super(message);
        // Give the error a custom name so logs show AppError instead of generic Error.
        this.name = "AppError";
        // So that we start the stack trace from where new AppError(...) was called,
        // not from inside the AppError constructor itself
        Error.captureStackTrace(this, this.constructor);
    }
}
