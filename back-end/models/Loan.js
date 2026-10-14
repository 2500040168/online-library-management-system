
const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  borrowerName: {
    type: String,
    required: true,
    trim: true
  },
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["Borrowed", "Returned"],
    default: "Borrowed"
  }
}, { timestamps: true });

module.exports = mongoose.model("Loan", loanSchema);
