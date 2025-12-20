import React from 'react';
import { TrendingDown, CalendarDays } from 'lucide-react';
import { Ingredient, Reservation, RecipeItem } from '../types';

interface ProcurementViewProps {
  reservations: Reservation[];
  recipes: Record<number, RecipeItem[]>;
  ingredients: Ingredient[];
  executeBatchProcurement: (list: Ingredient[]) => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({ 
  reservations, recipes, ingredients, executeBatchProcurement 
}) => {
  const futureDemand: Record<number, number> = {}; 
  reservations.filter(r => r.status === 'booked').forEach(res => {
      res.items.forEach(dishItem => {
          const recipe = recipes[dishItem.id];
          if (recipe) {
              recipe.forEach(rItem => {
                  futureDemand[rItem.ingredientId] = (futureDemand[rItem.ingredientId] || 0) + (rItem.amount * dishItem.count);
              });
          }
      });
  });

  const procurementList: Ingredient[] = [];
  ingredients.forEach(ing => {
      const demand = futureDemand[ing.id] || 0;
      const needed = (ing.threshold * 2 + demand) - ing.quantity;
      if (needed > 0) {
          procurementList.push({
              ...ing,
              demand: demand,
              suggestedAmount: parseFloat(needed.toFixed(2)),
              estimatedCost: parseFloat((needed * ing.cost).toFixed(2))
          });
      }
  });

  const totalEstimatedCost = procurementList.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2"><TrendingDown /> 智能采购 (含预约备货)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <CalendarDays className="text-purple-600" />
                  <div>
                      <h4 className="font-bold text-purple-900">未来预约物料需求</h4>
                      <p className="text-sm text-purple-700">系统已自动统计待履约的预约单，并计入下方采购建议。</p>
                  </div>
              </div>
              <div className="text-right">
                  <span className="text-2xl font-bold text-purple-800">{reservations.filter(r => r.status === 'booked').length}</span> <span className="text-xs text-purple-600">单预约待备料</span>
              </div>
           </div>

          {procurementList.length === 0 ? <div className="bg-green-50 p-8 text-center text-green-800 rounded-xl">无需采购，库存能满足现有及预约需求</div> : procurementList.map(item => (
              <div key={item.id} className="bg-white border border-red-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                      <div className="font-bold flex items-center gap-2">
                          {item.name} 
                          {item.quantity < item.threshold && <span className="text-xs bg-red-100 text-red-600 px-2 rounded">库存告急</span>}
                          {(item.demand || 0) > 0 && <span className="text-xs bg-purple-100 text-purple-600 px-2 rounded">预约需求: {(item.demand || 0).toFixed(1)}{item.unit}</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                          当前: {item.quantity} | 阈值: {item.threshold} | 缺口: {(item.suggestedAmount || 0).toFixed(1)} {item.unit}
                      </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                      <div className="text-sm text-gray-500">建议采购</div>
                      <div className="font-bold text-xl text-blue-600">{item.suggestedAmount} <span className="text-sm text-gray-500">{item.unit}</span></div>
                      <div className="text-xs text-gray-400">预计 ¥{item.estimatedCost}</div>
                  </div>
              </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">采购执行单</h3>
          <div className="flex justify-between text-sm mb-6"><span className="text-gray-500">预计总支出</span><span className="font-bold text-lg">¥{totalEstimatedCost.toFixed(0)}</span></div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold disabled:bg-gray-300" disabled={procurementList.length === 0} onClick={() => executeBatchProcurement(procurementList)}>一键采购 (财务联动)</button>
        </div>
      </div>
    </div>
  );
};