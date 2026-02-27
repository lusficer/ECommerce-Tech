# E-commerce Microservices

A modern e-commerce platform built with Spring Cloud microservices architecture.

## Project Overview

This project implements a scalable e-commerce system using Spring Cloud microservices. Each service is independently deployable and communicates through a centralized API Gateway.

### Services
### Services

- **API Gateway** (default Port 8080)
  - Single entry point for client requests; routes to downstream services.
  - Centralized authentication/authorization, rate limiting, and CORS handling.
  - Aggregates Swagger/OpenAPI docs for downstream services.

- **Eureka Server** (default Port 8761)
  - Service registry and discovery for all microservices.
  - Enables client-side load balancing and health status checks.

- **User Service**
  - Manages user accounts, authentication, roles and profiles.
  - Exposes user-related REST endpoints (e.g., register, login, profile).
  - Persists data in a relational store (configured in each service's application.yml).

- **Product Service**
  - Manages product catalog, categories, attributes and media links.
  - Provides product search and filtering endpoints used by frontend and recommendation engine.
  - Typically backed by a relational database and optional search/cache layer.

- **Inventory Service**
  - Tracks stock levels, reservations and stock adjustments.
  - Coordinates with `order-service` and `fulfillment-service` to guarantee availability.
  - Suitable for using a fast datastore or cache for real-time quantity checks.

- **Cart Service**
  - Stores user shopping carts and transient cart sessions.
  - Supports add/remove item, quantity updates, and checkout preparation.
  - Often uses an in-memory or key-value store (Redis) for low-latency access.

- **Order Service**
  - Handles order placement, order lifecycle (created, paid, canceled), and order history.
  - Integrates with payment provider placeholders and emits events for downstream processing.
  - Uses a durable relational store for transactional consistency.

- **Fulfillment Service**
  - Orchestrates packing, shipment creation, and fulfillment status updates.
  - Listens to order events and coordinates with inventory and shipping partners.

- **Recommendation Service**
  - Provides personalized or item-based product recommendations.
  - Can consume events (purchases, views) to update models or use precomputed suggestions.
  - Exposes lightweight endpoints for product recommendation queries.

- **Shop Service**
  - Manages seller/shop profiles, listings, and storefront settings.
  - Handles seller-specific data and permissions separate from end-user accounts.

- **Dispute Service**
  - Handles customer disputes, refunds and chargebacks.
  - Tracks dispute states, evidence, and communications with payments/operations.

- **Statistic Service**
  - Aggregates metrics and business analytics (sales, traffic, conversion rates).
  - Provides endpoints or feeds for dashboards and reporting services.

Each service includes its own configuration and documentation under its folder. Check each service's `src/main/resources/application.yml` for runtime settings and `pom.xml` for dependencies and build configuration.

## Technology Stack

- Java 21
- Spring Boot 3.5.6
- Spring Cloud
- MySQL 8
- Maven
- Swagger/OpenAPI

## Getting Started

### Prerequisites

- JDK 21
- Maven
- MySQL 8

### Installation
1. Clone the repository:
```bash
git clone https://github.com/lusficer/eCommerce.git
cd eCommerce
```

2. Build all services (skip tests for faster local iteration):
```bash
mvn clean install -DskipTests
```

You can also build an individual service by running the same `mvn clean install -DskipTests` inside that service's folder (for example `user-service`).

### Running the Application

Recommended run order and commands (use the `dev` profile for local development):

1. Start Eureka Server (service registry):
```bash
cd eureka-server
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

2. Start core backend services (example order):
```bash
cd user-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

cd ../product-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

cd ../inventory-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

cd ../order-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

3. Start supporting services:
```bash
cd ../cart-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

cd ../recommendation-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev

cd ../fulfillment-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

4. Finally, start the API Gateway:
```bash
cd ../api-gateway
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Notes:
- Always check each service's `src/main/resources/application.yml` to confirm configured ports and datasource settings before running.
- Running many services locally may require additional memory; consider starting only the services you are actively developing.

### Accessing Services

- Eureka Dashboard: http://localhost:8761
- API Gateway (default): http://localhost:8080

API documentation and service endpoints:

- Gateway Swagger/OpenAPI aggregation: http://localhost:8080/swagger-ui.html (aggregates downstream services)
- Individual service Swagger UIs (examples — check each service's port in its `application.yml`):
  - User Service: http://localhost:8081/swagger-ui.html
  - Product Service: http://localhost:<product-port>/swagger-ui.html
  - Order Service: http://localhost:<order-port>/swagger-ui.html

If a service port differs from the examples above, open that service's `src/main/resources/application.yml` to find the configured `server.port`.

Common endpoints:
- `/actuator/health` — health status for each service (Eureka and services must enable Actuator in config).
- `/api/<service>/v1/...` — example REST path patterns proxied through API Gateway; consult each service's controller docs.

## Development

### Service Communication

Services communicate through the API Gateway using RESTful endpoints. Service discovery is handled by Eureka Server.

### Configuration

Each service has its own configuration in `src/main/resources/application.yml`. Key configurations include:

- Server ports
- Eureka client settings
- Database connections (where applicable)
- API documentation paths

### API Documentation

API documentation is available through Swagger UI at each service's `/swagger-ui.html` endpoint. The API Gateway aggregates all service documentation.

## Contributing

1. Create a new branch for your feature
2. Commit your changes
3. Push to your branch
4. Create a Pull Request

## Authors

- **Lusficer**

## License

This project is licensed under the MIT License - see the LICENSE file for details