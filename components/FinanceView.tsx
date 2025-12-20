import React, { useState } from 'react';
import { PieChart } from 'lucide-react';
import { Transaction } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

interface FinanceViewProps {
  transactions: Transaction[];
  addTransaction: (type: 'income' | 'expense', category: string, amount: number, desc: string, needInvoice: boolean) => void;
  showNotification: (msg: string) => void;
  updateInvoiceStatus: (txId: string, no: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  transactions, addTransaction, showNotification, updateInvoiceStatus 
}) => {
  const [financeTab, setFinanceTab] = useState<'overview' | 'record' | 'invoice'>('overview'); 
  const [newExpense, setNewExpense] = useState({ category: '水电煤费', amount: '', desc: '', needInvoice: true });
  const [invoiceInputs, setInvoiceInputs] = useState<Record<string, string>>({});
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const profit = totalIncome - totalExpense;
  
  const pendingInvoices = transactions.filter(t => t.invoiceStatus === 'pending');

  const handleRecordExpense = () => {
      if (!newExpense.amount) return;
      addTransaction('expense', newExpense.category, parseFloat(newExpense.amount), newExpense.desc || newExpense.category, newExpense.needInvoice);
      showNotification("支出已记账");
      setNewExpense({ category: '水电煤费', amount: '', desc: '', needInvoice: true });
      setFinanceTab('overview');
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2"><PieChart /> 财务与票据中心</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100"><div className="text-xs text-gray-500 mb-1">总营收</div><div className="text-2xl font-bold text-gray-900">¥{totalIncome.toFixed(0)}</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100"><div className="text-xs text-gray-500 mb-1">总支出</div><div className="text-2xl font-bold text-gray-900">¥{totalExpense.toFixed(0)}</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100"><div className="text-xs text-gray-500 mb-1">净利润</div><div className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>¥{profit.toFixed(0)}</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 cursor-pointer hover:bg-orange-50" onClick={() => setFinanceTab('invoice')}><div className="text-xs text-gray-500 mb-1">待处理票据</div><div className="text-2xl font-bold text-orange-600">{pendingInvoices.length} <span className="text-xs font-normal text-gray-400">笔</span></div></div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          <button onClick={() => setFinanceTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold ${financeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>流水明细</button>
          <button onClick={() => setFinanceTab('record')} className={`px-4 py-2 rounded-lg text-sm font-bold ${financeTab === 'record' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>+ 记一笔支出</button>
          <button onClick={() => setFinanceTab('invoice')} className={`px-4 py-2 rounded-lg text-sm font-bold ${financeTab === 'invoice' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>发票管理</button>
      </div>

      {financeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm"><thead className="text-gray-500 border-b bg-gray-50"><tr><th className="p-4">时间</th><th className="p-4">类别</th><th className="p-4">描述</th><th className="p-4">金额</th><th className="p-4">票据</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                      {transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-gray-50">
                              <td className="p-4 text-gray-400 text-xs">{tx.time}</td>
                              <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.category}</span></td>
                              <td className="p-4">{tx.description}</td>
                              <td className={`p-4 font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'income' ? '+' : '-'}¥{tx.amount}</td>
                              <td className="p-4">{tx.invoiceStatus === 'completed' ? <span className="text-green-600 text-xs">已核销</span> : (tx.invoiceStatus === 'pending' ? <span className="text-orange-500 text-xs">待处理</span> : <span className="text-gray-300 text-xs">-</span>)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {financeTab === 'record' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-bold text-lg mb-6">录入杂项支出</h3>
              <select className="w-full border p-3 rounded-lg" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input type="number" className="w-full border p-3 rounded-lg" placeholder="金额" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})}/>
              <input type="text" className="w-full border p-3 rounded-lg" placeholder="备注" value={newExpense.desc} onChange={e => setNewExpense({...newExpense, desc: e.target.value})}/>
              <div className="flex items-center gap-2"><input type="checkbox" checked={newExpense.needInvoice} onChange={e => setNewExpense({...newExpense, needInvoice: e.target.checked})}/> <label>后续需要补发票 (待收票)</label></div>
              <button onClick={handleRecordExpense} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">确认记账</button>
          </div>
      )}

      {financeTab === 'invoice' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">类型</th><th className="p-4">摘要</th><th className="p-4">金额</th><th className="p-4">操作</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                      {pendingInvoices.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-400">目前没有待处理的票据</td></tr> : pendingInvoices.map(tx => (
                          <tr key={tx.id}>
                              <td className="p-4">{tx.type === 'income' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">待开票 (收入)</span> : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">待收票 (支出)</span>}</td>
                              <td className="p-4"><div className="font-medium">{tx.description}</div><div className="text-xs text-gray-400">{tx.time} - {tx.category}</div></td>
                              <td className="p-4 font-bold">¥{tx.amount}</td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <input 
                                    placeholder="输入票号..." 
                                    className="border rounded px-2 py-1 text-xs w-24" 
                                    value={invoiceInputs[tx.id] || ''} 
                                    onChange={(e) => setInvoiceInputs({...invoiceInputs, [tx.id]: e.target.value})}
                                  />
                                  <button onClick={() => {
                                      const val = invoiceInputs[tx.id];
                                      if(val) updateInvoiceStatus(tx.id, val);
                                      else showNotification("请输入发票号");
                                    }} 
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    核销
                                  </button>
                                </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};