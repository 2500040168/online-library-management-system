
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    category: { type: String, default: "General" },
    totalCopies: { type: Number, required: true, min: 1 },
    availableCopies: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const loanSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    borrowerName: { type: String, required: true, trim: true },
    borrowerEmail: { type: String, required: true, trim: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
        type: String,
        enum: ["Borrowed", "Returned"],
        default: "Borrowed"
    }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);
const Loan = mongoose.model("Loan", loanSchema);

// Home route
app.get("/", (req, res) => {
    res.send("Online Library Management System Backend is Running");
});

// Get all books or search by title, author, ISBN or category
app.get("/api/books", async (req, res) => {
    try {
        const search = String(req.query.search || "").trim();
        const filter = {};

        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { author: { $regex: safeSearch, $options: "i" } },
                { isbn: { $regex: safeSearch, $options: "i" } },
                { category: { $regex: safeSearch, $options: "i" } }
            ];
        }

        const books = await Book.find(filter).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a book
app.post("/api/books", async (req, res) => {
    try {
        const { title, author, isbn, category, totalCopies } = req.body;
        const copies = Number(totalCopies);

        if (
            !title?.trim() ||
            !author?.trim() ||
            !isbn?.trim() ||
            !Number.isInteger(copies) ||
            copies < 1
        ) {
            return res.status(400).json({
                message: "Enter a title, author, ISBN and a positive whole number of copies."
            });
        }

        const book = await Book.create({
            title: title.trim(),
            author: author.trim(),
            isbn: isbn.trim(),
            category: category?.trim() || "General",
            totalCopies: copies,
            availableCopies: copies
        });

        res.status(201).json({
            message: "Book added successfully",
            book
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A book with this ISBN already exists."
            });
        }

        res.status(500).json({ message: error.message });
    }
});

// Update book details
app.put("/api/books/:id", async (req, res) => {
    try {
        const { title, author, isbn, category, totalCopies } = req.body;
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        const activeLoans = book.totalCopies - book.availableCopies;

        if (totalCopies !== undefined) {
            const copies = Number(totalCopies);

            if (!Number.isInteger(copies) || copies < 1) {
                return res.status(400).json({
                    message: "Total copies must be a positive whole number."
                });
            }

            if (copies < activeLoans) {
                return res.status(400).json({
                    message: "Total copies cannot be less than the number currently borrowed."
                });
            }

            book.totalCopies = copies;
            book.availableCopies = copies - activeLoans;
        }

        if (title !== undefined) book.title = title.trim();
        if (author !== undefined) book.author = author.trim();
        if (isbn !== undefined) book.isbn = isbn.trim();
        if (category !== undefined) book.category = category.trim();

        await book.save();

        res.json({ message: "Book updated successfully", book });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "That ISBN is already in use."
            });
        }

        res.status(500).json({ message: error.message });
    }
});

// Delete a book if it has no active loans
app.delete("/api/books/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        const activeLoans = await Loan.countDocuments({
            book: book._id,
            status: "Borrowed"
        });

        if (activeLoans > 0) {
            return res.status(400).json({
                message: "Return all borrowed copies before deleting this book."
            });
        }

        await Book.findByIdAndDelete(book._id);

        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Borrow a book
app.post("/api/loans", async (req, res) => {
    try {
        const { bookId, borrowerName, borrowerEmail } = req.body;

        if (
            !mongoose.isValidObjectId(bookId) ||
            !borrowerName?.trim() ||
            !borrowerEmail?.trim()
        ) {
            return res.status(400).json({
                message: "Provide a valid book, borrower name and email."
            });
        }

        const email = borrowerEmail.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Enter a valid email address."
            });
        }

        // Decrease availability only if at least one copy remains.
        const book = await Book.findOneAndUpdate(
            { _id: bookId, availableCopies: { $gt: 0 } },
            { $inc: { availableCopies: -1 } },
            { new: true }
        );

        if (!book) {
            const exists = await Book.exists({ _id: bookId });

            return res.status(exists ? 400 : 404).json({
                message: exists
                    ? "This book is currently unavailable."
                    : "Book not found."
            });
        }

        const borrowDate = new Date();
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + 14);

        try {
            const loan = await Loan.create({
                book: book._id,
                borrowerName: borrowerName.trim(),
                borrowerEmail: email,
                borrowDate,
                dueDate
            });

            const populatedLoan = await Loan.findById(loan._id)
                .populate("book");

            return res.status(201).json({
                message: "Book borrowed successfully",
                loan: populatedLoan
            });
        } catch (error) {
            // Restore availability if creating the loan fails.
            await Book.updateOne(
                { _id: book._id },
                { $inc: { availableCopies: 1 } }
            );
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// View all borrowing records, with optional email filter
app.get("/api/loans", async (req, res) => {
    try {
        const filter = {};

        if (req.query.email) {
            filter.borrowerEmail = String(req.query.email).trim().toLowerCase();
        }

        if (req.query.status === "Borrowed" ||
            req.query.status === "Returned") {
            filter.status = req.query.status;
        }

        const loans = await Loan.find(filter)
            .populate("book")
            .sort({ borrowDate: -1 });

        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Return a borrowed book
app.put("/api/loans/:id/return", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid loan ID" });
        }

        const loan = await Loan.findOneAndUpdate(
            { _id: req.params.id, status: "Borrowed" },
            { $set: { status: "Returned", returnDate: new Date() } },
            { new: true }
        );

        if (!loan) {
            return res.status(404).json({
                message: "Active loan not found or book already returned."
            });
        }

        await Book.updateOne(
            { _id: loan.book },
            { $inc: { availableCopies: 1 } }
        );

        const populatedLoan = await Loan.findById(loan._id)
            .populate("book");

        res.json({
            message: "Book returned successfully",
            loan: populatedLoan
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Overdue books
app.get("/api/overdue", async (req, res) => {
    try {
        const loans = await Loan.find({
            status: "Borrowed",
            dueDate: { $lt: new Date() }
        }).populate("book").sort({ dueDate: 1 });

        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Library summary report
app.get("/api/reports", async (req, res) => {
    try {
        const [bookStats, totalLoans, activeLoans, overdueLoans] =
            await Promise.all([
                Book.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalTitles: { $sum: 1 },
                            totalCopies: { $sum: "$totalCopies" },
                            availableCopies: { $sum: "$availableCopies" }
                        }
                    }
                ]),
                Loan.countDocuments(),
                Loan.countDocuments({ status: "Borrowed" }),
                Loan.countDocuments({
                    status: "Borrowed",
                    dueDate: { $lt: new Date() }
                })
            ]);

        res.json({
            books: bookStats[0] || {
                totalTitles: 0,
                totalCopies: 0,
                availableCopies: 0
            },
            totalLoans,
            activeLoans,
            overdueLoans
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
