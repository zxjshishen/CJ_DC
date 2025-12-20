import React from 'react';
import { ChefHat, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';

interface KDSViewProps {
  orders: Order[];
  completeOrder: (id: string) => void;
}

export const KDSView: React.FC<KDSViewProps> = ({ orders, completeOrder }) => {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><ChefHat /> 厨房显示系统</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingOrders.map(order => (
          <div key={order.id} className={`bg-white border-l-4 shadow-sm rounded-r-lg p-4 ${order.isReservation ? 'border-purple-500' : 'border-orange-500'}`}>
            <div className="flex justify-between items-start mb-3 border-b pb-2">
              <div>
                  <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${order.isReservation ? 'text-purple-600' : 'text-orange-600'}`}>#{order.id}</span>
                      {/* 显示桌号 */}
                      <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-sm font-bold">{order.tableNo}桌</span>
                  </div>
                  {order.isReservation && <div className="text-xs bg-purple-100 text-purple-700 px-1 rounded inline-block mt-1">预约单</div>}
              </div>
              <div className="text-right">
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold">待制作</span>
                  <div className="text-xs text-gray-400 mt-1">{order.guestCount}人用餐</div>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {order.items.map((item, idx) => (<li key={idx} className="flex justify-between text-gray-700"><span>{item.name}</span><span className="font-bold">x{item.count}</span></li>))}
            </ul>
            <button onClick={() => completeOrder(order.id)} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"><CheckCircle2 size={16}/> 出餐完成</button>
          </div>
        ))}
        {pendingOrders.length === 0 && <div className="col-span-full text-center py-20 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2">当前没有待制作的订单</div>}
      </div>
    </div>
  );
};