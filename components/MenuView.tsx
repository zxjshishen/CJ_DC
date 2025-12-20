import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Plus, Trash2, Upload, Save, X } from 'lucide-react';
import { Dish, Ingredient, RecipeItem } from '../types';

interface MenuViewProps {
  dishes: Dish[];
  recipes: Record<number, RecipeItem[]>;
  ingredients: Ingredient[];
  handleSaveDish: (dish: Dish, recipe: RecipeItem[]) => void;
  handleDeleteDish: (id: number) => void;
  handleBatchImportDishes: (text: string) => void;
  showNotification: (msg: string) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({
  dishes, recipes, ingredients, handleSaveDish, handleDeleteDish, handleBatchImportDishes, showNotification
}) => {
  const [editId, setEditId] = useState<number | null>(null); 
  const [formData, setFormData] = useState<{name: string, price: string, image: string}>({ name: '', price: '', image: '🍛' });
  const [recipeItems, setRecipeItems] = useState<{ingredientId: string, amount: string}[]>([{ ingredientId: '', amount: '' }]);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [isGBK, setIsGBK] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
      setEditId(null);
      setFormData({ name: '', price: '', image: '🍛' });
      setRecipeItems([{ ingredientId: '', amount: '' }]);
      setIsImporting(false);
  };

  const loadDish = (dish: Dish) => {
      setEditId(dish.id);
      setFormData({ name: dish.name, price: String(dish.price), image: dish.image });
      setIsImporting(false);
      const existingRecipe = recipes[dish.id] || [];
      if (existingRecipe.length > 0) {
          setRecipeItems(existingRecipe.map(r => ({ ingredientId: String(r.ingredientId), amount: String(r.amount) })));
      } else {
          setRecipeItems([{ ingredientId: '', amount: '' }]);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData({ ...formData, image: reader.result as string });
              showNotification("图片上传成功");
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) {
              showNotification("文件过大，请复制内容粘贴");
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
          reader.onerror = () => showNotification("读取失败");
          reader.readAsText(file, isGBK ? 'GBK' : 'UTF-8');
      }
      e.target.value = '';
  };

  const updateRecipeRow = (index: number, field: 'ingredientId' | 'amount', value: string) => {
      const newItems = [...recipeItems];
      newItems[index][field] = value;
      setRecipeItems(newItems);
  };

  const handleSubmit = () => {
      if (!formData.name || !formData.price) { showNotification("请填写完整信息"); return; }
      const validRecipe = recipeItems.filter(item => item.ingredientId && item.amount).map(item => ({ ingredientId: parseInt(item.ingredientId), amount: parseFloat(item.amount) }));
      
      handleSaveDish({ 
          id: editId || 0,
          name: formData.name, 
          price: parseFloat(formData.price), 
          image: formData.image 
      }, validRecipe);
      
      resetForm();
  };

  const confirmImport = () => {
      handleBatchImportDishes(importText);
      setImportText('');
      setIsImporting(false);
  }

  const isImageUrl = (str: string) => typeof str === 'string' && (str.startsWith('blob:') || str.startsWith('http') || str.startsWith('data:'));

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* Left: Dish List */}
      <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-1/2 md:h-full">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700">当前菜单 ({dishes.length})</h3>
              <div className="flex gap-1">
                  <button onClick={() => { setIsImporting(true); setEditId(null); }} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-50"><FileSpreadsheet size={12}/> 导入</button>
                  <button onClick={resetForm} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-700"><Plus size={12}/> 新增</button>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto">
              {dishes.map(d => (
                  <div key={d.id} className={`p-3 border-b flex gap-3 items-center hover:bg-gray-50 cursor-pointer ${editId === d.id ? 'bg-blue-50' : ''}`} onClick={() => loadDish(d)}>
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {isImageUrl(d.image) ? <img src={d.image} alt={d.name} className="w-full h-full object-cover"/> : <span className="text-xl">{d.image}</span>}
                      </div>
                      <div className="flex-1">
                          <div className="font-bold text-sm">{d.name}</div>
                          <div className="text-xs text-orange-600 font-bold">¥{d.price}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDish(d.id); }} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                  </div>
              ))}
          </div>
      </div>

      {/* Right: Editor or Importer */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          {isImporting ? (
              <div className="flex flex-col h-full p-6 animate-in fade-in slide-in-from-right-4 overflow-y-auto">
                  <div className="mb-4">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><FileSpreadsheet className="text-green-600"/> 批量导入菜单</h3>
                      <p className="text-sm text-gray-500 mt-2">
                          <strong>方法一 (推荐)：</strong> 在 Excel 中选中数据区域 → 复制 → 粘贴到下方文本框。<br/>
                          <strong>方法二：</strong> 另存为 CSV 文件后上传。
                      </p>
                      <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded border font-mono">
                          格式示例 (列顺序)：<br/>
                          宫保鸡丁&nbsp;&nbsp;28&nbsp;&nbsp;🥘<br/>
                          米饭&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3
                      </p>
                  </div>
                  <textarea 
                      className="flex-1 border p-4 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none mb-4 bg-gray-50 placeholder-gray-400 min-h-[100px]"
                      placeholder="在此粘贴 Excel 数据..."
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                  />
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                              <input 
                                  type="file" 
                                  accept=".csv,.txt" 
                                  ref={importFileRef} 
                                  className="hidden" 
                                  onChange={handleImportFileUpload} 
                              />
                              <button 
                                  onClick={() => importFileRef.current?.click()} 
                                  className="text-sm text-green-700 font-bold flex items-center gap-1 hover:underline"
                              >
                                  <Upload size={14}/> 上传 CSV 文件
                              </button>
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
                      <div className="flex gap-2">
                          <button onClick={() => setIsImporting(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">取消</button>
                          <button onClick={confirmImport} className="px-6 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 shadow-sm">开始解析并导入</button>
                      </div>
                  </div>
              </div>
          ) : (
              <>
                  <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-700">{editId ? '编辑菜品' : '新增菜品'}</h3></div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div><label className="block text-xs font-bold text-gray-500 mb-1">菜名</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                          <div><label className="block text-xs font-bold text-gray-500 mb-1">价格 (¥)</label><input type="number" className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/></div>
                      </div>
                      
                      <div className="mb-6 flex gap-4 items-start">
                          <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center overflow-hidden bg-gray-50">
                              {isImageUrl(formData.image) ? <img src={formData.image} className="w-full h-full object-cover" alt="preview"/> : <span className="text-2xl">{formData.image}</span>}
                          </div>
                          <div>
                              <div onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-300 px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-gray-50 w-fit mb-2">更换图片</div>
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                              <input className="border p-1 rounded text-xs w-24 text-center" placeholder="或输入Emoji" value={!isImageUrl(formData.image) ? formData.image : ''} onChange={e => setFormData({...formData, image: e.target.value})}/>
                          </div>
                      </div>

                      <div className="mb-6">
                          <label className="block text-xs font-bold text-gray-500 mb-2">BOM 配方 (消耗库存)</label>
                          <div className="space-y-2 bg-gray-50 p-3 rounded">
                              {recipeItems.map((item, index) => (
                                  <div key={index} className="flex gap-2 items-center">
                                      <select className="flex-1 border p-1.5 rounded text-sm" value={item.ingredientId} onChange={e => updateRecipeRow(index, 'ingredientId', e.target.value)}>
                                          <option value="">选择原材料...</option>
                                          {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                                      </select>
                                      <input type="number" className="w-20 border p-1.5 rounded text-sm" placeholder="数量" value={item.amount} onChange={e => updateRecipeRow(index, 'amount', e.target.value)}/>
                                      <button onClick={() => recipeItems.length > 1 && setRecipeItems(recipeItems.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                                  </div>
                              ))}
                              <button onClick={() => setRecipeItems([...recipeItems, { ingredientId: '', amount: '' }])} className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-2"><Plus size={14}/> 添加原料</button>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                      <button onClick={resetForm} className="px-4 py-2 rounded bg-gray-200 text-gray-700 text-sm">重置</button>
                      <button onClick={handleSubmit} className="px-6 py-2 rounded bg-blue-600 text-white font-bold text-sm flex items-center gap-2"><Save size={16}/> 保存菜品</button>
                  </div>
              </>
          )}
      </div>
    </div>
  );
};