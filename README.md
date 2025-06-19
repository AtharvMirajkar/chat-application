# Chat Application

A real-time chat application built with React, Node.js, Socket.io, and MongoDB.

## Setup Instructions

### Database Setup (Required)

This application requires a MongoDB database. Since WebContainer doesn't support local MongoDB, you'll need to use MongoDB Atlas (free cloud database):

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Create a new cluster (free tier is sufficient)
   - Wait for the cluster to be created

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

4. **Update Environment Variables**
   - Open `server/.env`
   - Replace the `MONGODB_URI` with your Atlas connection string
   - Example: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp`

### Running the Application

1. **Install Dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ..
   npm install
   ```

2. **Start the Server**
   ```bash
   cd server
   npm start
   ```

3. **Start the Client**
   ```bash
   # In a new terminal
   npm run dev
   ```

### Features

- Real-time messaging with Socket.io
- User authentication (register/login)
- Guest mode for quick access
- Online user indicators
- Typing indicators
- Responsive design with Tailwind CSS

### Troubleshooting

If you see MongoDB connection errors:
- Make sure you've set up MongoDB Atlas
- Check that your connection string is correct in `server/.env`
- Ensure your IP address is whitelisted in MongoDB Atlas
- Verify your username and password are correct

The server will continue running even without a database connection, but authentication and message persistence won't work.