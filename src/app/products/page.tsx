'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Loader2, ChevronRight, PackageOpen, ChevronLeft } from 'lucide-react';

interface ProductInternalDto {
  productId: string;
  name: string;
  price: number;
  discountPercentage: number;
  mainImage: string;
  shopId: string;
  stock: number;
}

// Thêm Interface cho Category
interface CategoryDto {
  categoryId: string;
  name: string;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const urlKeyword = searchParams.get('keyword') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';

  const [products, setProducts] = useState<ProductInternalDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]); // Lưu list Category từ API
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // States Filter
  const [keyword, setKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Bây giờ lưu trực tiếp ID (VD: CAT_PHONE)
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('latest');

  // States phân trang
  const [currentPage, setCurrentPage] = useState<number>(0); 
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // 1. CHỈ GỌI API LẤY CATEGORY ĐÚNG 1 LẦN KHI MOUNT
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:8083/api/categories');
        if (res.ok) {
          setCategories(await res.json());
        }
      } catch (error) {
        console.error("Lỗi khi load categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // 2. KHI URL THAY ĐỔI -> CẬP NHẬT STATE & GỌI API PRODUCT
  useEffect(() => {
    setKeyword(urlKeyword);
    setSelectedCategory(urlCategory); // Gán thẳng ID từ URL vào ô chọn
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);

    fetchFilteredProducts(urlKeyword, urlCategory, urlMinPrice, urlMaxPrice, 0, sortOption);
  }, [urlKeyword, urlCategory, urlMinPrice, urlMaxPrice, sortOption]);

  const fetchFilteredProducts = async (kw: string, catId: string, min: string, max: string, pageIdx: number, sort: string) => {
    setLoading(true);
    setCurrentPage(pageIdx);
    try {
      const params = new URLSearchParams();
      if (kw) params.append('keyword', kw);
      if (catId) params.append('categoryId', catId); // Truyền thẳng ID cho Backend
      if (min) params.append('minPrice', min);
      if (max) params.append('maxPrice', max);
      
      params.append('page', pageIdx.toString());
      params.append('size', '16'); 
      params.append('sort', sort);

      const url = `http://localhost:8083/api/internal/products/filter?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      }
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (selectedCategory) params.append('category', selectedCategory); // selectedCategory lúc này đã là ID
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    
    router.push(`/products?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    router.push('/products'); 
  };

  // Logic phân trang cửa sổ trượt (Tối đa 3 nút)
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    let startPage = Math.max(0, currentPage - 1);
    let endPage = Math.min(totalPages - 1, startPage + 2);

    if (endPage - startPage < 2) {
      startPage = Math.max(0, endPage - 2);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchFilteredProducts(keyword, selectedCategory, minPrice, maxPrice, i, sortOption)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors ${
            currentPage === i 
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' 
              : 'bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600'
          }`}
        >
          {i + 1}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pages.push(<span key="ellipsis" className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold tracking-widest">...</span>);
      }
      pages.push(
        <button key={totalPages - 1} onClick={() => fetchFilteredProducts(keyword, selectedCategory, minPrice, maxPrice, totalPages - 1, sortOption)} className="w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600">
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-12 animate-in fade-in">
        <button disabled={currentPage === 0} onClick={() => fetchFilteredProducts(keyword, selectedCategory, minPrice, maxPrice, currentPage - 1, sortOption)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages}
        <button disabled={currentPage === totalPages - 1} onClick={() => fetchFilteredProducts(keyword, selectedCategory, minPrice, maxPrice, currentPage + 1, sortOption)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans">
      
      {/* Breadcrumb */}
      <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link> 
        <ChevronRight className="w-4 h-4 mx-2" /> 
        <span className="text-slate-900">Products</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT SIDEBAR - FILTERS */}
        <div className="w-full lg:w-1/4 flex flex-col gap-6 sticky top-28">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Filter className="w-5 h-5 text-slate-900" />
              <h3 className="text-lg font-black text-slate-900">Filters</h3>
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-slate-900 mb-3">Categories</h4>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading categories...
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                  {/* TẠO FILTER TỪ DỮ LIỆU ĐỘNG API */}
                  {categories.map((cat) => (
                    <label key={cat.categoryId} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category"
                        value={cat.categoryId}
                        checked={selectedCategory === cat.categoryId}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 rounded-full border-slate-300 text-cyan-600 focus:ring-cyan-600 cursor-pointer" 
                      />
                      <span className={`text-sm font-medium transition-colors ${selectedCategory === cat.categoryId ? 'text-cyan-600 font-bold' : 'text-slate-600 group-hover:text-cyan-600'}`}>
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3">Price Range ($)</h4>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-cyan-500" />
                <span className="text-slate-400">-</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-cyan-500" />
              </div>
              <button onClick={handleApplyFilter} className="w-full mt-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT - PRODUCT GRID (Giữ nguyên) */}
        <div className="w-full lg:w-3/4">
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              {keyword || selectedCategory || minPrice || maxPrice ? (
                <>
                  <span>Showing <span className="font-bold text-slate-900">{totalElements}</span> results for filters</span>
                  <button onClick={handleClearFilters} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors text-slate-600 font-bold">Clear All</button>
                </>
              ) : (
                <span>Showing <span className="font-bold text-slate-900">{totalElements}</span> items</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm font-bold text-slate-400">Sort by:</span>
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="latest">Latest Items</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading products...</p>
             </div>
          ) : products.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
                <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-xl font-bold text-slate-500 mb-2">No products found</p>
                <p className="text-slate-400 text-sm">We couldn't find any products matching your criteria.</p>
                <button onClick={handleClearFilters} className="mt-6 px-6 py-2.5 bg-cyan-50 text-cyan-600 font-bold rounded-xl hover:bg-cyan-100 transition-colors">
                  Clear All Filters
                </button>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {products.map((product) => {
                  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
                  const salePrice = hasDiscount 
                    ? product.price * (1 - product.discountPercentage / 100) 
                    : product.price;

                  return (
                    <div 
                      key={product.productId} 
                      onClick={() => router.push(`/products/${product.productId}`)} 
                      className="group bg-white flex flex-col border border-slate-200 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 rounded-2xl overflow-hidden transition-all duration-300 relative cursor-pointer"
                    >
                      {hasDiscount && (
                          <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[11px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm">
                            <span>SALE</span><span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                          </div>
                      )}
                      <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center border-b border-slate-50">
                        <img src={product.mainImage || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                        <div className="flex flex-col mb-4">
                          <span className="text-lg font-black text-cyan-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}</span>
                          {hasDiscount && (
                              <span className="text-xs font-medium text-slate-400 line-through mt-0.5">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}</span>
                          )}
                        </div>
                        <div className="mt-auto bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">0% installment. Free 6-month warranty. Free shipping.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderPagination()}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-600" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}