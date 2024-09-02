module.exports = {
    load: jest.fn().mockResolvedValue({
      embed: jest.fn().mockResolvedValue({
        arraySync: jest.fn().mockReturnValue([[1, 2, 3]])
      })
    })
  };