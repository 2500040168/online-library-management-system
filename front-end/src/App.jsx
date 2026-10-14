
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api";

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  totalCopies: 1
};

function App() {
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [reports, setReports] = useState(null);
  const [search, setSearch] = useState("");
  const [bookForm, setBookForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState(null);
  const [borrowForm, setBorrowForm] = useState({
    bookId: "",
    borrowerName: "",
    borrowerEmail: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("books");

  async function loadData(query = search) {
    setLoading(true);

    try {
      const [bookRes, loanRes, overdueRes, reportRes] =
        await Promise.all([
          axios.get(`${API}/books`, {
            params: { search: query }
          }),
          axios.get(`${API}/loans`),
          axios.get(`${API}/overdue`),
          axios.get(`${API}/reports`)
        ]);

      setBooks(bookRes.data);
      setLoans(loanRes.data);
      setOverdue(overdueRes.data);
      setReports(reportRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Cannot connect to the backend. Check port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData("");
  }, []);

  function showMessage(text) {
    setMessage(text);
    setError("");
  }

  function showError(err) {
    setError(err.response?.data?.message || err.message);
    setMessage("");
  }

  async function submitBook(e) {
    e.preventDefault();

    try {
      const payload = {
        ...bookForm,
        totalCopies: Number(bookForm.totalCopies)
      };

      if (editingId) {
        await axios.put(`${API}/books/${editingId}`, payload);
        showMessage("Book updated successfully.");
      } else {
        await axios.post(`${API}/books`, payload);
        showMessage("Book added successfully.");
      }

      setBookForm(emptyBook);
      setEditingId(null);
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  function editBook(book) {
    setEditingId(book._id);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies
    });

    setActiveTab("books");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteBook(id) {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    try {
      const res = await axios.delete(`${API}/books/${id}`);
      showMessage(res.data.message);
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  async function borrowBook(e) {
    e.preventDefault();

    try {
      const res = await axios.post(`${API}/loans`, borrowForm);
      showMessage(res.data.message);

      setBorrowForm({
        bookId: "",
        borrowerName: "",
        borrowerEmail: ""
      });

      await loadData();
      setActiveTab("loans");
    } catch (err) {
      showError(err);
    }
  }

  async function returnBook(id) {
    try {
      const res = await axios.put(`${API}/loans/${id}/return`);
      showMessage(res.data.message);
      await loadData();
    } catch (err) {
      showError(err);
    }
  }

  function dateText(date) {
    return date ? new Date(date).toLocaleDateString("en-IN") : "-";
  }

  function isOverdue(loan) {
    return loan.status === "Borrowed" &&
      new Date(loan.dueDate) < new Date();
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <div>
            <h1>LibraDesk</h1>
            <p>Online Library Management</p>
          </div>
        </div>
        <span className="server-status">
          <span className="status-dot"></span> Library Dashboard
        </span>
      </header>

      <main className="container">
        <section className="welcome">
          <div>
            <p className="eyebrow">LIBRARY ADMINISTRATION</p>
            <h2>Manage your library</h2>
            <p className="subtitle">
              Organize books, track borrowing and manage returns.
            </p>
          </div>
          <button className="secondary-btn" onClick={() => loadData()}>
            ↻ Refresh
          </button>
        </section>

        {message && (
          <div className="notice success">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {error && (
          <div className="notice failure">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <span className="stat-icon blue">▤</span>
            <p>Total book titles</p>
            <h3>{reports?.books?.totalTitles ?? 0}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>Available copies</p>
            <h3>{reports?.books?.availableCopies ?? 0}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-icon purple">↗</span>
            <p>Active loans</p>
            <h3>{reports?.activeLoans ?? 0}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-icon red">!</span>
            <p>Overdue loans</p>
            <h3>{reports?.overdueLoans ?? 0}</h3>
          </div>
        </section>

        <nav className="tabs">
          {[
            ["books", "Books"],
            ["borrow", "Borrow a Book"],
            ["loans", "Borrowing History"],
            ["overdue", "Overdue"],
            ["reports", "Reports"]
          ].map(([key, label]) => (
            <button
              key={key}
              className={activeTab === key ? "tab active" : "tab"}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "books" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{editingId ? "Edit book" : "Book inventory"}</h2>
                <p>Add, update, search and manage your collection.</p>
              </div>
            </div>

            <form className="book-form" onSubmit={submitBook}>
              <label>
                Book title *
                <input
                  required
                  value={bookForm.title}
                  onChange={e => setBookForm({
                    ...bookForm, title: e.target.value
                  })}
                  placeholder="Enter book title"
                />
              </label>

              <label>
                Author *
                <input
                  required
                  value={bookForm.author}
                  onChange={e => setBookForm({
                    ...bookForm, author: e.target.value
                  })}
                  placeholder="Author name"
                />
              </label>

              <label>
                ISBN *
                <input
                  required
                  value={bookForm.isbn}
                  onChange={e => setBookForm({
                    ...bookForm, isbn: e.target.value
                  })}
                  placeholder="Unique ISBN"
                />
              </label>

              <label>
                Category
                <input
                  value={bookForm.category}
                  onChange={e => setBookForm({
                    ...bookForm, category: e.target.value
                  })}
                  placeholder="e.g. Technology"
                />
              </label>

              <label>
                Total copies *
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={bookForm.totalCopies}
                  onChange={e => setBookForm({
                    ...bookForm, totalCopies: e.target.value
                  })}
                />
              </label>

              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  {editingId ? "Save changes" : "+ Add book"}
                </button>
                {editingId && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setBookForm(emptyBook);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="search-row">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") loadData(search);
                }}
                placeholder="Search title, author, ISBN or category..."
              />
              <button
                className="primary-btn"
                onClick={() => loadData(search)}
              >
                Search
              </button>
              <button
                className="secondary-btn"
                onClick={() => {
                  setSearch("");
                  loadData("");
                }}
              >
                Clear
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book._id}>
                      <td>
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                      </td>
                      <td>{book.isbn}</td>
                      <td>{book.category}</td>
                      <td>{book.totalCopies}</td>
                      <td>
                        <span className={
                          book.availableCopies > 0
                            ? "pill available"
                            : "pill unavailable"
                        }>
                          {book.availableCopies}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="text-btn"
                          onClick={() => editBook(book)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-btn danger-text"
                          onClick={() => deleteBook(book._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && books.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty">
                        No books found. Add your first book above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {loading && <p className="subtitle">Loading data...</p>}
          </section>
        )}

        {activeTab === "borrow" && (
          <section className="panel narrow-panel">
            <h2>Borrow a book</h2>
            <p className="panel-description">
              Select an available book. The standard loan period is 14 days.
            </p>

            <form className="stack-form" onSubmit={borrowBook}>
              <label>
                Select book *
                <select
                  required
                  value={borrowForm.bookId}
                  onChange={e => setBorrowForm({
                    ...borrowForm, bookId: e.target.value
                  })}
                >
                  <option value="">Choose an available book</option>
                  {books.filter(b => b.availableCopies > 0).map(book => (
                    <option key={book._id} value={book._id}>
                      {book.title} — {book.availableCopies} available
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Borrower's name *
                <input
                  required
                  value={borrowForm.borrowerName}
                  onChange={e => setBorrowForm({
                    ...borrowForm, borrowerName: e.target.value
                  })}
                  placeholder="Enter full name"
                />
              </label>

              <label>
                Borrower's email *
                <input
                  required
                  type="email"
                  value={borrowForm.borrowerEmail}
                  onChange={e => setBorrowForm({
                    ...borrowForm, borrowerEmail: e.target.value
                  })}
                  placeholder="student@example.com"
                />
              </label>

              <button className="primary-btn" type="submit">
                Confirm borrowing
              </button>
            </form>
          </section>
        )}

        {activeTab === "loans" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Borrowing history</h2>
                <p>Track current loans and completed returns.</p>
              </div>
              <span className="count-label">{loans.length} records</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrower</th>
                    <th>Borrowed</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan._id}>
                      <td>
                        <strong>{loan.book?.title || "Book deleted"}</strong>
                        <small>{loan.book?.author || ""}</small>
                      </td>
                      <td>
                        {loan.borrowerName}
                        <small>{loan.borrowerEmail}</small>
                      </td>
                      <td>{dateText(loan.borrowDate)}</td>
                      <td>{dateText(loan.dueDate)}</td>
                      <td>
                        <span className={
                          loan.status === "Returned"
                            ? "pill available"
                            : isOverdue(loan)
                              ? "pill unavailable"
                              : "pill borrowed"
                        }>
                          {isOverdue(loan) ? "Overdue" : loan.status}
                        </span>
                      </td>
                      <td>
                        {loan.status === "Borrowed" && (
                          <button
                            className="text-btn"
                            onClick={() => returnBook(loan._id)}
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty">
                        No borrowing records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "overdue" && (
          <section className="panel">
            <h2>Overdue books</h2>
            <p className="panel-description">
              Books that have not been returned by their due date.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrower</th>
                    <th>Email</th>
                    <th>Due date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map(loan => (
                    <tr key={loan._id}>
                      <td>{loan.book?.title || "Book deleted"}</td>
                      <td>{loan.borrowerName}</td>
                      <td>{loan.borrowerEmail}</td>
                      <td>{dateText(loan.dueDate)}</td>
                      <td>
                        <button
                          className="text-btn"
                          onClick={() => returnBook(loan._id)}
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                  {overdue.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty">
                        No overdue books. Great!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "reports" && (
          <section className="panel">
            <h2>Library reports</h2>
            <p className="panel-description">
              Summary of inventory and circulation.
            </p>
            <div className="report-grid">
              <div className="report-item">
                <span>Total unique book titles</span>
                <strong>{reports?.books?.totalTitles ?? 0}</strong>
              </div>
              <div className="report-item">
                <span>Total physical copies</span>
                <strong>{reports?.books?.totalCopies ?? 0}</strong>
              </div>
              <div className="report-item">
                <span>Available copies</span>
                <strong>{reports?.books?.availableCopies ?? 0}</strong>
              </div>
              <div className="report-item">
                <span>Total borrowing transactions</span>
                <strong>{reports?.totalLoans ?? 0}</strong>
              </div>
              <div className="report-item">
                <span>Currently borrowed</span>
                <strong>{reports?.activeLoans ?? 0}</strong>
              </div>
              <div className="report-item">
                <span>Overdue transactions</span>
                <strong>{reports?.overdueLoans ?? 0}</strong>
              </div>
            </div>
          </section>
        )}

        <footer>
          <p>LibraDesk · Online Library Management System</p>
          <p>React · Express · MongoDB</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
