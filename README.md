# Drivern Route Management

A comprehensive platform for managing drivers, pickups, and route optimization for logistics and delivery operations.

## Features
- Admin dashboard for managing drivers, pickups, and leave requests
- Route optimization and assignment
- Driver attendance and availability tracking
- Fuel price management
- PDF report generation
- Daily summary and statistics
- Responsive UI with React Bootstrap

## Tech Stack
- **Frontend:** React, React Bootstrap
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **PDF Generation:** @react-pdf/renderer
- **Authentication:** JWT (JSON Web Token)

## Folder Structure
```
├── backend/           # Express.js API server
├── frontend/          # React app
├── README.md
└── ...
```

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### 1. Clone the Repository
```bash
git clone <repo-url>
cd Drivern-Route-Management
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/drivern_db
JWT_SECRET=your_jwt_secret
API_BASE_URL=http://localhost:5000
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

Start the frontend app:
```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Usage
- Log in as an admin to access the dashboard
- Manage drivers, pickups, and leave requests
- Optimize and assign routes
- View and download reports

## Contribution
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License.