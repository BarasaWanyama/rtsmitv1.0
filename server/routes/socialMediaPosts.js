// routes/socialMediaPosts.js
import { Router } from 'express';
import SocialMediaPost from '../models/SocialMediaPost';
import { clearCache, cache } from '../cacheMiddleware';

const router = Router();

// GET all social media posts
router.route('/').get((req, res) => {
  const cacheKey = 'all_social_media_posts';
  const cachedPosts = cache.get(cacheKey);

  if (cachedPosts) {
    return res.json(cachedPosts);
  }

  SocialMediaPost.find()
    .then(posts => {
      cache.set(cacheKey, posts, 300); // Cache for 5 minutes
      res.json(posts);
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// POST new social media post
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
    .then(() => {
      clearCache('all_social_media_posts');
      res.json('Social media post added!');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// GET single social media post
router.route('/:id').get((req, res) => {
  const cacheKey = `social_media_post_${req.params.id}`;
  const cachedPost = cache.get(cacheKey);

  if (cachedPost) {
    return res.json(cachedPost);
  }

  SocialMediaPost.findById(req.params.id)
    .then(post => {
      cache.set(cacheKey, post, 300); // Cache for 5 minutes
      res.json(post);
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// PUT update social media post
router.route('/:id').put((req, res) => {
  SocialMediaPost.findById(req.params.id)
    .then(post => {
      post.text = req.body.text;
      post.topic = req.body.topic;
      post.date = req.body.date;
      post.likes = req.body.likes;
      post.shares = req.body.shares;
      post.comments = req.body.comments;

      post.save()
        .then(() => {
          clearCache('all_social_media_posts');
          clearCache(`social_media_post_${req.params.id}`);
          res.json('Social media post updated!');
        })
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE social media post
router.route('/:id').delete((req, res) => {
  SocialMediaPost.findByIdAndDelete(req.params.id)
    .then(() => {
      clearCache('all_social_media_posts');
      clearCache(`social_media_post_${req.params.id}`);
      res.json('Social media post deleted.');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

export default router;