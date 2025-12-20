import React, { useState, useRef } from 'react';
import { Package, FileSpreadsheet, Plus, X, Upload, CheckCircle2, Edit } from 'lucide-react';
import { Ingredient } from '../types';

interface InventoryViewProps {
  ingredients: Ingredient[];
  handleSaveIngredient: (ing: Partial<Ingredient>) => void;
  handleBatchImportIngredients: (text: string) => void;
  restockIngredient: (id: number, amount: number) => void;
  showNotification: (msg: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  ingredients, handleSaveIngredient, handleBatchImportIngredients, restockIngredient, showNotification 
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [isGBK, setIsGBK] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (ing: Ingredient) => {
      setEditingId(ing.id);
      setEditForm({ ...ing });
      setIsAdding(false);
      setIsImporting(false);
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditForm({});
  };

  const saveEdit = () => {
      handleSaveIngredient(editForm);
      setEditingId(null);
  };

  const handleAdd = () => {
      handleSaveIngredient(editForm);
      setIsAdding(false);
      setEditForm({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) {
              showNotification("文件过大，请直接复制内容粘贴");
              e.target.value = '';
              return;
          }
          
          const reader = new FileReader();
          reader.onload = (evt) => {
              setImportText(evt.target?.result as string);
              if ((evt.target?.result as string).includes('')) {
                  showNotification("检测到乱码，请尝试勾选“解决乱码”");
              }
          };
          reader.onerror = () => showNotification("文件读取失败");
          reader.readAsText(file, isGBK ? 'GBK' : 'UTF-8');
      }
      e.target.value = '';
  };

  const confirmImport = () => {
      handleBatchImportIngredients(importText);
      setIsImporting(false);
      setImportText('');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Package /> 原材料库存实时监控</h2>
          <div className="flex gap-2">
              <button onClick={() => { setIsImporting(!isImporting); setIsAdding(false); }} className={`text-sm px-3 py-2 rounded-lg flex items-center gap-1 border transition-colors ${isImporting ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'}`}><FileSpreadsheet size={16}/> 批量导入</button>
              <button onClick={() => { setIsAdding(true); setEditForm({ name: '', unit: '', cost: 0, threshold: 0 }); setEditingId(null); setIsImporting(false); }} className="text-sm px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm bg-blue-600 text-white hover:bg-blue-700"><Plus size={16}/> 新增原材料</button>
          </div>
      </div>

      {isImporting && (
          <div className="bg-white p-6 rounded-xl mb-4 border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="font-bold text-gray-800 flex items-center gap-2"><FileSpreadsheet className="text-green-600"/> 批量导入食材数据</h4>
                      <p className="text-sm text-gray-500 mt-1">
                          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-bold mr-2">推荐</span>
                          请直接在 Excel 中选中表格区域，<strong>复制 (Ctrl+C)</strong>，然后粘贴到下方。
                      </p>
                      <p className="text-xs text-gray-400 mt-1">支持格式：<strong>名称</strong> | <strong>单位</strong> | <strong>成本</strong> | <strong>预警值</strong> (Tab 或 逗号分隔)</p>
                  </div>
                  <button onClick={() => setIsImporting(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
              </div>
              
              <textarea 
                  className="w-full border p-4 rounded-lg h-32 text-sm font-mono mb-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 placeholder-gray-400"
                  placeholder={`直接粘贴 Excel 数据到这里... \n例如:\n土豆\tkg\t4\t10\n大蒜\t斤\t5\t2`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
              />
              
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                          <button 
                              onClick={() => fileInputRef.current?.click()} 
                              className="text-sm text-green-700 font-bold flex items-center gap-1 hover:underline"
                          >
                              <Upload size={14}/> 上传 CSV 文件
                          </button>
                          <input 
                              type="file" 
                              accept=".csv,.txt" 
                              ref={fileInputRef} 
                              className="hidden" 
                              onChange={handleFileUpload} 
                          />
                      </div>
                      
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none border-l pl-4 border-gray-300">
                          <input 
                              type="checkbox" 
                              checked={isGBK} 
                              onChange={(e) => setIsGBK(e.target.checked)}
                              className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span>解决乱码 (使用GBK编码)</span>
                      </label>
                  </div>

                  <button onClick={confirmImport} className="bg-green-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-green-700 shadow-sm">
                      确认解析并导入
                  </button>
              </div>
          </div>
      )}

      {isAdding && (
          <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-200 animate-in fade-in slide-in-from-top-2">
              <h4 className="font-bold text-blue-800 mb-2">录入新食材</h4>
              <div className="grid grid-cols-5 gap-2 mb-2">
                  <input className="border p-2 rounded" placeholder="名称" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/>
                  <input className="border p-2 rounded" placeholder="单位" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}/>
                  <input type="number" className="border p-2 rounded" placeholder="成本" value={editForm.cost || ''} onChange={e => setEditForm({...editForm, cost: e.target.value ? parseFloat(e.target.value) : 0})}/>
                  <input type="number" className="border p-2 rounded" placeholder="阈值" value={editForm.threshold || ''} onChange={e => setEditForm({...editForm, threshold: e.target.value ? parseFloat(e.target.value) : 0})}/>
                  <div className="flex gap-2">
                      <button onClick={handleAdd} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">保存</button>
                      <button onClick={() => setIsAdding(false)} className="bg-gray-300 text-gray-700 px-4 rounded hover:bg-gray-400">取消</button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm uppercase"><tr><th className="p-4">食材</th><th className="p-4">库存</th><th className="p-4">单位</th><th className="p-4">成本</th><th className="p-4">阈值</th><th className="p-4 text-right">操作</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {ingredients.map(ing => (
              <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                {editingId === ing.id ? (
                    <>
                      <td className="p-2"><input className="border p-1 w-full rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></td>
                      <td className="p-2 text-gray-500">{ing.quantity} (不可改)</td>
                      <td className="p-2"><input className="border p-1 w-full rounded" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}/></td>
                      <td className="p-2"><input type="number" className="border p-1 w-20 rounded" value={editForm.cost || ''} onChange={e => setEditForm({...editForm, cost: e.target.value ? parseFloat(e.target.value) : 0})}/></td>
                      <td className="p-2"><input type="number" className="border p-1 w-20 rounded" value={editForm.threshold || ''} onChange={e => setEditForm({...editForm, threshold: e.target.value ? parseFloat(e.target.value) : 0})}/></td>
                      <td className="p-2 text-right">
                          <button onClick={saveEdit} className="bg-green-600 text-white p-1 rounded mr-2 hover:bg-green-700"><CheckCircle2 size={16}/></button>
                          <button onClick={cancelEdit} className="bg-red-500 text-white p-1 rounded hover:bg-red-600"><X size={16}/></button>
                      </td>
                    </>
                ) : (
                    <>
                      <td className="p-4 font-medium">{ing.name}</td>
                      <td className="p-4"><span className={`font-bold ${ing.quantity < ing.threshold ? 'text-red-600' : 'text-gray-800'}`}>{ing.quantity.toFixed(2)}</span></td>
                      <td className="p-4">{ing.unit}</td>
                      <td className="p-4">¥{ing.cost}</td>
                      <td className="p-4">{ing.threshold}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => startEdit(ing)} className="text-gray-500 hover:text-blue-600"><Edit size={16}/></button>
                          <button onClick={() => restockIngredient(ing.id, 5)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors">+ 补货</button>
                      </td>
                    </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};