'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Loader2 } from 'lucide-react';

import { Category, Product } from '@/types';
import { apiGet } from '@/lib/api';
import ProductFilterSidebar from '@/components/products/ProductFilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';

// useSearchParams must be wrapped in Suspense in the App Router.
function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from the URL so the page is shareable/bookmarkable.
  const urlKeyword  = searchParams.get('keyword')  || '';
  const urlCategory = searchParams.get('category') || '';
  const urlBrand    = searchParams.get('brand')    || '';
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';

  const [products, setProducts]               = useState<Product[]>([]);
  const [categories, setCategories]           = useState<Category[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [keyword, setKeyword]                 = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [brand, setBrand]                     = useState('');
  const [minPrice, setMinPrice]               = useState('');
  const [maxPrice, setMaxPrice]               = useState('');
  const [sortOption, setSortOption]           = useState('latest');

  const [currentPage, setCurrentPage]         = useState(0);
  const [totalPages, setTotalPages]           = useState(1);
  const [totalElements, setTotalElements]     = useState(0);

  // Load categories once for sidebar filters.
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<Category[]>('product', '/api/categories', { withUserId: false });
        setCategories(data ?? []);
      } catch {}
      finally { setLoadingCategories(false); }
    })();
  }, []);

  // Keep state in sync with the URL, then fetch.
  useEffect(() => {
    setKeyword(urlKeyword);
    setSelectedCategory(urlCategory);
    setBrand(urlBrand);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    fetchProducts(urlKeyword, urlCategory, urlBrand, urlMinPrice, urlMaxPrice, 0, sortOption);
    // The URL is the source of truth for filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKeyword, urlCategory, urlBrand, urlMinPrice, urlMaxPrice, sortOption]);

  // Fetch products for the current filter state.
  const fetchProducts = async (
    kw: string, catId: string, br: string, min: string, max: string,
    pageIdx: number, sort: string,
  ) => {
    setLoading(true);
    setCurrentPage(pageIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const params = new URLSearchParams();
      if (kw)    params.append('keyword', kw);
      if (catId) params.append('categoryId', catId);
      if (br)    params.append('brand', br);
      if (min)   params.append('minPrice', min);
      if (max)   params.append('maxPrice', max);
      params.append('page', pageIdx.toString());
      params.append('size', '16');
      params.append('sort', sort);

      const data = await apiGet<any>(
        'product',
        `/api/internal/products/filter?${params}`,
        { withAuth: false, withUserId: false }
      );
      setProducts(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch {}
    finally { setLoading(false); }
  };

  // Update the URL so filters are bookmarkable.
  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (keyword)          params.append('keyword', keyword);
    if (selectedCategory) params.append('category', selectedCategory);
    if (brand)            params.append('brand', brand);
    if (minPrice)         params.append('minPrice', minPrice);
    if (maxPrice)         params.append('maxPrice', maxPrice);
    router.push(`/products?${params}`);
  };

  const handleClearFilters = () => {
    setKeyword(''); setSelectedCategory(''); setBrand(''); setMinPrice(''); setMaxPrice('');
    router.push('/products');
  };

  const handlePageChange = (page: number) => {
    fetchProducts(keyword, selectedCategory, brand, minPrice, maxPrice, page, sortOption);
  };

  const hasActiveFilters = !!(keyword || selectedCategory || brand || minPrice || maxPrice);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans">
      <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-slate-900">Products</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <ProductFilterSidebar
          categories={categories}
          loadingCategories={loadingCategories}
          selectedCategory={selectedCategory}
          brand={brand}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onCategoryChange={setSelectedCategory}
          onBrandChange={setBrand}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onApply={handleApplyFilter}
        />

        <ProductGrid
          products={products}
          loading={loading}
          totalElements={totalElements}
          totalPages={totalPages}
          currentPage={currentPage}
          sortOption={sortOption}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onSortChange={setSortOption}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

// Suspense wrapper required because useSearchParams() needs it
export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
