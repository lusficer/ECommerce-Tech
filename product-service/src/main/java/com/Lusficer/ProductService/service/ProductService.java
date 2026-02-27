package com.Lusficer.ProductService.service;

import com.Lusficer.ProductService.client.InventoryClient;
import com.Lusficer.ProductService.dto.*;
import com.Lusficer.ProductService.entity.*;
import com.Lusficer.ProductService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired private ProductRepository productRepository;
    @Autowired private ProductApprovalLogRepository logRepository;
    @Autowired private InventoryClient inventoryClient;

    // --- VENDOR USE CASES (GIỮ NGUYÊN) ---

    @Transactional
    public Product createProduct(String shopId, ProductRequestDTO request) {
        Product product = new Product();
        product.setProductId(UUID.randomUUID().toString());
        product.setShopId(shopId);
        mapDtoToEntity(request, product);
        
        product.setApprovalStatus(ApprovalStatus.PENDING);
        product.setSubmittedAt(LocalDateTime.now());
        
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(String productId, String shopId, ProductRequestDTO request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getShopId().equals(shopId)) {
            throw new RuntimeException("Unauthorized access");
        }

        mapDtoToEntity(request, product);
        product.setApprovalStatus(ApprovalStatus.PENDING);
        product.setSubmittedAt(LocalDateTime.now());

        return productRepository.save(product);
    }
    
    public List<Product> getVendorProducts(String shopId) {
        return productRepository.findByShopIdAndIsDeletedFalse(shopId);
    }

    // --- SHOP MANAGER USE CASES (GIỮ NGUYÊN) ---
    
    public List<Product> getApprovalQueue() {
        return productRepository.findByApprovalStatusOrderBySubmittedAtAsc(ApprovalStatus.PENDING);
    }

    @Transactional
    public void reviewProduct(String productId, ApprovalReviewDTO reviewDTO) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductApprovalLog log = new ProductApprovalLog();
        log.setProductId(productId);
        log.setActorId(reviewDTO.getManagerId());

        if (reviewDTO.isApproved()) {
            product.setApprovalStatus(ApprovalStatus.APPROVED);
            log.setAction(ApprovalAction.APPROVE);
            log.setComments("Product approved.");
        } else {
            if (reviewDTO.getComments() == null || reviewDTO.getComments().isEmpty()) {
                throw new RuntimeException("Comments are required for rejection");
            }
            product.setApprovalStatus(ApprovalStatus.REJECTED);
            log.setAction(ApprovalAction.REJECT);
            log.setComments(reviewDTO.getComments()); 
        }

        productRepository.save(product);
        logRepository.save(log);
    }

    public Product getProductById(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
    }

    // --- INTERNAL / CLIENT USE CASES ---

    // Hàm cũ của bạn (Giữ nguyên - Dùng cho Cart/Order vì cần check tồn kho realtime)
    public ProductInternalDto getProductForInternal(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int currentStock = 0;
        try {
            InventoryDto inventory = inventoryClient.getInventoryDetail(productId);
            if (inventory != null && inventory.getAvailableQuantity() != null) {
                currentStock = inventory.getAvailableQuantity();
            }
        } catch (Exception e) {
            System.err.println("Error fetching inventory for product " + productId + ": " + e.getMessage());
        }

        return ProductInternalDto.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .mainImage(product.getImageUrl())
                .price(product.getPrice())
                .stock(currentStock)
                .shopId(product.getShopId())
                .build();
    }

    // ---------------------------------------------------------
    // [NEW] CÁC HÀM PHỤC VỤ RECOMMENDATION SERVICE
    // ---------------------------------------------------------

    // 1. API Batch: Lấy thông tin cơ bản cho danh sách ID (Enrich Data)
    // Lưu ý: Hàm này KHÔNG gọi Inventory để tránh làm chậm hệ thống (Recommendation Service đã tự gọi Inventory rồi)
    public List<ProductInternalDto> getProductsBatch(List<String> ids) {
        List<Product> products = productRepository.findByProductIdIn(ids);
        
        return products.stream()
                .map(this::mapToInternalDtoSimple) // Dùng hàm map đơn giản (không gọi Inventory)
                .collect(Collectors.toList());
    }

    // 2. API Trending: Lấy 10 sản phẩm mới nhất đã được duyệt (Fallback Cold Start)
    public List<ProductInternalDto> getTrendingProducts() {
        // Chỉ lấy hàng đã Approved
        List<Product> products = productRepository.findTop10ByApprovalStatusOrderBySubmittedAtDesc(ApprovalStatus.APPROVED);
        
        return products.stream()
                .map(this::mapToInternalDtoSimple)
                .collect(Collectors.toList());
    }

    public List<ProductInternalDto> searchProductsInternal(String keyword) {
    // Tìm trong DB các sản phẩm có tên chứa keyword
    List<Product> products = productRepository.findByNameContainingIgnoreCaseAndIsDeletedFalse(keyword);
    
    // Giới hạn lấy 5 cái thôi cho nhẹ
    return products.stream()
            .limit(5)
            .map(this::mapToInternalDtoSimple)
            .collect(Collectors.toList());
    }

    // --- PRIVATE HELPERS ---

    private void mapDtoToEntity(ProductRequestDTO dto, Product entity) {
        entity.setName(dto.getName());
        entity.setPrice(dto.getPrice());
        entity.setDescription(dto.getDescription());
        entity.setCategoryId(dto.getCategoryId());
        entity.setImageUrl(dto.getImageUrl());
    }

    // Mapper đơn giản: Chỉ lấy thông tin tĩnh (Tên, Giá, Ảnh)
    // Giúp response nhanh, nhẹ gánh cho Recommendation Service
    private ProductInternalDto mapToInternalDtoSimple(Product p) {
        return ProductInternalDto.builder()
                .productId(p.getProductId())
                .name(p.getName())
                .price(p.getPrice())
                .mainImage(p.getImageUrl()) // Đảm bảo DTO có field này (hoặc imageUrl)
                .shopId(p.getShopId())
                .stock(0) // Mặc định 0 vì Recommendation Service sẽ tự check tồn kho từ Inventory Service
                .build();
    }
}