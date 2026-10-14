const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Number,
    required: true,
    min: 0
  }
});

const Book = mongoose.model("Book", bookSchema);

app.post("/api/books", async (req, res) => {
  try {
    const { title, author, category, isbn, quantity } = req.body;

    if (!title || !author || !category || !isbn || quantity === undefined) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const book = new Book({
      title,
      author,
      category,
      isbn,
      quantity,
      available: quantity
    });

    await book.save();

    res.status(201).json({
      message: "Book added successfully",
      book
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "ISBN already exists"
      });
    }

    res.status(500).json({
      message: "Server error"
    });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});