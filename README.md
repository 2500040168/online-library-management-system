# Online Library Management System

## 📚 Project Overview
The Online Library Management System is a web application developed to manage library books and borrowing records. It allows users to view books, add new books, update book details, borrow books, return books, and track overdue loans.

## ✨ Features
- View all available books
- Search books
- Add new books
- Update book details
- Delete books
- Borrow books
- Return borrowed books
- View loan history
- Track overdue books
- Generate library reports

## 🛠️ Technologies Used
- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **API Testing:** Thunder Client
- **Version Control:** Git and GitHub

## 📁 Project Structure
```text
online-library-management-system/
├── back-end/
│   ├── models/
│   │   ├── Book.js
│   │   └── Loan.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── front-end/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## ⚙️ Prerequisites
Before running this project, install:
- Node.js and npm
- MongoDB or a MongoDB Atlas account
- Visual Studio Code

## 🚀 Installation and Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/2500040168/online-library-management-system.git
cd online-library-management-system
```

### Step 2: Start the Backend
Open a terminal and run:
```bash
cd back-end
npm install
```

Create a `.env` file inside the `back-end` folder and configure your MongoDB connection string and port. Use the environment variable names expected by `server.js`.

Start the backend:
```bash
node server.js
```

The backend runs on port `5000` if configured with that port.

### Step 3: Start the Frontend
Open a **second terminal** in the project root and run:
```bash
cd front-end
npm install
npm run dev
```

Open the local URL displayed in the terminal to use the application.

## 🔗 API Endpoints

| HTTP Method | Endpoint | Description |
|---|---|---|
| GET | `/api/books` | View and search books |
| POST | `/api/books` | Add a book |
| PUT | `/api/books/:id` | Update book details |
| DELETE | `/api/books/:id` | Delete a book |
| POST | `/api/loans` | Borrow a book |
| GET | `/api/loans` | View loan history |
| PUT | `/api/loans/:id/return` | Return a borrowed book |
| GET | `/api/overdue` | View overdue loans |
| GET | `/api/reports` | Generate library reports |

## 🔒 Security
- Keep database credentials in environment variables.
- Do not upload `.env` files or passwords to GitHub.
- Configure CORS appropriately before deployment.

## 🔮 Future Enhancements
- User login and authentication
- Admin dashboard
- Book availability notifications
- Online deployment
- Improved user interface

## 👨‍💻 Author
Student Project — Online Library Management System

## 🔗 GitHub Repository
https://github.com/2500040168/online-library-management-system
