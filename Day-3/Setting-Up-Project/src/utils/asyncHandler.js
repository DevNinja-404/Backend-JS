export const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// const asyncHandler = () => {};
// const asyncHandler = (fn) => { () => {}};
// const asyncHandler = async (fn) => () => {};

// export const asyncHandler = (fn) => async ( req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({ sucess: false, message: err.message });
//   }
// };
