const Strategy = jest.fn((options, verifyFunction) => ({
    name: 'google',
    authenticate: jest.fn((req, options) => {
      const user = { id: '123', displayName: 'Test User' };
      verifyFunction(null, null, user, null);
    }),
  }));
  
  export { Strategy };