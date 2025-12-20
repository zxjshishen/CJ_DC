import React, { useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Dish, CartItem, TableInfo } from '../types';

interface POSViewProps {
  dishes: Dish[];
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  placeOrder: (items: CartItem[], tableInfo: TableInfo) => void;
  checkAvailability: (dishId: number) => boolean;
  posTableNo: string;
  setPosTableNo: (no: string) => void;
  posGuestCount: number;
  setPosGuestCount: (count: number) => void;
  posNeedInvoice: boolean;
  setPosNeedInvoice: (need: boolean) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  dishes, cart, setCart, placeOrder, checkAvailability,
  posTableNo, setPosTableNo, posGuestCount, setPosGuestCount,
  posNeedInvoice, setPosNeedInvoice
}) => {
  const addToCart = (dish: Dish) => {
    const existing = cart.find(item => item.id === dish.id);
    if (existing) {
      setCart(cart.map(item => item.id === dish.id ? { ...item, count: item.count + 1 } : item));
    } else {
      setCart([...cart, { ...dish, count: 1 }]);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.count, 0);
  const isImageUrl = (str: string) => typeof str === 'string' && (str.startsWith('blob:') || str.startsWith('http') || str.startsWith('data:'));

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">菜单列表 (即时单)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {dishes.map(dish => {
            const available = checkAvailability(dish.id);
            return (
              <div key={dish.id} 
                className={`flex flex-col rounded-xl border-2 overflow-hidden transition-all h-full ${available ? 'border-gray-200 bg-white hover:border-orange-500 cursor-pointer shadow-sm hover:shadow-md' : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}
                onClick={() => available && addToCart(dish)}
              >
                <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  {isImageUrl(dish.image) ? (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-6xl">{dish.image}</span>
                  )}
                  {!available && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold shadow-lg text-sm">已售罄</span>
                      </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div><div className="font-bold text-lg text-gray-800">{dish.name}</div></div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-orange-600 font-bold text-lg">¥{dish.price}</span>
                    {available && <div className="bg-orange-100 text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition-colors"><Plus size={16} /></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[50vh] lg:h-full">
        <div className="p-4 border-b bg-gray-50 rounded-t-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-700"><ShoppingCart size={20}/> 当前订单</h3>
            
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-2">
                <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 font-bold block mb-1">桌号 *</label>
                        <input 
                          className="w-full border p-1.5 rounded text-sm text-center font-bold text-gray-900" 
                          placeholder="A01"
                          value={posTableNo}
                          onChange={(e) => setPosTableNo(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 font-bold block mb-1">人数</label>
                        <input 
                          type="number" 
                          className="w-full border p-1.5 rounded text-sm text-center text-gray-900" 
                          value={posGuestCount}
                          onChange={(e) => setPosGuestCount(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? <div className="text-center text-gray-400 mt-10">请选择菜品</div> : cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <div><div className="font-medium text-gray-800">{item.name}</div><div className="text-xs text-gray-500">¥{item.price} x {item.count}</div></div>
                <div className="font-bold text-gray-800">¥{item.price * item.count}</div>
              </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <div className="mb-4 flex items-center gap-2">
             <input type="checkbox" id="invoice" checked={posNeedInvoice} onChange={(e) => setPosNeedInvoice(e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"/>
             <label htmlFor="invoice" className="text-sm text-gray-600 select-none">客人需开发票</label>
          </div>
          <div className="flex justify-between text-xl font-bold mb-4 text-gray-800"><span>总计</span><span>¥{totalAmount}</span></div>
          <button 
              onClick={() => placeOrder(cart, { tableNo: posTableNo, guestCount: posGuestCount })} 
              disabled={cart.length === 0} 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
          >
              下单并通知厨房
          </button>
        </div>
      </div>
    </div>
  );
};