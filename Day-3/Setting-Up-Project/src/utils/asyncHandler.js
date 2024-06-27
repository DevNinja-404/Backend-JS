export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// const asyncHandler = () => {};
// const asyncHandler = (fn) => { () => {}};
// const asyncHandler =  (fn) => async () => {};

// export const asyncHandler = (fn) => async ( req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({ sucess: false, message: err.message });
//   }
// };
