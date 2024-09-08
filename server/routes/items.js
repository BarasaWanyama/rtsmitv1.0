// routes/items.js
import { Router } from 'express';
import Item from '../models/Item';
import { clearCache, cache } from '../cacheMiddleware';

const router = Router();

// GET all items
router.route('/').get((req, res) => {
  const cacheKey = 'all_items';
  const cachedItems = cache.get(cacheKey);

  if (cachedItems) {
    return res.json(cachedItems);
  }

  Item.find()
    .then(items => {
      cache.set(cacheKey, items, 300); // Cache for 5 minutes
      res.json(items);
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// POST new item
router.route('/').post((req, res) => {
  const name = req.body.name;
  const newItem = new Item({name});

  newItem.save()
    .then(() => {
      clearCache('all_items');
      res.json('Item added!');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// GET single item
router.route('/:id').get((req, res) => {
  const cacheKey = `item_${req.params.id}`;
  const cachedItem = cache.get(cacheKey);

  if (cachedItem) {
    return res.json(cachedItem);
  }

  Item.findById(req.params.id)
    .then(item => {
      cache.set(cacheKey, item, 300); // Cache for 5 minutes
      res.json(item);
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// PUT update item
router.route('/:id').put((req, res) => {
  Item.findById(req.params.id)
    .then(item => {
      item.name = req.body.name;
      item.save()
        .then(() => {
          clearCache('all_items');
          clearCache(`item_${req.params.id}`);
          res.json('Item updated!');
        })
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE item
router.route('/:id').delete((req, res) => {
  Item.findByIdAndDelete(req.params.id)
    .then(() => {
      clearCache('all_items');
      clearCache(`item_${req.params.id}`);
      res.json('Item deleted.');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

export default router;