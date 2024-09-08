import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const socialMediaPostSchema = new Schema({
  text: { type: String, required: true },
  topic: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const SocialMediaPost = mongoose.model('SocialMediaPost', socialMediaPostSchema);

export default SocialMediaPost;