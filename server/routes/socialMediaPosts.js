const router = require('express').Router();
let SocialMediaPost = require('../models/SocialMediaPost');

router.route('/').get((req, res) => {
  SocialMediaPost.find()
    .then(posts => res.json(posts))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/').post((req, res) => {
  const { text, topic, date, likes, shares, comments } = req.body;
  const newPost = new SocialMediaPost({
    text,
    topic,
    date,
    likes,
    shares,
    comments
  });

  newPost.save()
    .then(() => res.json('Social media post added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;