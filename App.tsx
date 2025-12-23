import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, UtensilsCrossed, ChefHat, Package, Calendar, 
  TrendingDown, PieChart, Settings, CheckCircle2, Database, WifiOff, Activity
} from 'lucide-react';
import { Ingredient, Dish, RecipeItem, Order, CartItem, Transaction, Reservation, TableInfo } from './types';
import { ConfirmModal } from './components/ConfirmModal';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { KDSView } from './components/KDSView';
import { InventoryView } from './components/InventoryView';
import { ProcurementView } from './components/ProcurementView';
import { FinanceView } from './components/FinanceView';
import { MenuView } from './components/MenuView';
import { ReservationView } from './components/ReservationView';
import { api } from './api'; 
import { INITIAL_RECIPES, INITIAL_DISHES, INITIAL_INGREDIENTS } from './constants'; 

// LocalStorage Helper Keys
const STORAGE_KEYS = {
  DISHES: 'erp_dishes',
  INGREDIENTS: 'erp_ingredients',
  RECIPES: 'erp_recipes',
  ORDERS: 'erp_orders',
  TRANSACTIONS: 'erp_transactions',
  RESERVATIONS: 'erp_reservations'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOffline, setIsOffline] = useState(false);
  
  // Initialize state with lazy initializers to read from localStorage if needed
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<Record<number, RecipeItem[]>>(INITIAL_RECIPES);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [posNeedInvoice, setPosNeedInvoice] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // POS State
  const [posTableNo, setPosTableNo] = useState('');
  const [posGuestCount, setPosGuestCount] = useState(2);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: (() => void) | null }>({ 
    isOpen: false, title: '', message: '', onConfirm: null 
  });

  // --- 初始化加载数据 ---
  useEffect(() => {
    loadData();
  }, []);

  // --- Persistence Effect for Offline Mode ---
  useEffect(() => {
    if (isOffline) {
      localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    }
  }, [dishes, ingredients, recipes, orders, transactions, reservations, isOffline]);

  const loadLocalData = () => {
    try {
      const savedDishes = localStorage.getItem(STORAGE_KEYS.DISHES);
      const savedIngs = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      const savedRecipes = localStorage.getItem(STORAGE_KEYS.RECIPES);
      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const savedTrans = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const savedRes = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);

      if (savedDishes) setDishes(JSON.parse(savedDishes)); else setDishes(INITIAL_DISHES);
      if (savedIngs) setIngredients(JSON.parse(savedIngs)); else setIngredients(INITIAL_INGREDIENTS);
      if (savedRecipes) setRecipes(JSON.parse(savedRecipes)); else setRecipes(INITIAL_RECIPES);
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedTrans) setTransactions(JSON.parse(savedTrans));
      if (savedRes) setReservations(JSON.parse(savedRes));
    } catch (e) {
      console.error("加载本地缓存失败", e);
      // Fallback if local storage is corrupt
      setDishes(INITIAL_DISHES);
      setIngredients(INITIAL_INGREDIENTS);
      setRecipes(INITIAL_RECIPES);
    }
  };

  const loadData = async () => {
    try {
      // 尝试连接后端
      const [remoteDishes, remoteIngs] = await Promise.all([
        api.getDishes(),
        api.getIngredients()
      ]);
      setDishes(remoteDishes);
      setIngredients(remoteIngs);
      setIsOffline(false);
      showNotification("已连接至服务器");
    } catch (e: any) {
      console.warn("后端连接失败，切换至本地模式:", e.message);
      showNotification("连接服务器失败，使用本地离线模式");
      setIsOffline(true);
      loadLocalData();
    }
  };

  const handleInitDB = async () => {
    if (isOffline) {
        showNotification("离线模式下无法初始化数据库");
        return;
    }
    const msg = await api.initDB();
    showNotification(msg);
    loadData(); 
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
      setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
      setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleConfirmAction = () => {
      if (confirmModal.onConfirm) {
          confirmModal.onConfirm();
      }
      closeConfirm();
  };

  // --- Logic ---

  const addTransaction = (type: 'income' | 'expense', category: string, amount: number, description: string, needInvoice = false, invoiceNo = '') => {
    const newTx: Transaction = {
      id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type, category, amount: parseFloat(amount.toFixed(2)), description,
      time: new Date().toLocaleTimeString(),
      invoiceStatus: needInvoice ? 'pending' : 'none',
      invoiceNo
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const checkAvailability = (dishId: number) => {
    const recipe = recipes[dishId];
    if (!recipe) return true;
    return recipe.every(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return ing && ing.quantity >= item.amount;
    });
  };

  const placeOrder = async (items: CartItem[], tableInfo: TableInfo) => {
      if (!tableInfo.tableNo) {
          showNotification("请输入桌号");
          return;
      }
      
      // 1. 本地库存检查
      for (const item of items) {
          const recipe = recipes[item.id];
          if (recipe) {
              for (const rItem of recipe) {
                  const ing = ingredients.find(i => i.id === rItem.ingredientId);
                  if (!ing || ing.quantity < rItem.amount * item.count) {
                      showNotification(`库存不足: ${ing?.name || '未知食材'}`);
                      return;
                  }
              }
          }
      }

      // 2. 尝试调用后端 (如果在线)
      if (!isOffline) {
          try {
            const orderData = {
              tableNo: tableInfo.tableNo,
              guestCount: tableInfo.guestCount,
              eventName: tableInfo.tableNo + '桌用餐',
              items: items,
              total: items.reduce((sum, i) => sum + i.price * i.count, 0)
            };
            await api.createOrder(orderData);
          } catch (error) {
            console.error("下单同步失败", error);
            showNotification("网络错误，订单仅保存在本地");
          }
      }

      // 3. 更新本地状态 (扣减库存)
      const newIngredients = [...ingredients];
      items.forEach(item => {
          const recipe = recipes[item.id];
          if (recipe) {
              recipe.forEach(rItem => {
                  const ingIdx = newIngredients.findIndex(i => i.id === rItem.ingredientId);
                  if (ingIdx !== -1) {
                      newIngredients[ingIdx].quantity -= rItem.amount * item.count;
                  }
              });
          }
      });
      setIngredients(newIngredients);

      const newOrder: Order = {
          id: Date.now().toString().slice(-4),
          items: [...items],
          total: items.reduce((sum, i) => sum + i.price * i.count, 0),
          status: 'pending',
          timestamp: new Date().toLocaleTimeString(),
          isReservation: false,
          tableNo: tableInfo.tableNo,
          guestCount: tableInfo.guestCount
      };
      setOrders([...orders, newOrder]);

      addTransaction('income', '餐饮收入', newOrder.total, `桌号 ${tableInfo.tableNo}`, posNeedInvoice);

      setCart([]);
      setPosTableNo('');
      setPosGuestCount(2);
      setPosNeedInvoice(false);
      showNotification(isOffline ? "下单成功 (离线模式)" : "下单成功！");
  };

  const completeOrder = (id: string) => {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'completed' } : o));
      showNotification("订单已完成");
  };

  const restockIngredient = (id: number, amount: number) => {
      triggerConfirm("确认补货", "确认要进行补货操作吗？", () => {
          const ing = ingredients.find(i => i.id === id);
          if (ing) {
              setIngredients(ingredients.map(i => i.id === id ? { ...i, quantity: i.quantity + amount } : i));
              addTransaction('expense', '原材料采购', ing.cost * amount, `补货: ${ing.name} x ${amount}${ing.unit}`, true);
              showNotification(`已补货 ${ing.name}`);
          }
      });
  };

  const handleSaveIngredient = (ing: Partial<Ingredient>) => {
      if (ing.id) {
          setIngredients(ingredients.map(i => i.id === ing.id ? { ...i, ...ing } as Ingredient : i));
          showNotification("原材料更新成功");
      } else {
          const newIng: Ingredient = {
              id: Date.now(),
              name: ing.name || '未命名',
              quantity: 0,
              unit: ing.unit || 'kg',
              threshold: ing.threshold || 0,
              cost: ing.cost || 0
          };
          setIngredients([...ingredients, newIng]);
          showNotification("新原材料已添加");
      }
  };

  const handleBatchImportIngredients = (text: string) => {
      try {
          const lines = text.trim().split('\n');
          const newIngs: Ingredient[] = [];
          lines.forEach(line => {
              const parts = line.split(/[\t,，|]/).map(s => s.trim());
              if (parts.length >= 2) {
                  newIngs.push({
                      id: Date.now() + Math.random(),
                      name: parts[0],
                      quantity: 0,
                      unit: parts[1] || 'kg',
                      cost: parseFloat(parts[2]) || 0,
                      threshold: parseFloat(parts[3]) || 0
                  });
              }
          });
          if (newIngs.length > 0) {
              setIngredients([...ingredients, ...newIngs]);
              showNotification(`成功导入 ${newIngs.length} 项原材料`);
          } else {
              showNotification("未能解析数据");
          }
      } catch (e) {
          showNotification("导入失败");
      }
  };

  const handleSaveDish = (dish: Dish, recipe: RecipeItem[]) => {
      if (dish.id === 0) {
          const newId = Date.now();
          setDishes([...dishes, { ...dish, id: newId }]);
          setRecipes({ ...recipes, [newId]: recipe });
          showNotification("菜品已创建");
      } else {
          setDishes(dishes.map(d => d.id === dish.id ? dish : d));
          setRecipes({ ...recipes, [dish.id]: recipe });
          showNotification("菜品已更新");
      }
  };

  const handleDeleteDish = (id: number) => {
      triggerConfirm("确认删除", "确定要删除这个菜品吗？", () => {
          setDishes(dishes.filter(d => d.id !== id));
          const { [id]: removed, ...rest } = recipes;
          setRecipes(rest);
          showNotification("菜品已删除");
      });
  };

  const handleBatchImportDishes = (text: string) => {
      try {
          const lines = text.trim().split('\n');
          const newDishes: Dish[] = [];
          lines.forEach(line => {
              const parts = line.split(/[\t,，|]/).map(s => s.trim());
              if (parts.length >= 2) {
                  newDishes.push({
                      id: Date.now() + Math.random(),
                      name: parts[0],
                      price: parseFloat(parts[1]) || 0,
                      image: parts[2] || '🍲'
                  });
              }
          });
          setDishes([...dishes, ...newDishes]);
          showNotification(`成功导入 ${newDishes.length} 个菜品`);
      } catch (e) {
          showNotification("导入失败");
      }
  };

  const executeBatchProcurement = (list: Ingredient[]) => {
      triggerConfirm("确认采购", `总计 ¥${list.reduce((sum, i) => sum + (i.estimatedCost || 0), 0).toFixed(1)}，是否确认？`, () => {
          const newIngredients = [...ingredients];
          let totalCost = 0;
          let desc = "批量采购: ";
          
          list.forEach(item => {
              const idx = newIngredients.findIndex(i => i.id === item.id);
              if (idx !== -1 && item.suggestedAmount) {
                  newIngredients[idx].quantity += item.suggestedAmount;
                  totalCost += item.estimatedCost || 0;
                  desc += `${item.name}x${item.suggestedAmount}, `;
              }
          });
          
          setIngredients(newIngredients);
          addTransaction('expense', '原材料采购', totalCost, desc.slice(0, -2), true);
          showNotification("采购单已执行");
      });
  };

  const handleAddReservation = (res: Partial<Reservation>) => {
      const newRes: Reservation = {
          id: `RES-${Date.now()}`,
          customerName: res.customerName || '匿名',
          date: res.date || '',
          time: res.time || '',
          guests: res.guests || 2,
          items: res.items || [],
          status: 'booked'
      };
      setReservations([...reservations, newRes]);
      showNotification("预约已添加");
  };

  const checkInReservation = (res: Reservation) => {
      triggerConfirm("确认到店", "客人已到店？", () => {
          setReservations(reservations.map(r => r.id === res.id ? { ...r, status: 'checked_in' } : r));
          if (res.items.length > 0) {
              setCart(res.items);
              setPosTableNo(res.realTableNo || 'A1'); 
              setPosGuestCount(res.guests);
              setActiveTab('pos');
              showNotification("预点菜品已载入 POS");
          } else {
              showNotification("客人已标记为到店");
          }
      });
  };

  const cancelReservation = (id: string) => {
      triggerConfirm("取消预约", "确定要取消此预约吗？", () => {
          setReservations(reservations.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
          showNotification("预约已取消");
      });
  };

  const updateInvoiceStatus = (txId: string, no: string) => {
      setTransactions(transactions.map(t => t.id === txId ? { ...t, invoiceStatus: 'completed', invoiceNo: no } : t));
      showNotification("发票信息已更新");
  };

  // --- Render ---

  const renderContent = () => {
      switch (activeTab) {
          case 'dashboard': return <DashboardView transactions={transactions} orders={orders} ingredients={ingredients} reservations={reservations} />;
          case 'pos': return <POSView dishes={dishes} cart={cart} setCart={setCart} placeOrder={placeOrder} checkAvailability={checkAvailability} posTableNo={posTableNo} setPosTableNo={setPosTableNo} posGuestCount={posGuestCount} setPosGuestCount={setPosGuestCount} posNeedInvoice={posNeedInvoice} setPosNeedInvoice={setPosNeedInvoice} />;
          case 'kds': return <KDSView orders={orders} completeOrder={completeOrder} />;
          case 'inventory': return <InventoryView ingredients={ingredients} handleSaveIngredient={handleSaveIngredient} handleBatchImportIngredients={handleBatchImportIngredients} restockIngredient={restockIngredient} showNotification={showNotification} />;
          case 'procurement': return <ProcurementView reservations={reservations} recipes={recipes} ingredients={ingredients} executeBatchProcurement={executeBatchProcurement} />;
          case 'finance': return <FinanceView transactions={transactions} addTransaction={addTransaction} showNotification={showNotification} updateInvoiceStatus={updateInvoiceStatus} />;
          case 'menu': return <MenuView dishes={dishes} recipes={recipes} ingredients={ingredients} handleSaveDish={handleSaveDish} handleDeleteDish={handleDeleteDish} handleBatchImportDishes={handleBatchImportDishes} showNotification={showNotification} />;
          case 'reservation': return <ReservationView dishes={dishes} reservations={reservations} handleAddReservation={handleAddReservation} checkInReservation={checkInReservation} cancelReservation={cancelReservation} showNotification={showNotification} />;
          default: return <DashboardView transactions={transactions} orders={orders} ingredients={ingredients} reservations={reservations} />;
      }
  };

  const navItems = [
      { id: 'dashboard', icon: Activity, label: '经营概况' },
      { id: 'pos', icon: LayoutDashboard, label: '前台收银' },
      { id: 'kds', icon: ChefHat, label: '后厨大屏' },
      { id: 'reservation', icon: Calendar, label: '预约管理' },
      { id: 'inventory', icon: Package, label: '库存监控' },
      { id: 'procurement', icon: TrendingDown, label: '智能采购' },
      { id: 'menu', icon: UtensilsCrossed, label: '菜品管理' },
      { id: 'finance', icon: PieChart, label: '财务报表' },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-900 font-sans">
        {/* Sidebar */}
        <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col justify-between shadow-2xl transition-all duration-300 z-20">
            <div>
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-800">
                    <div className="bg-orange-500 p-2 rounded-lg"><UtensilsCrossed size={24} className="text-white"/></div>
                    <span className="font-bold text-xl hidden lg:block tracking-wide">智慧餐饮 ERP</span>
                </div>
                <nav className="mt-6 px-2 space-y-2">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-orange-600 text-white shadow-lg translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <item.icon size={20} className={`min-w-[20px] ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className="ml-3 hidden lg:block font-medium">{item.label}</span>
                            {item.id === 'kds' && orders.filter(o => o.status === 'pending').length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden lg:block animate-pulse">{orders.filter(o => o.status === 'pending').length}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t border-slate-800">
                <button 
                  onClick={handleInitDB}
                  className={`w-full flex items-center p-2 rounded-lg transition-colors mb-2 ${isOffline ? 'text-gray-500 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  title="仅在线时可用"
                  disabled={isOffline}
                >
                    <Database size={20} className={isOffline ? "text-gray-600" : "text-blue-500"}/>
                    <span className="ml-3 hidden lg:block text-sm">初始化数据库</span>
                </button>
                <div className="w-full flex items-center p-2 rounded-lg text-slate-400">
                    <Settings size={20} />
                    <span className="ml-3 hidden lg:block text-sm">系统设置</span>
                </div>
                <div className="mt-4 text-xs text-slate-600 text-center hidden lg:block">v2.6.2 {isOffline ? '(Offline)' : 'MySQL'}</div>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-100">
            {/* Header */}
            <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold text-slate-800">{navItems.find(n => n.id === activeTab)?.label}</h1>
                  {isOffline && (
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-gray-200">
                      <WifiOff size={14} /> 离线模式 (数据仅保存在浏览器)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-slate-900">店长 (Manager)</div>
                        <div className="text-xs text-slate-500">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold border-2 border-orange-200">M</div>
                </div>
            </header>
            
            <div className="flex-1 p-6 overflow-hidden">
                <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                    {renderContent()}
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-20 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in z-50">
                    <CheckCircle2 className="text-green-400" size={20}/>
                    <span className="font-medium">{notification}</span>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                title={confirmModal.title} 
                message={confirmModal.message} 
                onConfirm={handleConfirmAction} 
                onCancel={closeConfirm}
            />
        </main>
    </div>
  );
}