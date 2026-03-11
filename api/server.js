const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = 8080;
const TOTAL_POSTS = 1000000;

// Function to generate a fake post
function generatePost(id) {
  return {
    id: id,
    author: "User " + id,
    content: "This is post number " + id,
    media: {
      type: "none",
      urls: []
    }
  };
}

// Root route
app.get("/", (req, res) => {
  res.send("Mock API Server Running");
});

// Health check route
app.get("/health", (req, res) => {
  res.send("OK");
});

// Posts API with cursor pagination
app.get("/posts", (req, res) => {

  const limit = parseInt(req.query.limit) || 20;
  const cursor = parseInt(req.query.cursor) || 0;

  const posts = [];

  const start = Math.max(0, cursor);
  const end = Math.min(start + limit, TOTAL_POSTS);

  for (let i = start; i < end; i++) {
    posts.push(generatePost(i));
  }

  res.json({
    data: posts,
    nextCursor: end < TOTAL_POSTS ? end : null,
    total: TOTAL_POSTS
  });

});

// Start server
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});