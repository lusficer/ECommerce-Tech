'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Package, ShoppingBag, Loader2, Clock, CheckCircle2, 
  XCircle, Truck, ChevronRight, Store, Star, X, Upload, 
  Image as ImageIcon, AlertTriangle
} from 'lucide-react';

const ORDER_TABS = [
  { id: 'ALL', label: 'All Orders', statuses: [] },
  { id: 'PENDING', label: 'Pending', statuses: ['NEW', 'PENDING_VERIFICATION', 'PROCESSING', 'READY_TO_SHIP'] },
  { id: 'SHIPPING', label: 'Shipping', statuses: ['SHIPPING'] },
  { id: 'COMPLETED', label: 'Completed', statuses: ['DELIVERED', 'COMPLETED'] },
  { id: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED', 'REJECTED', 'RETURNED', 'DELIVERY_FAILED'] }
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(4);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: '' });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null); 
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast.error('Please login to view your orders');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/history`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrders(data);

        const uniqueShopIds = Array.from(new Set(data.map((order: any) => order.shopId)));
        const namesMap: Record<string, string> = {};
        
        await Promise.all(
          uniqueShopIds.map(async (shopIdStr) => {
            try {
               const shopRes = await fetch(`http://localhost:8082/api/shops/${shopIdStr}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
               });
               if (shopRes.ok) {
                 const shopData = await shopRes.json();
                 namesMap[shopIdStr as string] = shopData.shopName || (shopIdStr as string);
               } else {
                 namesMap[shopIdStr as string] = (shopIdStr as string);
               }
            } catch (e) {
               namesMap[shopIdStr as string] = (shopIdStr as string);
            }
          })
        );
        setShopNames(namesMap);
      } else {
        toast.error('Failed to load order history');
      }
    } catch (err) {
      toast.error('Cannot connect to server!');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    setActionLoadingId(orderId);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'userId': userId || ''
        }
      });

      if (res.ok) {
        toast.success('Thank you! Order has been completed.');
        fetchOrderHistory();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Cannot complete order.');
      }
    } catch (err) {
      toast.error('Server connection error.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCancelModal = (orderId: string) => {
    setCancelModal({ isOpen: true, orderId });
  };

  const executeCancelOrder = async () => {
    const { orderId } = cancelModal;
    setCancelModal({ isOpen: false, orderId: '' });
    setActionLoadingId(orderId);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'userId': userId || ''
        }
      });

      if (res.ok) {
        toast.success('Order has been cancelled successfully.');
        fetchOrderHistory(); 
      } else {
        const err = await res.json();
        toast.error(err.message || 'Cannot cancel order.');
      }
    } catch (err) {
      toast.error('Server connection error.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_VERIFICATION':
        return { color: 'text-blue-600', icon: Clock, label: 'Pending' };
      case 'PROCESSING':
      case 'READY_TO_SHIP':
        return { color: 'text-yellow-600', icon: Package, label: 'Processing' };
      case 'SHIPPING':
        return { color: 'text-purple-600', icon: Truck, label: 'Shipping' };
      case 'DELIVERED':
      case 'COMPLETED':
        return { color: 'text-green-600', icon: CheckCircle2, label: 'Completed' };
      case 'CANCELLED':
      case 'REJECTED':
      case 'RETURNED':
      case 'DELIVERY_FAILED':
        return { color: 'text-red-600', icon: XCircle, label: 'Cancelled' };
      default:
        return { color: 'text-slate-600', icon: Package, label: status };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ALL') return true;
    const tab = ORDER_TABS.find(t => t.id === activeTab);
    return tab?.statuses.includes(order.orderStatus);
  });

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  const openReviewModal = (order: any, item: any) => {
    setReviewTarget({
      orderId: order.orderId,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/100x100?text=No+Image',
    });
    setRating(5);
    setComment('');
    setReviewImages([]);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewTarget(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (reviewImages.length + files.length > 5) {
        toast.error('You can only upload up to 5 images.');
        return;
      }
      const newImages = files.map(file => URL.createObjectURL(file));
      setReviewImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitReview = async () => {
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('fullName') || localStorage.getItem('username') || 'Valued Customer';

      const payload = {
        orderId: reviewTarget.orderId,
        userName: userName,
        rating: rating,
        comment: comment,
        images: reviewImages 
      };

      const res = await fetch(`http://localhost:8083/api/products/${reviewTarget.productId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Thank you! Your review has been submitted.");
        closeReviewModal();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to submit review");
      }
    } catch (error) {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans relative">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Orders</h1>
        </div>

        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 mb-6 shadow-sm">
          <div className="flex overflow-x-auto hide-scrollbar">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setVisibleCount(4); }}
                className={`flex-1 min-w-[120px] py-4 px-2 text-sm font-bold text-center transition-all whitespace-nowrap border-b-2 
                  ${activeTab === tab.id 
                    ? 'border-cyan-600 text-cyan-600' 
                    : 'border-transparent text-slate-500 hover:text-cyan-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 flex flex-col items-center justify-center border border-slate-200 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-black text-slate-800 mb-2">No Orders Found</h2>
            <p className="text-slate-500 text-sm mb-6">You don't have any orders in this status.</p>
            <Link href="/products" className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const statusInfo = getStatusBadge(order.orderStatus);
              const StatusIcon = statusInfo.icon;
              const shopName = shopNames[order.shopId] || 'Loading Shop...'; 
              const isActionLoading = actionLoadingId === order.orderId;

              return (
                <div key={order.orderId} className={`bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isActionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  
                  <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-black text-slate-900">{shopName}</span>
                      <Link href={`/seller/${order.shopId}`} className="hidden sm:inline-flex px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded hover:bg-slate-300 transition-colors">
                        View Shop
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 text-sm font-bold uppercase ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" /> {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 cursor-pointer" onClick={() => router.push(`/orders/${order.orderId}`)}>
                    <div className="space-y-4">
                      {order.orderItems?.slice(0, 2).map((item: any, idx: number) => {
                        const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/100x100?text=No+Image';
                        return (
                          <div key={idx} className="flex items-start gap-4">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                              <img src={img} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row justify-between">
                              <div className="pr-4">
                                <p className="text-base font-bold text-slate-900 line-clamp-2">{item.productName}</p>
                                <p className="text-sm font-medium text-slate-500 mt-1">x{item.quantity}</p>
                              </div>
                              <div className="mt-2 sm:mt-0 text-left sm:text-right shrink-0">
                                <span className="text-base font-black text-cyan-600">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {order.orderItems?.length > 2 && (
                      <div className="mt-4 text-sm font-medium text-slate-500 border-t border-dashed border-slate-200 pt-3">
                        View {order.orderItems.length - 2} more product(s)
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-auto text-right sm:text-left flex items-center justify-end gap-2">
                      <span className="text-sm text-slate-600 font-medium">Order Total:</span>
                      <span className="text-xl font-black text-cyan-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.grandTotal)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                      
                      {(order.orderStatus === 'NEW' || order.orderStatus === 'PENDING_VERIFICATION') && (
                        <button 
                          onClick={() => openCancelModal(order.orderId)}
                          disabled={isActionLoading}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-bold text-sm rounded-sm transition-colors disabled:opacity-50"
                        >
                          {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Cancel
                        </button>
                      )}

                      {order.orderStatus === 'DELIVERED' && (
                        <button 
                          onClick={() => handleConfirmReceipt(order.orderId)}
                          disabled={isActionLoading}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-sm shadow-sm transition-colors disabled:opacity-50"
                        >
                          {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Confirm Receipt
                        </button>
                      )}

                      {(order.orderStatus === 'DELIVERED' || order.orderStatus === 'COMPLETED') && (
                        <button 
                          onClick={() => openReviewModal(order, order.orderItems[0])}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-sm hover:bg-orange-600 transition-all shadow-sm"
                        >
                          <Star className="w-4 h-4" /> Rate
                        </button>
                      )}

                      <Link 
                        href={`/orders/${order.orderId}`}
                        className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-sm hover:bg-slate-50 transition-all shadow-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}

            {visibleCount < filteredOrders.length && (
              <div className="flex justify-center pt-4 pb-8">
                <button 
                  onClick={() => setVisibleCount(p => p + 4)}
                  className="px-8 py-3 bg-white border border-cyan-200 text-cyan-700 font-bold rounded-full shadow-sm hover:bg-cyan-50 hover:border-cyan-300 transition-all flex items-center gap-2"
                >
                  Load More Orders <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-red-50">
              <h3 className="font-black text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancel Order
              </h3>
              <button 
                onClick={() => setCancelModal({ isOpen: false, orderId: '' })}
                className="text-red-400 hover:text-red-700 hover:bg-red-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-2">
                Are you sure you want to cancel order <span className="font-bold text-slate-900">#{cancelModal.orderId}</span>?
              </p>
              <p className="text-xs text-slate-500">
                This action cannot be undone. If you applied any discount codes, they might not be returned.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setCancelModal({ isOpen: false, orderId: '' })}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Keep Order
              </button>
              <button 
                onClick={executeCancelOrder}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isReviewModalOpen && reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeReviewModal}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">Rate Product</h3>
              <button onClick={closeReviewModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-1 flex shrink-0">
                  <img src={reviewTarget.productImage} alt="Product" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">{reviewTarget.productName}</p>
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <p className="text-sm font-bold text-slate-600 mb-2">Product Quality</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-orange-500 mt-2">
                  {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Poor' : rating === 1 ? 'Terrible' : ''}
                </p>
              </div>

              <div className="mb-4">
                <textarea 
                  rows={4}
                  placeholder="Share more thoughts on the product to help other buyers..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors resize-none placeholder-slate-400"
                ></textarea>
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  {reviewImages.map((imgUrl, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group">
                      <img src={imgUrl} alt="Upload preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {reviewImages.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-500 cursor-pointer transition-colors bg-slate-50 hover:bg-cyan-50/50">
                      <ImageIcon className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold">Add Photo</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Upload up to 5 images (JPG, PNG).</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button 
                onClick={closeReviewModal}
                disabled={isSubmittingReview}
                className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitReview}
                disabled={isSubmittingReview}
                className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}