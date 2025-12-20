import React, { useState } from 'react';
import { Calendar, Users, Plus, Minus, CalendarDays, Clock, ClipboardList, Ban } from 'lucide-react';
import { Reservation, Dish, CartItem, TableInfo } from '../types';

interface ReservationViewProps {
  dishes: Dish[];
  reservations: Reservation[];
  handleAddReservation: (res: Partial<Reservation>) => void;
  checkInReservation: (res: Reservation) => void;
  cancelReservation: (id: string) => void;
  showNotification: (msg: string) => void;
}

export const ReservationView: React.FC<ReservationViewProps> = ({
  dishes, reservations, handleAddReservation, checkInReservation, cancelReservation, showNotification
}) => {
  const [resForm, setResForm] = useState({ customer: '', date: '', time: '', guests: 2 });
  const [resCart, setResCart] = useState<CartItem[]>([]);
  const [showDishSelector, setShowDishSelector] = useState(false);

  const handleAddItem = (dish: Dish) => {
      const exist = resCart.find(i => i.id === dish.id);
      if (exist) setResCart(resCart.map(i => i.id === dish.id ? { ...i, count: i.count + 1 } : i));
      else setResCart([...resCart, { ...dish, count: 1 }]);
  };

  const handleRemoveItem = (dish: Dish) => {
      const exist = resCart.find(i => i.id === dish.id);
      if (exist) {
          if (exist.count > 1) {
              setResCart(resCart.map(i => i.id === dish.id ? { ...i, count: i.count - 1 } : i));
          } else {
              setResCart(resCart.filter(i => i.id !== dish.id));
          }
      }
  };

  const submitReservation = () => {
      if (!resForm.customer || !resForm.date || !resForm.time) {
          showNotification("请填写完整的预约信息");
          return;
      }
      handleAddReservation({
          customerName: resForm.customer,
          date: resForm.date,
          time: resForm.time,
          guests: resForm.guests,
          items: resCart
      });
      setResForm({ customer: '', date: '', time: '', guests: 2 });
      setResCart([]);
      setShowDishSelector(false);
  };

  const isImageUrl = (str: string) => typeof str === 'string' && (str.startsWith('blob:') || str.startsWith('http') || str.startsWith('data:'));

  return (
    <div className="h-full overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar /> 新增预约</h3>
            <div className="space-y-4">
                <input className="w-full border p-2 rounded" placeholder="客人姓名/电话" value={resForm.customer} onChange={e => setResForm({...resForm, customer: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="border p-2 rounded" value={resForm.date} onChange={e => setResForm({...resForm, date: e.target.value})} />
                  <input type="time" className="border p-2 rounded" value={resForm.time} onChange={e => setResForm({...resForm, time: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-gray-500"/>
                    <input type="number" className="border p-2 rounded w-20" value={resForm.guests} onChange={e => setResForm({...resForm, guests: parseInt(e.target.value)})} />
                    <span className="text-sm text-gray-500">人用餐</span>
                </div>
                
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">预点菜品 ({resCart.length})</span>
                        <button onClick={() => setShowDishSelector(!showDishSelector)} className="text-blue-600 text-xs font-bold">+ 添加</button>
                    </div>
                    
                    {showDishSelector && (
                        <div className="bg-gray-50 p-2 rounded mb-2 h-32 overflow-y-auto border">
                            {dishes.map(d => (
                                <div key={d.id} onClick={() => handleAddItem(d)} className="flex justify-between items-center p-1 hover:bg-gray-200 cursor-pointer text-sm">
                                    <span className="flex items-center gap-2">
                                        {isImageUrl(d.image) ? <img src={d.image} className="w-6 h-6 object-cover rounded" alt=""/> : d.image} 
                                        {d.name}
                                    </span>
                                    <Plus size={14}/>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {resCart.map(item => (
                            <div key={item.id} className="text-sm flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleRemoveItem(item)}
                                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 flex items-center justify-center w-6 h-6"
                                    >
                                      <Minus size={12}/>
                                    </button>
                                    <span className="font-mono w-4 text-center">{item.count}</span>
                                    <button 
                                      onClick={() => handleAddItem(item)}
                                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 flex items-center justify-center w-6 h-6"
                                    >
                                      <Plus size={12}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {resCart.length === 0 && <div className="text-gray-400 text-xs text-center py-2">暂无预点菜品</div>}
                    </div>
                </div>

                <button onClick={submitReservation} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold mt-4">创建预约单</button>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-gray-700">即将到来的预约</h3>
            {reservations.length === 0 ? <div className="text-gray-400 text-center py-10">暂无预约</div> : reservations.map(res => (
                <div key={res.id} className={`bg-white p-4 rounded-xl shadow-sm border border-l-4 flex justify-between items-center ${res.status === 'booked' ? 'border-l-blue-500' : (res.status === 'cancelled' ? 'border-l-gray-300 opacity-60' : 'border-l-green-500 opacity-60')}`}>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-lg ${res.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>{res.customerName}</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1"><Users size={14}/> {res.guests}人</span>
                            {res.status === 'checked_in' && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">已到店</span>}
                            {res.status === 'cancelled' && <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded flex items-center gap-1"><Ban size={10}/> 已取消</span>}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex gap-3">
                            <span className="flex items-center gap-1"><CalendarDays size={14}/> {res.date}</span>
                            <span className="flex items-center gap-1"><Clock size={14}/> {res.time}</span>
                        </div>
                        {res.items.length > 0 && <div className="text-xs text-purple-600 mt-2">预订: {res.items.map(i => `${i.name}x${i.count}`).join(', ')}</div>}
                    </div>
                    
                    {res.status === 'booked' && (
                        <div className="flex flex-col gap-2">
                            <button onClick={() => checkInReservation(res)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 justify-center">
                                <ClipboardList size={14}/> 核销
                            </button>
                            <button onClick={() => cancelReservation(res.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 justify-center border border-red-200">
                                <Ban size={14}/> 取消
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};