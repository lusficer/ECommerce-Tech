package com.Lusficer.ProductService.service;

import com.Lusficer.ProductService.entity.Category;
import com.Lusficer.ProductService.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getActiveCategories() {
        return categoryRepository.findByStatus("ACTIVE");
    }
}