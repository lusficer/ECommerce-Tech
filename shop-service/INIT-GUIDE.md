# Shop Service - Chi Tiết Khởi Tạo (Initialization Guide)

## 📋 Tổng Quan (Overview)

**Shop Service** là microservice quản lý các shop/cửa hàng trong hệ thống E-commerce, bao gồm:
- Quản lý thông tin shop (tạo, sửa, xóa, xem)
- Quản lý vendor của shop (owner và nhân viên)
- Quản lý địa chỉ kho hàng (warehouse)
- Tìm kiếm shop
- API nội bộ cho các service khác

### Thông Tin Cơ Bản
- **Port**: 8082
- **Service Name**: shop-service
- **Java Version**: 21
- **Spring Boot**: 3.5.6
- **Database**: MySQL 8 (schema: eCommerce_shop_service)
- **Eureka Server**: http://localhost:8761

---

## 🏗️ Cấu Trúc Dự Án (Project Structure)

```
shop-service/
├── src/main/java/com/Lusficer/ShopService/
│   ├── ShopServiceApplication.java    # Main application
│   │
│   ├── config/                        # Configuration
│   │   ├── SecurityConfig.java        # JWT authentication, CORS
│   │   ├── EnvInitializer.java       # Load .env file
│   │   └── (other configs)
│   │
│   ├── controller/                    # REST Controllers (3 controllers)
│   │   ├── ActuatorRedirectController.java
│   │   ├── ShopController.java            # Public shop endpoints
│   │   └── InternalShopController.java    # Internal service-to-service APIs
│   │
│   ├── dto/                          # DTOs (5 files)
│   │   ├── DeactivateShopRequest.java
│   │   ├── DeactivateShopResponse.java
│   │   ├── ShopProfileResponse.java
│   │   ├── UpdateShopProfileRequest.java
│   │   └── WarehouseInfoDTO.java
│   │
│   ├── entity/                        # JPA Entities (2 tables)
│   │   ├── Shop.java                  # Shop entity
│   │   └── ShopVendorMapping.java     # Vendor mapping
│   │
│   ├── exception/                     # Custom Exceptions
│   │   └── (Custom exceptions)
│   │
│   ├── repository/                    # JPA Repositories (2)
│   │   ├── ShopRepository.java
│   │   └── ShopVendorMappingRepository.java
│   │
│   └── service/                       # Business Logic (1)
│       └── ShopService.java
│
├── src/main/resources/
│   ├── application.yml                # Main configuration
│   └── application.properties         # Environment-based config
│
└── pom.xml                           # Maven dependencies

**Tổng số**: 24 Java files
```

---

## 🔧 Bước 1: Cài Đặt Môi Trường (Environment Setup)

### 1.1 Tạo File `.env`

Tạo file `.env` tại thư mục gốc của shop-service:

```bash
cd /Users/lethanhtuan/VSC/E-commerce_be/shop-service
touch .env
```

Nội dung file `.env`:

```properties
# ===============================
# SERVER CONFIG
# ===============================
SERVER_PORT=8082
SPRING_PROFILES_ACTIVE=dev

# ===============================
# DATABASE CONFIG (MySQL)
# ===============================
DB_HOST=localhost
DB_PORT=3306
DB_NAME_SHOP=eCommerce_shop_service
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_SSL_MODE=DISABLED

# ===============================
# JPA/HIBERNATE CONFIG
# ===============================
JPA_DDL_AUTO=none
JPA_SHOW_SQL=true

# ===============================
# JWT SECURITY
# ===============================
JWT_SECRET=your_jwt_secret_key_here_minimum_256_bits
JWT_EXPIRATION=86400000

# ===============================
# MAIL CONFIG (Optional)
# ===============================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_email_app_password
```

⚠️ **Lưu ý**: 
- Database name phải là `eCommerce_shop_service` (theo entity schema)
- JWT_SECRET phải giống với các service khác để validate token
- Không commit file `.env` vào Git

### 1.2 Cập Nhật `.gitignore`

```
.env
.env.*
*.env
```

---

## 🗄️ Bước 2: Thiết Lập Database

### 2.1 Tạo Database MySQL

```sql
-- Kết nối MySQL
mysql -u root -p

-- Tạo database
CREATE DATABASE IF NOT EXISTS eCommerce_shop_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kiểm tra
SHOW DATABASES;
USE eCommerce_shop_service;
```

### 2.2 Schema Database

Shop Service quản lý **2 bảng chính** (theo entity thực tế):

```sql
-- ================================
-- Bảng 1: SHOP (thông tin shop)
-- ================================
CREATE TABLE IF NOT EXISTS SHOP (
    shopId VARCHAR(255) PRIMARY KEY,
    
    -- Shop info
    shopName VARCHAR(255),
    address VARCHAR(500),
    description TEXT,
    logoUrl LONGTEXT,
    
    -- Warehouse info
    warehouseAddress VARCHAR(500),
    warehouseCity VARCHAR(100),
    warehouseDistrict VARCHAR(100),
    warehouseWard VARCHAR(100),
    warehousePhone VARCHAR(20),
    
    -- Owner
    ownerId VARCHAR(255),
    
    -- Status
    status VARCHAR(50),
    deactivatedAt DATETIME,
    restoreUntil DATETIME,
    
    -- Timestamps
    createdAt DATETIME,
    updatedAt DATETIME,
    
    INDEX idx_ownerId (ownerId),
    INDEX idx_status (status),
    INDEX idx_shopName (shopName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================
-- Bảng 2: SHOP_VENDOR_MAPPING
-- ================================
CREATE TABLE IF NOT EXISTS SHOP_VENDOR_MAPPING (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    shopId VARCHAR(255) NOT NULL,
    vendorId VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- ACTIVE, INACTIVE
    
    joinedAt DATETIME,
    
    INDEX idx_shopId (shopId),
    INDEX idx_vendorId (vendorId),
    INDEX idx_status (status),
    UNIQUE KEY unique_shop_vendor (shopId, vendorId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Lưu ý quan trọng:**
- Database name: `eCommerce_shop_service` (có trong @Table annotation)
- Tên bảng: UPPERCASE (SHOP, SHOP_VENDOR_MAPPING)
- Tên cột: camelCase (shopId, ownerId, warehouseAddress, etc.)
- logoUrl: LONGTEXT (dùng @Lob trong entity)
- SHOP_VENDOR_MAPPING: Unique constraint trên (shopId, vendorId)

### 2.3 Test Database Connection

```bash
mysql -h localhost -P 3306 -u root -p -D eCommerce_shop_service
```

---

## 📦 Bước 3: Cài Đặt Dependencies

### 3.1 Build Project với Maven

```bash
cd /Users/lethanhtuan/VSC/E-commerce_be/shop-service

# Clean và install dependencies
mvn clean install -DskipTests

# Hoặc chỉ download dependencies
mvn dependency:resolve
```

### 3.2 Dependencies Chính

✅ **Spring Boot Starters**
- `spring-boot-starter-web` - REST APIs
- `spring-boot-starter-data-jpa` - Database access
- `spring-boot-starter-validation` - Input validation
- `spring-boot-starter-security` - Authentication/Authorization
- `spring-boot-starter-test` - Testing

✅ **Database**
- `mysql-connector-j` - MySQL driver
- `p6spy` (3.9.1) - SQL logging và monitoring

✅ **Cloud & Microservices**
- `spring-cloud-starter-netflix-eureka-client` (4.3.0) - Service discovery

✅ **Security**
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (0.11.5) - JWT authentication

✅ **Documentation**
- `springdoc-openapi-starter-webmvc-ui` (2.8.14) - Swagger/OpenAPI

✅ **Utilities**
- `lombok` (1.18.42) - Reduce boilerplate code
- `java-dotenv` (5.2.2) - Load environment variables

---

## 🚀 Bước 4: Chạy Service

### 4.1 Yêu Cầu Trước Khi Chạy

**Phải chạy theo thứ tự:**

1. ✅ **MySQL Server** đang chạy (port 3306)
2. ✅ **Eureka Server** đang chạy (port 8761)

### 4.2 Khởi Động Service

```bash
cd /Users/lethanhtuan/VSC/E-commerce_be/shop-service

# Chạy với profile dev
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Hoặc build và chạy JAR
mvn clean package -DskipTests
java -jar target/shop-service-1.0-SNAPSHOT.jar --spring.profiles.active=dev
```

### 4.3 Kiểm Tra Service Đã Chạy

```bash
# 1. Kiểm tra health endpoint
curl http://localhost:8082/actuator/health

# 2. Kiểm tra Swagger UI
open http://localhost:8082/swagger-ui.html

# 3. Kiểm tra đã đăng ký với Eureka
open http://localhost:8761
# Tìm "SHOP-SERVICE" trong danh sách

# 4. Check API docs
curl http://localhost:8082/v3/api-docs
```

**Expected Output**:
```json
{
  "status": "UP"
}
```

---

## 📡 Bước 5: API Endpoints

### 5.1 ShopController - Public APIs

Base path: `/api/shops`

**Shop Management:**
- `GET /api/shops` - Lấy danh sách tất cả shop
- `GET /api/shops/{shopId}` - Lấy chi tiết shop theo ID
- `GET /api/shops/owner/{ownerId}` - Lấy shop theo owner ID
- `GET /api/shops/search` - Tìm kiếm shop
- `POST /api/shops` - Tạo shop mới
- `PUT /api/shops/{shopId}/profile` - Cập nhật thông tin shop
- `DELETE /api/shops/{shopId}` - Xóa/vô hiệu hóa shop

**Vendor Management:**
- `POST /api/shops/{shopId}/vendors/{vendorId}` - Thêm vendor vào shop
- `GET /api/shops/my-assigned-shops` - Lấy danh sách shop của vendor (JWT required)
- `GET /api/shops/{shopId}/check-vendor/{vendorId}` - Kiểm tra vendor có thuộc shop không

### 5.2 InternalShopController - Service-to-Service APIs

Base path: `/api/internal/shops`

**Internal APIs (cho các service khác gọi):**
- `GET /api/internal/shops/{shopId}/warehouse-info` - Lấy thông tin kho hàng
- `GET /api/internal/shops/{shopId}/owner` - Lấy owner ID của shop
- `GET /api/internal/shops/{shopId}/vendors` - Lấy danh sách vendor của shop

### 5.3 Test API với curl

```bash
# 1. Health check
curl http://localhost:8082/actuator/health

# 2. Lấy danh sách shop
curl http://localhost:8082/api/shops

# 3. Lấy chi tiết shop
curl http://localhost:8082/api/shops/{shopId}

# 4. Tìm kiếm shop (cần JWT token)
curl -X GET "http://localhost:8082/api/shops/search?keyword=shop_name" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Tạo shop mới (cần JWT token)
curl -X POST http://localhost:8082/api/shops \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopName": "My Shop",
    "address": "123 Main St",
    "description": "Shop description",
    "warehouseAddress": "456 Warehouse St",
    "warehouseCity": "Ho Chi Minh",
    "warehouseDistrict": "District 1",
    "warehouseWard": "Ward 1",
    "warehousePhone": "0901234567"
  }'

# 6. Internal API - Lấy thông tin warehouse (không cần token)
curl http://localhost:8082/api/internal/shops/{shopId}/warehouse-info
```

---

## 🎯 Bước 6: Tính Năng Chính

### 6.1 Shop Management

**Shop Entity** bao gồm:
- Thông tin cơ bản: shopId, shopName, address, description, logoUrl
- Thông tin owner: ownerId
- Thông tin kho: warehouseAddress, warehouseCity, warehouseDistrict, warehouseWard, warehousePhone
- Status management: status, deactivatedAt, restoreUntil
- Timestamps: createdAt, updatedAt (tự động)

**Shop Status:**
- ACTIVE - Shop đang hoạt động
- INACTIVE - Shop tạm ngưng
- DEACTIVATED - Shop đã bị vô hiệu hóa

### 6.2 Vendor Management

**ShopVendorMapping** quản lý relationship giữa shop và vendor:
- Một shop có thể có nhiều vendor (owner + nhân viên)
- Mỗi vendor có thể quản lý nhiều shop
- Status: ACTIVE hoặc INACTIVE
- Unique constraint: Một vendor không thể được thêm 2 lần vào cùng 1 shop

### 6.3 Warehouse Management

Shop có thể có địa chỉ kho hàng riêng:
- `warehouseAddress` - Địa chỉ chi tiết
- `warehouseCity` - Thành phố
- `warehouseDistrict` - Quận/Huyện
- `warehouseWard` - Phường/Xã
- `warehousePhone` - Số điện thoại liên hệ

**Note**: Nếu warehouse info null, fallback về shop address

### 6.4 Internal APIs

Service này cung cấp APIs cho các service khác:
- **order-service**: Lấy warehouse info để tạo shipping
- **product-service**: Kiểm tra shop tồn tại
- **statistics-service**: Lấy thông tin shop cho báo cáo

---

## 🧪 Bước 7: Testing

### 7.1 Chạy Unit Tests

```bash
cd /Users/lethanhtuan/VSC/E-commerce_be/shop-service

# Chạy tất cả tests
mvn test

# Chạy test cụ thể
mvn test -Dtest=ShopServiceTest
```

### 7.2 Test với Swagger UI

1. Mở: http://localhost:8082/swagger-ui.html
2. Click "Authorize" → Nhập JWT token
3. Test các endpoints:
   - GET `/api/shops`
   - POST `/api/shops`
   - GET `/api/shops/{shopId}`

### 7.3 Test Internal APIs

```bash
# Test warehouse info API (cho order-service)
curl http://localhost:8082/api/internal/shops/shop123/warehouse-info

# Test owner API
curl http://localhost:8082/api/internal/shops/shop123/owner

# Test vendors list API
curl http://localhost:8082/api/internal/shops/shop123/vendors
```

---

## 🐛 Bước 8: Troubleshooting

### Vấn đề 1: Service không khởi động

```bash
# Check port đã được sử dụng chưa
lsof -i :8082

# Kill process nếu cần
kill -9 <PID>
```

### Vấn đề 2: Không kết nối được MySQL

```bash
# Test MySQL connection
mysql -h localhost -P 3306 -u root -p

# Kiểm tra database tồn tại
mysql -u root -p -e "SHOW DATABASES LIKE 'eCommerce_shop_service';"

# Start MySQL (macOS)
brew services start mysql
```

### Vấn đề 3: JWT Token không hợp lệ

- Kiểm tra `JWT_SECRET` trong `.env` giống với user-service
- Token có thể đã hết hạn (expiration)
- Format: `Authorization: Bearer <token>`

### Vấn đề 4: Eureka không discover service

```bash
# Kiểm tra Eureka dashboard
open http://localhost:8761

# Chờ 30-60s để service đăng ký
# Restart service nếu cần
```

### Vấn đề 5: Schema không đúng

**Lỗi thường gặp**: `Unknown database 'eCommerce_shop_service'`

**Giải quyết**:
```sql
CREATE DATABASE IF NOT EXISTS eCommerce_shop_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 📊 Bước 9: Monitoring & Logs

### 9.1 Xem Logs

```bash
# Logs realtime khi chạy service
# SQL queries sẽ hiển thị trong console (show-sql: true)
```

### 9.2 Actuator Endpoints

```bash
# Health check
curl http://localhost:8082/actuator/health

# Application info
curl http://localhost:8082/actuator/info

# Metrics
curl http://localhost:8082/actuator/metrics
```

### 9.3 P6Spy SQL Logging

Service sử dụng **p6spy** (3.9.1) để log SQL queries chi tiết:
- Log tất cả SQL statements
- Show execution time
- Bind parameters

Config đã bật trong application.properties:
```properties
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

---

## 📝 Bước 10: Best Practices

### 10.1 Security

✅ **JWT authentication cho public endpoints**
```java
@GetMapping("/my-assigned-shops")
public ResponseEntity<?> getMyShops(@RequestHeader("Authorization") String token) {
    // Extract userId from JWT
}
```

✅ **Internal APIs không cần JWT** (service-to-service trust)

✅ **Validate input data**
```java
public ResponseEntity<?> createShop(@Valid @RequestBody CreateShopRequest request) {
    // @Valid triggers validation
}
```

### 10.2 Database

✅ **Luôn dùng `ddl-auto: none`** trong production

✅ **Indexes trên các cột hay query**:
- ownerId, shopId, vendorId, status

✅ **Unique constraint** để tránh duplicate data:
- (shopId, vendorId) trong SHOP_VENDOR_MAPPING

### 10.3 Code Organization

- Controllers chỉ xử lý HTTP requests/responses
- Business logic trong Service layer
- Dùng DTOs cho input/output
- Entities chỉ cho database mapping
- Tách Internal APIs thành controller riêng

---

## 📌 Quick Command Reference

```bash
# Build
mvn clean install -DskipTests

# Run
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Test
mvn test

# Check health
curl http://localhost:8082/actuator/health

# Swagger UI
open http://localhost:8082/swagger-ui.html

# Eureka Dashboard
open http://localhost:8761

# MySQL
mysql -h localhost -P 3306 -u root -p eCommerce_shop_service
```

---

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:

1. ☑️ File `.env` có đầy đủ và đúng không?
2. ☑️ MySQL đang chạy và có database `eCommerce_shop_service`?
3. ☑️ Eureka Server đang chạy ở port 8761?
4. ☑️ Dependencies đã được download (`mvn clean install`)?
5. ☑️ Port 8082 có bị chiếm không?
6. ☑️ Java 21 đã được cài đặt?

---

**✨ Shop Service đã sẵn sàng! Happy Coding! 🚀**
