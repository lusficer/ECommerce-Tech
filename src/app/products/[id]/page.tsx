'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star, ShoppingCart, Truck, ShieldCheck, ChevronRight, Store, Share2, Loader2, Info, MessageSquare, Cpu, Package, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductInternalDto {
  productId: string;
  name: string;
  price: number;
  mainImage: string;
  description?: string;
  shopId: string;
  discountPercentage: number;
  stock: number;
  brand?: string;
  specifications?: string;
  categoryId?: string; 
}

const MOCK_REVIEWS = [
  { id: 1, user: "Alex Johnson", rating: 5, date: "Nov 12, 2025", comment: "Absolutely love this! The build quality is premium, and it performs exactly as described. Delivery was also surprisingly fast." },
  { id: 2, user: "Sarah M.", rating: 4, date: "Oct 28, 2025", comment: "Great value for the price. The features are solid and it looks really sleek. I knocked off one star just because the packaging was slightly dented upon arrival, but the product inside was perfectly safe." },
  { id: 3, user: "Michael T.", rating: 5, date: "Oct 15, 2025", comment: "Highly recommend! I've been using it daily and it hasn't let me down. Best purchase I've made this month." }
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductInternalDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [activeImage, setActiveImage] = useState(0);
  const [shopName, setShopName] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [frequentlyBought, setFrequentlyBought] = useState<ProductInternalDto[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductInternalDto[]>([]);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    const fetchData = async () => {
      try {
        const cleanId = decodeURIComponent(productId);
        const productRes = await fetch(`http://localhost:8083/api/internal/products/${cleanId}`);
        
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
          setShopName(productData.shopId); 
          
          if (productData.shopId) {
            fetch(`http://localhost:8082/api/shops/${productData.shopId}`, {
             method: 'GET',
             headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            }).then(shopRes => shopRes.ok ? shopRes.json() : null)
              .then(shopData => { if (shopData && (shopData.shopName || shopData.name)) setShopName(shopData.shopName || shopData.name); })
              .catch(err => console.error("Error loading shop info:", err));
          }

          if (token && productData.categoryId) {
             fetch(`http://localhost:8090/api/recommendations/track`, { // Sửa thành cổng 8090
               method: 'POST',
               headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
               // [MỚI] Truyền thêm categoryId vào Body
               body: JSON.stringify({ 
                 productId: cleanId, 
                 categoryId: productData.categoryId, 
                 actionType: 'VIEW' 
               })
             }).catch((err) => console.error("Lỗi bắn log VIEW:", err));
          }

          if (productData.categoryId) {
            fetch(`http://localhost:8083/api/internal/products/filter?categoryId=${productData.categoryId}&size=5`)
              .then(res => res.ok ? res.json() : null)
              .then(data => {
                if (data && data.content) {
                  const filtered = data.content.filter((p: any) => p.productId !== cleanId);
                  setRelatedProducts(filtered.slice(0, 4));
                }
              }).catch(() => {});
          }

          if (productData.brand) {
            fetch(`http://localhost:8083/api/internal/products/filter?brand=${encodeURIComponent(productData.brand)}&size=10`)
              .then(res => res.ok ? res.json() : null)
              .then(data => {
                if (data && data.content) {
                  const filtered = data.content.filter((p: any) => p.productId !== cleanId && p.categoryId !== productData.categoryId);
                  setFrequentlyBought(filtered.slice(0, 2)); 
                }
              }).catch(() => {});
          }
        }

        if (token && userId) {
           const wishRes = await fetch(`http://localhost:8081/api/wishlists/${userId}/check/${cleanId}`, {
             headers: { 'Authorization': `Bearer ${token}` }
           });
           if (wishRes.ok) {
             const isLiked = await wishRes.json();
             setIsWishlisted(isLiked);
           }
        }

      } catch (error) {
        console.error('Network connection error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) { toast.error("Please log in to save this product!"); return; }

    try {
      const cleanId = decodeURIComponent(productId);
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}/${cleanId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const newValue = !isWishlisted;
        setIsWishlisted(newValue);
        toast.success(newValue ? "Added to wishlist!" : "Removed from wishlist!");
        window.dispatchEvent(new Event('wishlistUpdated'));
        if (newValue && product?.categoryId) {
          fetch(`http://localhost:8090/api/recommendations/track`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              productId: cleanId, 
              categoryId: product.categoryId, 
              actionType: 'WISHLIST' 
            })
          }).catch((err) => console.error("Lỗi bắn log WISHLIST:", err));
        }
      }
    } catch (err) { toast.error("Server connection error!"); }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const cleanId = decodeURIComponent(productId);

    if (!token || !userId) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    try {
      // 1. GỌI API THÊM VÀO GIỎ HÀNG (Cart Service)
      const res = await fetch(`http://localhost:8088/api/cart/add`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'userId': userId // Bắt buộc phải có RequestHeader này theo code BE của bạn
        },
        body: JSON.stringify({ 
          productId: cleanId,
          quantity: currentQty
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        // Bắt lỗi hết hàng hoặc lỗi Inventory từ Backend
        toast.error(errorText || "Lỗi khi thêm vào giỏ hàng!");
        return;
      }

      toast.success("Đã thêm vào giỏ hàng!");
      
      // Bắn sự kiện để Header tự động cập nhật số đếm giỏ hàng
      window.dispatchEvent(new Event('cartUpdated'));

      // 2. [AI LOG] TRACK ADD TO CART
      if (product?.categoryId) {
         fetch(`http://localhost:8090/api/recommendations/track`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             productId: cleanId, 
             categoryId: product.categoryId, 
             actionType: 'ADD_TO_CART' 
           })
         }).catch(() => {});
      }
    } catch (err) {
      toast.error("Không thể kết nối đến máy chủ giỏ hàng.");
    }
  }

  const handleBuyNow = () => {
    toast.success("Proceeding to checkout...");
  }

  const currentQty = Number(quantity) || 1; 
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') { setQuantity(''); return; }
    const num = parseInt(val, 10);
    if (!isNaN(num)) setQuantity(num > (product?.stock ?? 0) ? (product?.stock ?? 0) : num);
  };
  const handleQuantityBlur = () => { if (quantity === '' || Number(quantity) < 1) setQuantity(1); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-cyan-600" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500 font-medium">Product Not Found</p></div>;

  const fallbackImage = "https://placehold.co/600x600/f8fafc/94a3b8?text=No+Image";
  const imageUrls = product.mainImage ? product.mainImage.split('|') : [fallbackImage];
  const hasDiscount = product.discountPercentage > 0;
  const salePrice = hasDiscount ? product.price * (1 - product.discountPercentage / 100) : product.price;
  const stockCount = product.stock ?? 0;
  const isOutOfStock = stockCount <= 0;

 return (
    // [NEW] ADD BACKGROUND IMAGE TO WHOLE PAGE (Subtle for less distraction)
    <div className="relative min-h-screen py-8 font-sans overflow-x-hidden bg-slate-50">
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}
      ></div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 flex gap-8 justify-center">
        
        {/* LEFT BANNER (MEGA SALE) -> BECOMES CLICKABLE LINK */}
        <div className="hidden xl:block w-[240px] shrink-0">
          <Link 
            href="/flash-sale" 
            className="block sticky top-28 h-[600px] rounded-3xl overflow-hidden shadow-sm border border-slate-200 group cursor-pointer"
          >
            {/* Cool Gaming/Tech setup image */}
            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop" alt="Flash Sale" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-6 flex flex-col justify-end">
              <span className="text-orange-500 font-black text-4xl mb-1 tracking-tight">MEGA<br/>SALE</span>
              <p className="text-slate-300 text-sm font-medium leading-relaxed group-hover:text-white transition-colors">Up to 80% off on premium tech gadgets this week.</p>
              <div className="mt-4 inline-flex items-center text-xs font-bold text-white uppercase tracking-widest group-hover:text-orange-500 transition-colors">
                Shop Now <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* MAIN CONTENT COLUMN */}
        <div className="w-full max-w-[1200px] flex-1">
          
          {/* Breadcrumb */}
          <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
            <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link> 
            <ChevronRight className="w-4 h-4 mx-2" /> 
            <Link href="/products" className="hover:text-cyan-600 transition-colors">Products</Link> 
            <ChevronRight className="w-4 h-4 mx-2" /> 
            <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 flex flex-col lg:flex-row gap-10 lg:gap-16">
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="relative w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-8 overflow-hidden group">
                {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-slate-900 text-sm font-black px-3 py-1.5 rounded-lg z-10 shadow-sm">
                      {product.discountPercentage}% OFF
                    </div>
                )}
                <img src={imageUrls[activeImage] || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              </div>

              {imageUrls.length > 1 && (
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {imageUrls.map((img, idx) => (
                    <div key={idx} onClick={() => setActiveImage(idx)} className={`w-20 h-20 shrink-0 rounded-xl border-2 p-2 cursor-pointer transition-all ${activeImage === idx ? 'border-cyan-600 bg-cyan-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                      <img src={img} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <Link href={`/seller/${product.shopId}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-700 font-bold rounded-lg transition-all border border-transparent hover:border-cyan-200 uppercase tracking-wide">
                  <Store className="w-4 h-4 text-cyan-600" />{shopName}
                </Link>
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-cyan-600 transition-colors"><Share2 className="w-5 h-5" /></button>
                  <button onClick={handleToggleWishlist} className={`transition-colors ${isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}>
                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {product.brand && (
                <div className="mb-2">
                  <span className="text-sm font-bold text-cyan-600 uppercase tracking-widest bg-cyan-50 px-2.5 py-1 rounded-md">{product.brand}</span>
                </div>
              )}

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4">{product.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-yellow-400">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current text-slate-200" />
                </div>
                <span className="text-sm font-bold text-slate-600 underline cursor-pointer hover:text-cyan-600">4.0 (128 reviews)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>{isOutOfStock ? 'Out of Stock' : `${stockCount} In Stock`}</span>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-black text-cyan-600 tracking-tight">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}</span>
                  {hasDiscount && (
                    <span className="text-lg font-bold text-slate-400 line-through mb-1">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500">Taxes included. Free shipping on qualifying orders.</p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className={`flex items-center bg-slate-100 rounded-2xl p-1 w-full sm:w-32 shrink-0 ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button onClick={() => setQuantity(Math.max(1, currentQty - 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-xl transition-colors font-black text-lg">-</button>
                    <input type="number" value={quantity} onChange={handleQuantityChange} onBlur={handleQuantityBlur} className="flex-1 w-12 text-center font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none -moz-appearance-none outline-none" />
                    <button onClick={() => setQuantity(Math.min(stockCount, currentQty + 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-xl transition-colors font-black text-lg">+</button>
                  </div>

                  <button disabled={isOutOfStock} onClick={handleAddToCart} className={`flex-1 font-black text-lg py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 group ${isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200'}`}>
                    <ShoppingCart className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                    {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                  </button>
                </div>

                <button disabled={isOutOfStock} onClick={handleBuyNow} className={`w-full font-black text-lg py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group ${isOutOfStock ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-cyan-600 hover:-translate-y-0.5'}`}>
                  <CreditCard className="w-5 h-5" />
                  {isOutOfStock ? 'Currently Unavailable' : 'Buy Now / Pay with Card'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-bold text-slate-700">Free Shipping<br/><span className="text-xs font-medium text-slate-500">On orders over $50</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold text-slate-700">1 Year Warranty<br/><span className="text-xs font-medium text-slate-500">100% Secure</span></span>
                </div>
              </div>
            </div>
          </div>

          {frequentlyBought.length > 0 && (
            <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-cyan-600" /> Frequently Bought Together
              </h2>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex items-center gap-4 overflow-x-auto pb-4 md:pb-0 w-full md:w-auto scrollbar-hide">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-2xl border border-cyan-200 p-3 flex items-center justify-center relative shadow-sm">
                      <span className="absolute top-2 left-2 bg-cyan-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">This Item</span>
                      <img src={imageUrls[0]} alt={product.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-sm font-black text-slate-900">${salePrice.toFixed(2)}</span>
                  </div>
                  {frequentlyBought.map((item) => {
                    const itemSalePrice = item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price;
                    const itemImg = item.mainImage ? item.mainImage.split('|')[0] : fallbackImage;
                    return (
                      <React.Fragment key={item.productId}>
                        <div className="text-2xl font-black text-slate-300">+</div>
                        <Link href={`/products/${item.productId}`} className="flex flex-col items-center gap-2 shrink-0 group">
                          <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-2xl border border-slate-100 p-3 flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-md transition-all">
                            <img src={itemImg} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-sm font-black text-slate-900 group-hover:text-cyan-600 transition-colors">${itemSalePrice.toFixed(2)}</span>
                        </Link>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="md:ml-auto flex flex-col items-center md:items-end w-full md:w-auto p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-500 mb-1">Total Price:</span>
                  <span className="text-3xl font-black text-cyan-600 mb-4 tracking-tight">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice + frequentlyBought.reduce((sum, item) => sum + (item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price), 0))}
                  </span>
                  <button className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white font-black rounded-xl hover:bg-cyan-600 hover:-translate-y-0.5 transition-all shadow-md flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Add All to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 flex flex-col gap-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Info className="w-6 h-6 text-cyan-600" /> Product Overview
                </h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                  {product.description ? <p>{product.description}</p> : <p className="italic text-slate-400">No detailed description is available.</p>}
                </div>
              </div>

              {product.specifications && (
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-cyan-600" /> Technical Specifications
                  </h2>
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full text-sm text-left text-slate-600">
                      <tbody>
                        {(() => {
                          try {
                            const specs = JSON.parse(product.specifications);
                            return Object.entries(specs).map(([key, value], idx) => (
                              <tr key={idx} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                                <th className="py-4 px-6 font-bold text-slate-900 w-1/3 bg-slate-50/50 border-r border-slate-200">{key}</th>
                                <td className="py-4 px-6 font-medium">{value as React.ReactNode}</td>
                              </tr>
                            ));
                          } catch (e) {
                            return <tr><td className="py-4 px-6 font-medium">{product.specifications}</td></tr>;
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-cyan-600" /> Reviews</h2>
                <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">4.0 / 5</span>
              </div>
              
              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{review.user}</span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{review.date}</span>
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200 fill-current'}`} />)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">"{review.comment}"</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:border-cyan-600 hover:text-cyan-600 transition-colors">Write a Review</button>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16 mb-8">
              <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p) => {
                  const pHasDiscount = p.discountPercentage > 0;
                  const pSalePrice = pHasDiscount ? p.price * (1 - p.discountPercentage / 100) : p.price;
                  const pImageUrl = p.mainImage ? p.mainImage.split('|')[0] : fallbackImage;
                  
                  return (
                    <Link href={`/products/${p.productId}`} key={p.productId} className="group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
                      <div className="w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-slate-100 transition-colors border border-slate-50 overflow-hidden">
                        <img src={pImageUrl} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 p-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 h-10">{p.name}</h3>
                      <div className="flex flex-col gap-1">
                        <span className="text-xl font-black text-cyan-600">${pSalePrice.toFixed(2)}</span>
                        {pHasDiscount && <span className="text-xs font-bold text-slate-400 line-through">${p.price.toFixed(2)}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT BANNER (NEW ARRIVAL) -> BECOMES CLICKABLE LINK */}
       <div className="hidden xl:block w-[240px] shrink-0">
          <Link 
            href="/new-releases" 
            className="block sticky top-28 h-[600px] rounded-3xl overflow-hidden shadow-sm border border-slate-200 group cursor-pointer"
          >
            {/* Modern smart device image */}
            <img src="https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=600&auto=format&fit=crop" alt="New Releases" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-6 flex flex-col justify-end">
              <span className="text-cyan-500 font-black text-4xl mb-1 tracking-tight">NEW<br/>ARRIVALS</span>
              <p className="text-slate-300 text-sm font-medium leading-relaxed group-hover:text-white transition-colors">Discover the latest and greatest in high-end accessories.</p>
              <div className="mt-4 inline-flex items-center text-xs font-bold text-white uppercase tracking-widest group-hover:text-cyan-500 transition-colors">
                Explore <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}