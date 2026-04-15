"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanAPI = API.endsWith('/') ? API.slice(0, -1) : API;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (amount: number, packageCredits: number) => {
    setLoading(true);
    const resScript = await loadRazorpayScript();
    
    if (!resScript) {
      alert("Razorpay SDK failed to load. Are you connected to the internet?");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${cleanAPI}/payments/create-order?amount=${amount}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Could not create order");
      const orderData = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "dummy_key", 
        amount: orderData.amount,
        currency: "INR",
        name: "ContentWala AI",
        description: `${packageCredits} Credits Package`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${cleanAPI}/payments/verify`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount
              })
            });
            
            if (verifyRes.ok) {
              alert("Payment Successful! Credits added.");
              router.push('/dashboard');
              window.location.reload();
            } else {
              alert("Payment verification failed.");
            }
          } catch(e) {
            console.error(e);
          }
        },
        theme: {
          color: "#512D93" 
        }
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-[#512D93] via-[#8547C6] to-[#EB7452] pt-32 pb-60 px-8 text-center text-white overflow-hidden relative">
        {/* Abstract Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
           <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
             Simple, <span className="text-[#FFC43A]">No-Fuss</span> Credits
           </h1>
           <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
             Buy credits as you need them. No monthly subscriptions, no recurring bills. Just pure AI magic.
           </p>
           
           <div className="mt-8 mx-auto w-max bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-8 py-2 shadow-2xl">
             <p className="text-[#FFC43A] font-black uppercase tracking-[0.2em] text-xs">💰 1 Generation = 3 Credits</p>
           </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-8 -mt-40 pb-32 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Starter Card */}
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.15)] transition-all flex flex-col items-center text-center group">
             <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl text-purple-600 font-black">S</span>
             </div>
             <h2 className="text-2xl font-black text-[#512D93] mb-2">Starter Pack</h2>
             <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-gray-900">₹99</span>
                <span className="text-gray-400 font-bold text-sm">one-time</span>
             </div>

             <div className="w-full bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100">
                <p className="text-4xl font-black text-[#FFC43A] mb-1">20</p>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Total Credits</p>
                <div className="h-px w-12 bg-gray-200 mx-auto my-4"></div>
                <p className="text-sm font-bold text-gray-600">Generates ~6 Clips</p>
             </div>

             <ul className="text-left space-y-4 mb-10 flex-1 w-full px-4">
                <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                   <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   Watermark Free
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                   <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   Standard API Access
                </li>
             </ul>

             <button 
               disabled={loading}
               onClick={() => handlePayment(9900, 20)}
               className="w-full bg-gray-100 hover:bg-gray-200 text-[#512D93] py-4 rounded-full font-black text-xs tracking-widest transition-all uppercase disabled:opacity-50"
             >
               Buy Starter Pack
             </button>
          </div>

          {/* Creator ContentWala Special */}
          <div className="bg-white p-12 rounded-[3.5rem] border-[3px] border-[#FFC43A] shadow-[0_40px_120px_-40px_rgba(255,196,58,0.3)] hover:shadow-[0_60px_150px_-50px_rgba(255,196,58,0.4)] transition-all flex flex-col items-center text-center relative transform lg:-translate-y-8">
             <div className="absolute -top-6 bg-[#FFC43A] text-[#512D93] px-8 py-3 rounded-full font-black text-[10px] tracking-widest uppercase shadow-xl">
                MOST POPULAR
             </div>
             
             <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                <span className="text-4xl text-orange-600 font-black">C</span>
             </div>
             <h2 className="text-3xl font-black text-[#512D93] mb-2">Creator Hub</h2>
             <div className="flex items-baseline gap-1 mb-8">
                <span className="text-6xl font-black text-gray-900">₹199</span>
                <span className="text-gray-400 font-bold text-sm">one-time</span>
             </div>

             <div className="w-full bg-[#FFC43A]/10 rounded-[2.5rem] p-10 mb-8 border border-[#FFC43A]/20">
                <p className="text-5xl font-black text-[#512D93] mb-1">50</p>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest leading-none">Total Credits</p>
                <div className="h-px w-16 bg-[#FFC43A]/30 mx-auto my-6"></div>
                <p className="text-sm font-black text-[#512D93]">Generates ~16 Clips</p>
             </div>

             <ul className="text-left space-y-5 mb-12 flex-1 w-full px-4">
                <li className="flex items-center gap-4 text-base font-black text-[#512D93]">
                   <div className="w-6 h-6 bg-[#FFC43A] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-[#512D93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   Priority Processing
                </li>
                <li className="flex items-center gap-4 text-base font-black text-[#512D93]">
                   <div className="w-6 h-6 bg-[#FFC43A] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-[#512D93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   Full HD Exports
                </li>
                <li className="flex items-center gap-4 text-base font-black text-[#512D93]">
                   <div className="w-6 h-6 bg-[#FFC43A] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-[#512D93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   No Watermarks
                </li>
             </ul>

             <button 
               disabled={loading}
               onClick={() => handlePayment(19900, 50)}
               className="w-full bg-[#512D93] hover:bg-[#3D1E70] text-white py-5 rounded-full font-black text-xs tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 uppercase disabled:opacity-50"
             >
               UNLOCK CREATOR HUB
             </button>
          </div>

          {/* Agency Card */}
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.15)] transition-all flex flex-col items-center text-center group">
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl text-blue-600 font-black">A</span>
             </div>
             <h2 className="text-2xl font-black text-[#512D93] mb-2">Agency Bundle</h2>
             <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-gray-900">₹499</span>
                <span className="text-gray-400 font-bold text-sm">one-time</span>
             </div>

             <div className="w-full bg-gray-50 rounded-[2rem] p-8 mb-8 border border-gray-100">
                <p className="text-4xl font-black text-blue-600 mb-1">150</p>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Total Credits</p>
                <div className="h-px w-12 bg-gray-200 mx-auto my-4"></div>
                <p className="text-sm font-bold text-gray-600">Generates ~50 Clips</p>
             </div>

             <ul className="text-left space-y-4 mb-10 flex-1 w-full px-4">
                <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                   <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   24/7 Dedicated Support
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                   <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   Early Beta Features
                </li>
             </ul>

             <button 
               disabled={loading}
               onClick={() => handlePayment(49900, 150)}
               className="w-full bg-gray-100 hover:bg-gray-200 text-[#512D93] py-4 rounded-full font-black text-xs tracking-widest transition-all uppercase disabled:opacity-50"
             >
               Buy Agency Pack
             </button>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-20 text-center border-t border-gray-100">
         <p className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-10">Safe and Secure Payments via Razorpay</p>
         <div className="flex justify-center gap-10 opacity-30 grayscale items-center">
            <span className="font-black text-2xl tracking-tighter">VISA</span>
            <span className="font-black text-2xl tracking-tighter">MasterCard</span>
            <span className="font-black text-2xl tracking-tighter">UPI</span>
            <span className="font-black text-2xl tracking-tighter">NetBanking</span>
         </div>
      </section>
    </div>
  );
}
