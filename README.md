# E-commerce Microservices

A modern e-commerce platform built with Spring Cloud microservices architecture.

## Project Overview

This project implements a scalable e-commerce system using Spring Cloud microservices. Each service is independently deployable and communicates through a centralized API Gateway.

### Services

- **API Gateway** (Port 8080)
  - Single entry point for all client requests
  - Routes traffic to appropriate microservices
  - Swagger UI aggregation
  - CORS configuration for frontend integration

- **Eureka Server** (Port 8761)
  - Service discovery and registration
  - Load balancing support
  - Health monitoring

- **User Service** (Port 8081)
  - User management and authentication
  - MySQL database integration
  - Swagger documentation

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

2. Build all services:
```bash
mvn clean install
```

### Running the Application

Start the services in the following order:

1. Eureka Server:
```bash
cd eureka-server
mvn spring-boot:run
```

2. User Service:
```bash
cd user-service
mvn spring-boot:run
```

3. API Gateway:
```bash
cd api-gateway
mvn spring-boot:run
```

### Accessing Services

- Eureka Dashboard: http://localhost:8761
- API Gateway: http://localhost:8080
- API Documentation:
  - Gateway Swagger UI: http://localhost:8080/swagger-ui.html
  - User Service Swagger UI: http://localhost:8081/swagger-ui.html

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