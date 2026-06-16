# ScoutMarket - Football Player Marketplace

ScoutMarket is a full-stack football player marketplace built as an academic/team project. It demonstrates a React frontend connected to a Spring Boot REST API for browsing players, managing a club squad, adding players to a cart, and simulating checkout/transfer flows.

This repository is prepared as a portfolio project. It is not presented as a production-ready application.

## Main Features

- Public home page with searchable featured players.
- Public player marketplace listing with position and sale-status filters.
- Login and registration flow using JWT authentication.
- Club dashboard for viewing owned players and squad value.
- Player detail page with add-to-cart behavior.
- Cart and checkout flow for simulated player purchases.
- Manage players page for creating, editing, pricing, and listing players for sale.
- Club profile page for viewing another club's squad.
- Optional frontend mock mode for public pages when the backend is not deployed.

## Tech Stack

Frontend:

- React
- Vite
- React Router
- CSS modules/files by component and view

Backend:

- Java 17
- Spring Boot
- Spring Web
- Spring Security
- JWT
- Spring Data JPA
- MySQL
- SpringDoc OpenAPI / Swagger UI
- Maven

## Architecture

The repository is split into two applications:

- `FrontEnd/`: React/Vite single-page application.
- `FootballMarketplace/`: Spring Boot REST API.

The backend follows a layered structure:

- `api/controller`: REST controllers and API/security configuration.
- `application/service`: business logic.
- `application/dto`: request and response DTOs.
- `domain/model`: domain entities.
- `domain/interfaces`: Spring Data repository interfaces.

## Backend Setup

Prerequisites:

- Java 17
- Maven
- MySQL 8 or compatible

Create a local database and application user. Use your own secure password:

```sql
CREATE DATABASE marketplace_football_db;
CREATE USER 'football_marketplace_app'@'localhost' IDENTIFIED BY 'choose-a-local-password';
GRANT ALL PRIVILEGES ON marketplace_football_db.* TO 'football_marketplace_app'@'localhost';
FLUSH PRIVILEGES;
```

Set environment variables before running the backend. PowerShell example:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/marketplace_football_db?createDatabaseIfNotExist=true"
$env:DB_USERNAME="football_marketplace_app"
$env:DB_PASSWORD="choose-a-local-password"
$env:JWT_SECRET="replace-with-a-strong-local-jwt-secret-at-least-32-chars"
```

Run the API:

```powershell
cd FootballMarketplace
mvn spring-boot:run
```

The safe local defaults are in `FootballMarketplace/src/main/resources/application.properties`. A copyable template is available at `FootballMarketplace/src/main/resources/application-example.properties`.

## Frontend Setup

Prerequisites:

- Node.js
- npm

Create a local env file from the example:

```powershell
cd FrontEnd
Copy-Item .env.example .env
```

Run the frontend:

```powershell
npm ci
npm run dev
```

By default, the frontend expects the backend at `http://localhost:8080`.

## Environment Variables

Backend:

- `SERVER_PORT`: API port. Default: `8080`.
- `DB_URL`: MySQL JDBC URL.
- `DB_USERNAME`: MySQL application username.
- `DB_PASSWORD`: MySQL application password.
- `JPA_DDL_AUTO`: Hibernate schema mode. Default: `update`.
- `JPA_SHOW_SQL`: SQL logging flag. Default: `true`.
- `JWT_SECRET`: JWT signing secret. Use a strong value with at least 32 characters.
- `JWT_EXPIRATION_MS`: JWT lifetime in milliseconds. Default: `86400000`.

Frontend:

- `VITE_API_BASE_URL`: backend API URL. Default example: `http://localhost:8080`.
- `VITE_USE_MOCK_API`: set to `true` to use mock public player data for the home page and public player listing.

## API Documentation

When the backend is running, Swagger UI is available at:

```text
http://localhost:8080/swagger-ui/index.html
```

OpenAPI JSON is available at:

```text
http://localhost:8080/v3/api-docs
```

## Demo Mode

Full backend deployment is not included in this repository. For a static frontend demo, set:

```env
VITE_USE_MOCK_API=true
```

This enables mock data for the public home page and public player marketplace listing. Authenticated flows such as login, dashboard, cart, checkout, and player management still require the Spring Boot backend.

## Current Scope

This project is suitable for demonstrating full-stack structure, REST integration, JWT-based authentication, CRUD-style domain flows, and a working React client. Payment handling is simulated, deployment is not fully automated, and security/configuration choices are intended for local development and portfolio review.
