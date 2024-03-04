//! asyncrouse handling function with promise in javascript
// "asyncHandler" is a higher order function that takes an function "requestHandler" as a argument
// and return another function "inner function (req, res, next)"

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
