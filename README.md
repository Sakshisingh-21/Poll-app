# Poll & Voting App

A full-stack web application that allows users to participate in polls created by admins. Built with Node.js, Express, PostgreSQL for the backend API and React for the frontend.

## Features

### User Features
- **Authentication**: Secure user registration and login with JWT tokens
- **Role-based Access**: Different interfaces for regular users and admins
- **Poll Browsing**: View all available polls with filtering options
- **Voting**: Vote once per poll with real-time validation
- **Results Viewing**: View poll results after voting and poll closure
- **Profile Management**: Update user profile information

### Admin Features
- **Poll Management**: Create, edit, and delete polls
- **Poll Control**: Manually close or reopen polls
- **Statistics**: View detailed voting statistics and user participation
- **User Management**: View all registered users

### Technical Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Validation**: Form validation with helpful error messages
- **Security**: Password hashing, JWT authentication, and input sanitization
- **Database**: PostgreSQL with Sequelize ORM
- **API**: RESTful API with comprehensive error handling

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database
- **Sequelize**: PostgreSQL ORM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **express-validator**: Input validation
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing

### Frontend
- **React**: JavaScript library for building user interfaces
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Toast notifications
- **Recharts**: Chart library for results visualization
- **Lucide React**: Icon library
- **CSS3**: Custom styling with responsive design

## Database Schema (PostgreSQL)

![ER Diagram](./er.png)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE polls (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    options TEXT[] NOT NULL,
    created_by INTEGER REFERENCES users(id),
    closing_date TIMESTAMP NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    poll_id INTEGER REFERENCES polls(id),
    selected_option INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, poll_id)
);
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| GET | `/api/auth/users` | Get all users | Admin |
| GET | `/api/auth/users/:userId` | Get user by ID | Admin/Owner |

### Polls
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/polls` | Get all polls with filtering | Public |
| GET | `/api/polls/:id` | Get poll by ID | Public |
| POST | `/api/polls` | Create a new poll | Admin |
| PUT | `/api/polls/:id` | Update poll | Admin |
| DELETE | `/api/polls/:id` | Delete poll (soft delete) | Admin |
| POST | `/api/polls/:id/close` | Close poll manually | Admin |
| POST | `/api/polls/:id/reopen` | Reopen poll manually | Admin |
| GET | `/api/polls/:id/results` | Get poll results | Private (voted users) |

### Votes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/votes` | Cast a vote | Private |
| GET | `/api/votes/poll/:pollId` | Get user's vote for poll | Private |
| GET | `/api/votes/user` | Get all user votes | Private |
| GET | `/api/votes/poll/:pollId/stats` | Get poll voting statistics | Admin |
| DELETE | `/api/votes/:voteId` | Delete a vote | Admin/Owner |

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (local installation or cloud service)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poll-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   # or install separately:
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Configuration**
   ```bash
   cd backend
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://username:password@localhost:5432/poll_app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

### Frontend Setup

1. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Database Setup

1. **Local PostgreSQL**
   ```bash
   # Install PostgreSQL (if not already installed)
   # On Ubuntu/Debian:
   sudo apt-get install postgresql postgresql-contrib
   
   # On macOS with Homebrew:
   brew install postgresql
   
   # On Windows, download from https://www.postgresql.org/download/windows/
   
   # Start PostgreSQL service
   sudo service postgresql start  # Linux
   brew services start postgresql  # macOS
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE poll_app;
   CREATE USER poll_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE poll_app TO poll_user;
   \q
   ```

3. **Cloud PostgreSQL (Railway, Heroku, etc.)**
   - Create a PostgreSQL database on your preferred cloud service
   - Get your connection string and update `DATABASE_URL` in `.env`

## Usage

### Creating an Admin User

1. Register a regular user account
2. Manually update the user's role in PostgreSQL:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@example.com';
   ```

### Sample Data

The application includes sample data for testing:

**Admin User:**
- Email: admin@example.com
- Password: AdminPass123
- Role: admin

**Regular User:**
- Email: user@example.com
- Password: UserPass123
- Role: user

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Backend Deployment (Heroku)
1. Create a Heroku account
2. Install Heroku CLI
3. Deploy:
   ```bash
   cd backend
   heroku create your-poll-app-backend
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

### Frontend Deployment (Vercel)
1. Create a Vercel account
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

## Project Structure

```
poll-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Poll.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── polls.js
│   │   └── votes.js
│   ├── tests/
│   │   └── auth.test.js
│   ├── utils/
│   │   ├── jwt.js
│   │   └── response.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── AdminRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── PollList.js
│   │   │   ├── PollDetail.js
│   │   │   ├── CreatePoll.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── Profile.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Demo Video

[Link to demo video will be added here]

## Author

Your Name - [your-email@example.com]

## Acknowledgments

- Express.js documentation
- React documentation
- MongoDB documentation
- Lucide React for icons
- React Hot Toast for notifications 

## Live Demo

You can access the deployed frontend here:

[https://poll-app-new.onrender.com/](https://poll-app-new.onrender.com/) 
