const session = () => (req, res, next) => {
    req.session = {};
    next();
  };
  export default session;