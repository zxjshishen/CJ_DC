import React from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { Transaction, Order, Ingredient, Reservation } from '../types';

interface DashboardViewProps {
  transactions: Transaction[];
  orders: Order[];
  ingredients: Ingredient[];
  reservations: Reservation[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  transactions, orders, ingredients, reservations 
}) => {
  // 计算今日数据
  const today = new Date().toLocaleDateString();
  const todayTransactions = transactions.filter(t => new Date().toLocaleDateString() === today || true); // 简化逻辑，实际应解析 t.time
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockCount = ingredients.filter(i => i.quantity < i.threshold).length;
  const upcomingReservations = reservations.filter(r => r.status === 'booked').length;

  const StatCard = ({ title, value, sub, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {sub && <p className={`text-xs mt-2 ${color} font-medium`}>{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Activity className="text-blue-600" /> 
        经营概况
      </h2>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="总营收" 
          value={`¥${totalIncome.toLocaleString()}`} 
          sub="+12% 较昨日" 
          icon={DollarSign} 
          color="text-green-600" 
          bg="bg-green-50" 
        />
        <StatCard 
          title="总订单数" 
          value={totalOrders} 
          sub={`${pendingOrders} 单正在制作`} 
          icon={ShoppingBag} 
          color="text-blue-600" 
          bg="bg-blue-50" 
        />
        <StatCard 
          title="库存预警" 
          value={lowStockCount} 
          sub={lowStockCount > 0 ? "急需补货" : "库存充足"} 
          icon={AlertTriangle} 
          color="text-orange-600" 
          bg="bg-orange-50" 
        />
        <StatCard 
          title="待履约预约" 
          value={upcomingReservations} 
          sub="即将到店" 
          icon={Users} 
          color="text-purple-600" 
          bg="bg-purple-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">实时订单动态</h3>
            <span className="text-xs text-gray-500">最近5笔</span>
          </div>
          <div className="flex-1 overflow-auto">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无订单数据</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {[...orders].reverse().slice(0, 5).map(order => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">#{order.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {order.status === 'pending' ? '制作中' : '已完成'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.tableNo}桌 • {order.items.length}个菜品
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">¥{order.total}</div>
                      <div className="text-xs text-gray-400">{order.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 财务流水概览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">最近资金变动</h3>
            <TrendingUp size={16} className="text-gray-400"/>
          </div>
          <div className="flex-1 overflow-auto">
             {transactions.length === 0 ? (
               <div className="p-8 text-center text-gray-400">暂无财务记录</div>
             ) : (
               <div className="divide-y divide-gray-100">
                 {transactions.slice(0, 5).map(tx => (
                   <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                         {tx.type === 'income' ? <TrendingUp size={16} className="text-green-600"/> : <TrendingUp size={16} className="text-red-600 rotate-180"/>}
                       </div>
                       <div>
                         <div className="font-medium text-sm text-gray-800">{tx.category}</div>
                         <div className="text-xs text-gray-500 truncate max-w-[150px]">{tx.description}</div>
                       </div>
                     </div>
                     <div className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                       {tx.type === 'income' ? '+' : '-'}¥{tx.amount}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};