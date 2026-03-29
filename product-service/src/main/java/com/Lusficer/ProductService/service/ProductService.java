package com.Lusficer.ProductService.service;

import com.Lusficer.ProductService.client.InventoryClient;
import com.Lusficer.ProductService.dto.*;
import com.Lusficer.ProductService.dto.request.ProductRequestDTO;
import com.Lusficer.ProductService.entity.*;
import com.Lusficer.ProductService.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
@Service
public class ProductService {

    @Autowired private ProductRepository productRepository;
    @Autowired private ProductApprovalLogRepository logRepository;
    @Autowired private InventoryClient inventoryClient;

    @Transactional
    public Product createProduct(String shopId, ProductRequestDTO request) {
        Product product = new Product();
        product.setProductId(UUID.randomUUID().toString());
        product.setShopId(shopId);
        mapDtoToEntity(request, product);
        
        product.setApprovalStatus(ApprovalStatus.PENDING);
        product.setSubmittedAt(LocalDateTime.now());
        
        product = productRepository.save(product);

        if (request.getStockQuantity() != null) {
            inventoryClient.updateStock(product.getProductId(), request.getStockQuantity());
        }

        return product;
    }

    @Transactional
    public Product updateProduct(String productId, String shopId, ProductRequestDTO request) {
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!existingProduct.getShopId().equals(shopId)) {
            throw new RuntimeException("Unauthorized access");
        }
        boolean isSensitiveChanged = false;
        
        if (!existingProduct.getName().equals(request.getName()) || 
            !existingProduct.getImageUrl().equals(request.getImageUrl()) ||
            !existingProduct.getDescription().equals(request.getDescription()) ||
            !existingProduct.getCategoryId().equals(request.getCategoryId())) {
            
            isSensitiveChanged = true; 
        }

        mapDtoToEntity(request, existingProduct);

        if (isSensitiveChanged) {
            existingProduct.setApprovalStatus(ApprovalStatus.PENDING);
            existingProduct.setSubmittedAt(LocalDateTime.now());
        } 
        

        existingProduct = productRepository.save(existingProduct);

        if (request.getStockQuantity() != null) {
            inventoryClient.updateStock(existingProduct.getProductId(), request.getStockQuantity());
        }

        return existingProduct;
    }

    @Transactional
    public void deleteProduct(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setIsDeleted(true);
        productRepository.save(product);
    }
    
    public List<Product> getVendorProducts(String shopId) {
        List<Product> products = productRepository.findByShopIdAndIsDeletedFalse(shopId);

        if (products.isEmpty()) {
            return products;
        }

        List<String> productIds = products.stream()
                .map(Product::getProductId)
                .collect(Collectors.toList());

        try {
            Map<String, Integer> stockMap = inventoryClient.checkStockBatchPost(productIds);

            
            for (Product p : products) {
                p.setStockQuantity(stockMap.getOrDefault(p.getProductId(), 0));
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi InventoryService lấy số lượng: " + e.getMessage());
        }

        return products;
    }

    
    public List<Product> getApprovalQueue(String shopId) {
        List<Product> products = productRepository.findByShopIdAndApprovalStatusOrderBySubmittedAtAsc(shopId, ApprovalStatus.PENDING);
        
        if (products.isEmpty()) return products;

        List<String> productIds = products.stream().map(Product::getProductId).collect(Collectors.toList());
        try {
            Map<String, Integer> stockMap = inventoryClient.checkStockBatch(productIds);
            for (Product p : products) {
                p.setStockQuantity(stockMap.getOrDefault(p.getProductId(), 0));
            }
        } catch (Exception e) {
            System.err.println("Lỗi gọi Inventory cho Approval Queue: " + e.getMessage());
        }

        return products;
    }

    public List<ProductInternalDto> getProductsByCategory(String categoryId) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("submittedAt").descending());
        
        return productRepository.filterProducts(null, categoryId, null, null, null, pageable)
                .getContent().stream()
                .map(this::mapToInternalDtoSimple)
                .collect(Collectors.toList());
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
            
            if (reviewDTO.getDiscountPercentage() != null) {
                product.setDiscountPercentage(reviewDTO.getDiscountPercentage());
            }

            log.setAction(ApprovalAction.APPROVE);
            log.setComments("Product approved with " + product.getDiscountPercentage() + "% discount.");
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

        public Map<String, String> getProductNamesBatch(List<String> ids) {
        return productRepository.findByProductIdIn(ids)
            .stream()
            .collect(Collectors.toMap(
                Product::getProductId,
                Product::getName
            ));
    }



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
                .description(product.getDescription())
                .brand(product.getBrand())
                .categoryId(product.getCategoryId())
                .specifications(product.getSpecifications())
                .mainImage(product.getImageUrl())
                .discountPercentage(product.getDiscountPercentage())
                .price(product.getPrice())
                .averageRating(product.getAverageRating() != null ? product.getAverageRating() : 0.0)
                .totalReviews(product.getTotalReviews() != null ? product.getTotalReviews() : 0)
                .stock(currentStock)
                .shopId(product.getShopId())
                .build();
    }

    @Transactional
    public void updateProductDiscount(String productId, String shopId, int discountPercentage, String managerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getShopId().equals(shopId)) {
            throw new RuntimeException("Unauthorized access");
        }

        product.setDiscountPercentage(discountPercentage);
        productRepository.save(product);

        ProductApprovalLog log = new ProductApprovalLog();
        log.setProductId(productId);
        log.setActorId(managerId); 
        log.setAction(ApprovalAction.APPROVE); 
        log.setComments("Manager updated discount to " + discountPercentage + "%");
        log.setCreatedAt(LocalDateTime.now()); 
        logRepository.save(log);
    }

    

   
    public List<ProductInternalDto> getProductsBatch(List<String> ids) {
        List<Product> products = productRepository.findByProductIdIn(ids);
        
        return products.stream()
            .map(this::mapToInternalDtoSimple) 
            .collect(Collectors.toList());
    }

    public List<ProductInternalDto> getPublicProductsByShopId(String shopId) {
        List<Product> products = productRepository.findByShopIdAndApprovalStatusAndIsDeletedFalse(shopId, ApprovalStatus.APPROVED);
        
        return products.stream()
                .map(this::mapToInternalDtoSimple)
                .collect(Collectors.toList());
    }

    public List<ProductInternalDto> getTrendingProducts() {
        List<Product> products = productRepository.findTop10ByApprovalStatusAndIsDeletedFalseOrderBySoldCountDesc(ApprovalStatus.APPROVED);
        
        return products.stream()
                .map(this::mapToInternalDtoSimple) 
                .collect(Collectors.toList());
    }

        public List<ProductInternalDto> searchProductsInternal(String keyword) {
        List<Product> products = productRepository.findByNameContainingIgnoreCaseAndApprovalStatusAndIsDeletedFalse(keyword, ApprovalStatus.APPROVED);
        return products.stream()
            .limit(5)
            .map(this::mapToInternalDtoSimple)
            .collect(Collectors.toList());
        }




    private void mapDtoToEntity(ProductRequestDTO dto, Product entity) {
        entity.setName(dto.getName());
        entity.setPrice(dto.getPrice());
        entity.setDescription(dto.getDescription());
        entity.setCategoryId(dto.getCategoryId());
        entity.setImageUrl(dto.getImageUrl());
        entity.setDiscountPercentage(dto.getDiscountPercentage() != null ? dto.getDiscountPercentage() : 0);
        entity.setBrand(dto.getBrand());
        entity.setSpecifications(dto.getSpecifications());
    }

   public Page<ProductInternalDto> filterProductsInternal(String keyword, String categoryId, String brand, Double minPrice, Double maxPrice, int page, int size, String sortOption) {
        BigDecimal min = minPrice != null ? BigDecimal.valueOf(minPrice) : null;
        BigDecimal max = maxPrice != null ? BigDecimal.valueOf(maxPrice) : null;

        Sort sorting = Sort.unsorted();

        if ("price_asc".equals(sortOption)) {
            sorting = JpaSort.unsafe(Sort.Direction.ASC, "(price * (1.0 - (COALESCE(discountPercentage, 0) / 100.0)))");
        } else if ("price_desc".equals(sortOption)) {
            sorting = JpaSort.unsafe(Sort.Direction.DESC, "(price * (1.0 - (COALESCE(discountPercentage, 0) / 100.0)))");
        } else if ("discount_desc".equals(sortOption)) {
            sorting = Sort.by(Sort.Direction.DESC, "discountPercentage");
        } else {
            sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(page, size, sorting);
        Page<Product> productPage = productRepository.filterProducts(keyword, categoryId, brand, min, max, pageable);
        
        return productPage.map(this::mapToInternalDtoSimple);
    }

    private ProductInternalDto mapToInternalDtoSimple(Product p) {
        return ProductInternalDto.builder()
                .productId(p.getProductId())
                .name(p.getName())
                .description(p.getDescription())
                .brand(p.getBrand())
                .categoryId(p.getCategoryId())
                .specifications(p.getSpecifications())
                .price(p.getPrice())
                .mainImage(p.getImageUrl()) 
                .shopId(p.getShopId())
                .stock(0) 
                .averageRating(p.getAverageRating() != null ? p.getAverageRating() : 0.0)
                .totalReviews(p.getTotalReviews() != null ? p.getTotalReviews() : 0)
                .discountPercentage(p.getDiscountPercentage() != null ? p.getDiscountPercentage() : 0)
                .build();
    }
}