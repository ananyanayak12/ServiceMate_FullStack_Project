🚀 Step-by-Step Execution Guide
1. Database Initialization (MySQL)
Before starting the applications, the database must be active.

Step 1: Open MySQL Workbench.

Step 2: Execute your SQL script to create the servicemate database and tables (users, reviews, payments).

Step 3: Ensure your local MySQL is running on port 3306.

2. Backend Execution (Spring Boot)
The backend acts as the API server.

Step 1: Navigate to the backend directory:

Bash
cd ServiceMate-Backend
Step 2: Configure your credentials in src/main/resources/application.properties:

Properties
spring.datasource.username=your_username
spring.datasource.password=your_password
Step 3: Run the application using Maven:

Bash
mvn spring-boot:run
Success Check: Look for Started ServicemateApplication in X seconds in the terminal. The server runs on http://localhost:8080.

3. Frontend Execution (React + Vite)
The frontend provides the user interface.

Step 1: Open a new terminal window and navigate to the frontend directory:

Bash
cd ServiceMate-Frontend
Step 2: Install the necessary Node modules:

Bash
npm install
Step 3: Launch the development server:

Bash
npm run dev
Step 4: Open your browser and navigate to:
http://localhost:5173
