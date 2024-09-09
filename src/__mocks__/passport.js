const passport = {
    initialize: () => (req, res, next) => next(),
    session: () => (req, res, next) => next(),
    authenticate: () => (req, res, next) => {
      req.user = { id: '123', displayName: 'Test User' };
      next();
    },
    use: jest.fn(),
    serializeUser: (user, done) => done(null, user),
    deserializeUser: (obj, done) => done(null, obj)
  };
  export default passport;