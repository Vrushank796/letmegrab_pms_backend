# Product Management System

## Description

This is a simple product management system built using React, NodeJS, ExpressJS and MySQL. It allows users to add, view, update, and delete products from a database.

## Setup

### Prerequisites

Clone the repository

```bash
git clone <URL>
```

### Install Dependencies

Navigate to the project directory and install the dependencies for both the client and server.

```bash
cd frontend
npm install

cd ../backend
npm install
```

### Environment Variables

Create a `.env` file in the `frontend` directory and add the following variables:

```bash
REACT_APP_API_URL=http://localhost:4000/api
```

Create a `.env` file in the `backend` directory and add the following variables:

```bash
DB_HOST=localhost
DB_USER=product_user
DB_PASSWORD=yourpassword
DB_NAME=product_db
ENCRYPTION_KEY=yourencryptionkey
```

### Database Setup

Make sure you have MySQL installed and running. Create a new database and user for the application.

### Create User

```sql
CREATE USER 'product_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'product_user'@'localhost';
FLUSH PRIVILEGES;
```

### Create Database

```sql
CREATE DATABASE product_db;
```

### IMPORT SQL FILE (OPTIONAL)

```bash
mysql -u product_user -p product_db < products_backup.sql
```

### Start the Server

Navigate to the `backend` directory and start the server.

```bash
cd backend
npm start
```

The server will run on `http://localhost:4000`.

### Start the Client

Navigate to the `frontend` directory and start the client.

```bash
cd frontend
npm start
```

The client will run on `http://localhost:3000`.

### Access the Application

Open your web browser and go to `http://localhost:3000` to access the application.
You should see the product management interface where you can add, view, update, and delete products.

## Features

- Add new products
- View all products
- Update existing products
- Delete products
- Search products
- Filter products by SKU, product name, category, material and price
- Statistics of products
  - Highest price by category
  - Product Count by Price Range
  - Products without Media

## Technologies Used

- React
- NodeJS
- ExpressJS
- MySQL
