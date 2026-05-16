-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS servicemate;
USE servicemate;

-- 2. Drop existing tables in reverse order of dependency to avoid constraint errors
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS service_providers;
DROP TABLE IF EXISTS users;

-- 3. Users Table (The core table)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'provider', 'admin') NOT NULL,
    phone VARCHAR(15),
    service_type VARCHAR(100), -- Used for initial provider registration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Service Providers Table (Details for users who are providers)
CREATE TABLE service_providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_type VARCHAR(100),
    location VARCHAR(150),
    availability BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Services Table (The list of available services)
CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100)
);

-- 6. Bookings Table (Connects customers, providers, and services)
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,           -- The customer
    provider_id INT NOT NULL,       -- The provider
    service_id INT NOT NULL,        -- The service
    booking_date DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- 7. Reviews Table (Feedback for providers)
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,           -- Reviewer
    provider_id INT NOT NULL,       -- Being reviewed
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE
);

-- 8. Payments Table (Financial records for bookings)
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 9. Verification
DESC users;
DESC service_providers;
ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL;


select * from users;