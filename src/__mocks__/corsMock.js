const cors = jest.fn((options) => (req, res, next) => {
    if (typeof options === 'function') {
      options(req, res, (err) => {
        if (err) {
          next(err);
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });
  
  export default cors;