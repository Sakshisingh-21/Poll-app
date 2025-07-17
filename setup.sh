#!/bin/bash

echo "🚀 Setting up Poll App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ All dependencies installed successfully!"

# Check if MongoDB is running (optional)
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB before running the app."
    fi
else
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MongoDB connection string"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm start"
echo "4. Seed the database: cd backend && npm run seed"
echo ""
echo "Sample users will be created:"
echo "- Admin: admin@example.com / AdminPass123"
echo "- User: user@example.com / UserPass123"
echo ""
echo "Happy polling! 🗳️" 
