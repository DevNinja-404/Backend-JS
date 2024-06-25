class ApiError extends Error {
  constructor(statusCode, message = "Something Went Wrong!!!", statck = "") {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (statck) {
      this.statck = statck;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };

// BreakDown of the Code :
/*
ApiError is a class that extends the built-in Error class. This means ApiError inherits the properties and methods of Error, allowing us to create custom error objects.

The constructor method is called when a new instance of ApiError is created.
   It takes three parameters:
   statusCode: The HTTP status code associated with the error.
  message: A custom error message (default is "Something Went Wrong!!!").
   stack: An optional stack trace string (if not provided, the stack trace will be automatically captured).

super(message) calls the constructor of the parent Error class, passing the custom message to it.
This ensures that the message property of the Error class is properly initialized with the custom message.

this.statusCode = statusCode: Stores the HTTP status code in the statusCode property of the ApiError instance.

this.data = null: Initializes a data property with null (can be used to store additional error-related data if needed).

this.message = message: Stores the custom message in the message property (though it’s already set by super(message), it's done again here for consistency or potential further use).

this.success = false: Indicates that the operation was not successful (always false for errors).

this.errors = errors: Presumably, this should capture specific errors, but errors is not defined in the provided code. It seems to be a mistake or a placeholder for a list of specific error details.

If a stack string is provided, it sets this.stack to the provided stack.
If no stack is provided, it captures the stack trace using Error.captureStackTrace(this, this.constructor). This method:
Assigns a stack trace to the stack property of the error object.
Excludes the constructor call from the stack trace to make it clearer where the error was instantiated.

*/
