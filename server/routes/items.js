// routes/items.js
const router = require('express').Router();
let Item = require('../models/Item');
const { clearCache } = require('../cacheMiddleware');

router.route('/').get((req, res) => {
  Item.find()
    .then(items => res.json(items))
    .catch(err => res.status(400).json('Error: ' + err));
});
// The POST route
router.route('/').post((req, res) => {
  const name = req.body.name;
  const newItem = new Item({name});

  newItem.save()
    .then(() => {
      clearCache('/api/items');
      res.json('Item added!');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').get((req, res) => {
  Item.findById(req.params.id)
    .then(item => res.json(item))
    .catch(err => res.status(400).json('Error: ' + err));
});
// The PUT route
router.route('/:id').put((req, res) => {
  Item.findById(req.params.id)
    .then(item => {
      item.name = req.body.name;
      item.save()
        .then(() => {
          clearCache('/api/items');
          clearCache(`/api/items/${req.params.id}`);
          res.json('Item updated!');
        })
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});
// The DELETE route
router.route('/:id').delete((req, res) => {
  Item.findByIdAndDelete(req.params.id)
    .then(() => {
      clearCache('/api/items');
      clearCache(`/api/items/${req.params.id}`);
      res.json('Item deleted.');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;


