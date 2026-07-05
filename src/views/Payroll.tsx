import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  TrendingUp,
  Calculator,
  History,
  FileText,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { mockEmployees, mockDepartments, mockPositions, mockPayrollHistory, mockAdvances } from '../mockData';
import { Role } from '../types';

// Mock Payroll Data for the new UI
let initialPayrollData = [
  {
    id: 'pr1',
    employeeId: 'e1', // John Doe
    baseSalary: 20000000,
    actualWorkDays: 22,
    standardWorkDays: 22,
    allowances: 2000000,
    bonus: 5000000, // anomaly
    grossSalary: 27000000,
    deductions: {
      socialInsurance: 1600000,
      tax: 1200000,
      other: 0
    },
    totalDeduction: 2800000,
    netSalary: 24200000,
    status: 'Pending', // Draft, Pending, Approved, Paid
    anomaly: {
      hasAnomaly: true,
      type: 'increase',
      message: 'Tăng 25% so với tháng trước do Thưởng dự án.'
    }
  },
  {
    id: 'pr2',
    employeeId: 'e2', // Jane Smith
    baseSalary: 15000000,
    actualWorkDays: 21,
    standardWorkDays: 22,
    allowances: 1500000,
    bonus: 0,
    grossSalary: 15818181,
    deductions: {
      socialInsurance: 1575000,
      tax: 250000,
      other: 0
    },
    totalDeduction: 1825000,
    netSalary: 13993181,
    status: 'Draft',
    anomaly: {
      hasAnomaly: false,
    }
  },
  {
    id: 'pr3',
    employeeId: 'e3', // Mike Johnson
    baseSalary: 12000000,
    actualWorkDays: 22,
    standardWorkDays: 22,
    allowances: 1000000,
    bonus: 0,
    grossSalary: 13000000,
    deductions: {
      socialInsurance: 1260000,
      tax: 0,
      other: 0
    },
    totalDeduction: 1260000,
    netSalary: 11740000,
    status: 'Approved',
    anomaly: {
      hasAnomaly: false,
    }
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(amount));
};

export default function Payroll({ userRole }: { userRole: Role }) {
  const [viewMode, setViewMode] = useState<'current' | 'history' | 'advances' | 'statistics'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [payrollData, setPayrollData] = useState(initialPayrollData);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ actualWorkDays: 0, allowances: 0, bonus: 0 });
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(payrollData.map(pr => pr.id));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const openDrawer = (payroll: any, isHistorical = false) => {
    // add deductions and anomaly mock to historical if missing for UI
    const mapped = {
      ...payroll,
      deductions: payroll.deductions || { socialInsurance: payroll.totalDeduction * 0.8, tax: payroll.totalDeduction * 0.2 },
      anomaly: payroll.anomaly || { hasAnomaly: false }
    };
    setSelectedPayroll(mapped);
    setEditForm({
      actualWorkDays: mapped.actualWorkDays,
      allowances: mapped.allowances,
      bonus: mapped.bonus
    });
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPayroll) return;
    const gross = (selectedPayroll.baseSalary / selectedPayroll.standardWorkDays * editForm.actualWorkDays) + editForm.allowances + editForm.bonus;
    const net = gross - selectedPayroll.totalDeduction;
    
    const updatedPayroll = {
      ...selectedPayroll,
      actualWorkDays: editForm.actualWorkDays,
      allowances: editForm.allowances,
      bonus: editForm.bonus,
      grossSalary: gross,
      netSalary: net
    };
    
    setPayrollData(prev => prev.map(p => p.id === updatedPayroll.id ? updatedPayroll : p));
    setSelectedPayroll(updatedPayroll);
    setIsEditing(false);
  };

  const filteredHistory = mockPayrollHistory.filter(pr => {
    const emp = mockEmployees.find(e => e.id === pr.employeeId);
    return emp?.name.toLowerCase().includes(historySearchQuery.toLowerCase());
  });

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-6rem)] -mx-6 -mt-6 p-6 font-sans">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý lương</h1>
          <div className="flex bg-slate-100 p-1 rounded-md mt-4 w-fit">
            <button 
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 text-sm font-medium rounded flex items-center ${viewMode === 'current' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Bảng lương tháng
            </button>
            <button 
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 text-sm font-medium rounded flex items-center ${viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <History className="w-4 h-4 mr-2" />
              Lịch sử trả lương
            </button>
            <button 
              onClick={() => setViewMode('advances')}
              className={`px-4 py-2 text-sm font-medium rounded flex items-center ${viewMode === 'advances' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Tạm ứng
            </button>
            <button 
              onClick={() => setViewMode('statistics')}
              className={`px-4 py-2 text-sm font-medium rounded flex items-center ${viewMode === 'statistics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Thống kê
            </button>
          </div>
        </div>
        
        {viewMode === 'current' && ['Super Admin', 'HR'].includes(userRole) && (
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center shadow-sm transition-colors">
              <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
              Đồng bộ Chấm công
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center shadow-sm transition-colors">
              <Download className="w-4 h-4 mr-2 text-slate-500" />
              Xuất Excel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center shadow-sm shadow-blue-500/30 transition-colors">
              <Send className="w-4 h-4 mr-2" />
              Gửi duyệt bảng lương
            </button>
          </div>
        )}
      </div>

      {viewMode === 'current' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tổng quỹ lương (Gross)</p>
                  <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(55818181)}</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                <span className="text-emerald-600 font-medium">+5.2%</span>
                <span className="text-slate-500 ml-1.5">so với tháng trước</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Nhân sự tính lương</p>
                  <h3 className="text-2xl font-bold text-slate-800">124 <span className="text-lg text-slate-400 font-normal">/ 125</span></h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-slate-500">
                <span>1 nhân sự đang nghỉ thai sản</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Trạng thái kỳ lương</p>
                  <div className="mt-1 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-amber-100 text-amber-700">
                      <Clock className="w-4 h-4 mr-1.5" />
                      Đang chờ duyệt
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Người duyệt tiếp theo: <span className="font-medium text-slate-700">Nguyễn Văn A (CFO)</span>
              </div>
            </div>
          </div>

          {/* Main Data Table Area */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <button className="px-3 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  Lọc
                </button>
              </div>
              
              {selectedRows.length > 0 && (
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-md border border-blue-100 animate-in fade-in slide-in-from-right-4">
                  <span className="text-sm font-medium text-blue-700">{selectedRows.length} đã chọn</span>
                  <div className="w-px h-4 bg-blue-200"></div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Gửi phiếu lương</button>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Khóa dữ liệu</button>
                </div>
              )}
            </div>

            {/* The Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        onChange={toggleSelectAll}
                        checked={selectedRows.length === payrollData.length && payrollData.length > 0}
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Lương cơ bản</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Phụ cấp/Thưởng</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tổng (Gross)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Khấu trừ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-800 uppercase tracking-wider text-right bg-slate-100/50">Thực nhận (Net)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollData.map(pr => {
                    const emp = mockEmployees.find(e => e.id === pr.employeeId);
                    if (!emp) return null;
                    const isSelected = selectedRows.includes(pr.id);

                    return (
                      <tr 
                        key={pr.id} 
                        onClick={() => openDrawer(pr, false)}
                        className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(pr.id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs mr-3">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                                {emp.name}
                                {pr.anomaly.hasAnomaly && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{emp.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-600 font-medium">
                          {formatCurrency(pr.baseSalary)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-emerald-600 font-medium">
                          +{formatCurrency(pr.allowances + pr.bonus)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-800 font-semibold">
                          {formatCurrency(pr.grossSalary)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-red-500 font-medium">
                          -{formatCurrency(pr.totalDeduction)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold text-slate-900 bg-slate-50/30">
                          {formatCurrency(pr.netSalary)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            pr.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            pr.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {pr.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewMode === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-slate-800">Lịch sử thanh toán đã duyệt</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ lương</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tổng (Gross)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Khấu trừ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-800 uppercase tracking-wider text-right">Thực nhận (Net)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(pr => {
                  const emp = mockEmployees.find(e => e.id === pr.employeeId);
                  return (
                    <tr 
                      key={pr.id} 
                      onClick={() => openDrawer(pr, true)}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        Tháng {pr.month}/{pr.year}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="font-medium text-slate-900 text-sm">
                            {emp?.name || pr.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-slate-800 font-semibold">
                        {formatCurrency(pr.grossSalary)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-red-500 font-medium">
                        -{formatCurrency(pr.totalDeduction)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                        {formatCurrency(pr.netSalary)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                          {pr.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'advances' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between">
            <h2 className="font-semibold text-slate-800">Quản lý tạm ứng lương</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Tạo yêu cầu tạm ứng</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lý do</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Số tiền</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockAdvances.map(adv => {
                  const emp = mockEmployees.find(e => e.id === adv.employeeId);
                  return (
                    <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-600">{adv.date}</td>
                      <td className="px-4 py-4 font-medium text-slate-900 text-sm">{emp?.name || adv.employeeId}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{adv.reason}</td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-slate-800">{formatCurrency(adv.amount)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            adv.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            adv.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {adv.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'statistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Thống kê quỹ lương theo tháng (Triệu VNĐ)</h3>
              <div className="h-64 flex items-end gap-4">
                {[
                  { m: 'T1', v: 450 }, { m: 'T2', v: 460 }, { m: 'T3', v: 465 }, 
                  { m: 'T4', v: 480 }, { m: 'T5', v: 510 }, { m: 'T6', v: 558 }
                ].map(d => (
                  <div key={d.m} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-blue-100 rounded-t-md relative group">
                      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all group-hover:bg-blue-600" style={{ height: `${(d.v / 600) * 100}%` }}></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                        {d.v} Tr
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{d.m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Cơ cấu thu nhập trung bình</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Lương cơ bản (75%)</span>
                    <span className="font-medium text-slate-800">~15.0M</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[75%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Thưởng (15%)</span>
                    <span className="font-medium text-slate-800">~3.0M</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[15%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Phụ cấp (10%)</span>
                    <span className="font-medium text-slate-800">~2.0M</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[10%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer for Payroll Details */}
      {drawerOpen && selectedPayroll && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Chi tiết phiếu lương</h2>
                {selectedPayroll.month ? (
                  <p className="text-sm text-slate-500">Kỳ lương: Tháng {selectedPayroll.month}/{selectedPayroll.year}</p>
                ) : (
                  <p className="text-sm text-slate-500">Kỳ lương: Tháng 10/2023</p>
                )}
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              
              {/* Employee Info */}
              {(() => {
                const emp = mockEmployees.find(e => e.id === selectedPayroll.employeeId);
                const dept = mockDepartments.find(d => d.id === emp?.departmentId);
                const pos = mockPositions.find(p => p.id === emp?.positionId);
                return (
                  <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                      {emp?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{emp?.name}</h3>
                      <p className="text-sm text-slate-500">{pos?.title} • {dept?.name}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Anomaly Alert */}
              {selectedPayroll.anomaly?.hasAnomaly && (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">Cảnh báo biến động</h4>
                    <p className="text-sm text-amber-700 mt-1">{selectedPayroll.anomaly.message}</p>
                  </div>
                </div>
              )}

              {/* Breakdown Structure */}
              <div className="space-y-6">
                
                {/* 1. Earnings */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
                    Thu nhập (Earnings)
                  </h4>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Lương cơ bản (100%)</span>
                      <span className="font-medium text-slate-800">{formatCurrency(selectedPayroll.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-slate-200">
                      <span className="text-slate-500">Ngày công thực tế: {isEditing ? <input type="number" className="w-16 px-2 py-1 text-xs border rounded mx-1 text-slate-900" value={editForm.actualWorkDays} onChange={e => setEditForm({...editForm, actualWorkDays: Number(e.target.value)})} /> : selectedPayroll.actualWorkDays}/{selectedPayroll.standardWorkDays}</span>
                      <span className="text-slate-500">{formatCurrency(selectedPayroll.baseSalary / selectedPayroll.standardWorkDays * (isEditing ? editForm.actualWorkDays : selectedPayroll.actualWorkDays))}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Phụ cấp (Allowances)</span>
                      {isEditing ? (
                        <input type="number" className="w-24 px-2 py-1 text-xs border rounded text-slate-900" value={editForm.allowances} onChange={e => setEditForm({...editForm, allowances: Number(e.target.value)})} />
                      ) : (
                        <span className="font-medium text-slate-800">{formatCurrency(selectedPayroll.allowances)}</span>
                      )}
                    </div>
                    {(isEditing || selectedPayroll.bonus > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Thưởng (Bonus)</span>
                        {isEditing ? (
                          <input type="number" className="w-24 px-2 py-1 text-xs border rounded text-slate-900" value={editForm.bonus} onChange={e => setEditForm({...editForm, bonus: Number(e.target.value)})} />
                        ) : (
                          <span className="font-medium text-emerald-600">+{formatCurrency(selectedPayroll.bonus)}</span>
                        )}
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">Tổng thu nhập (Gross)</span>
                      <span className="text-sm font-bold text-slate-800">
                        {isEditing 
                          ? formatCurrency((selectedPayroll.baseSalary / selectedPayroll.standardWorkDays * editForm.actualWorkDays) + editForm.allowances + editForm.bonus)
                          : formatCurrency(selectedPayroll.grossSalary)
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Deductions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                    Khấu trừ (Deductions)
                  </h4>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Bảo hiểm bắt buộc</span>
                      <span className="font-medium text-slate-800">-{formatCurrency(selectedPayroll.deductions?.socialInsurance || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Thuế TNCN tạm tính</span>
                      <span className="font-medium text-slate-800">-{formatCurrency(selectedPayroll.deductions?.tax || 0)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">Tổng khấu trừ</span>
                      <span className="text-sm font-bold text-red-600">-{formatCurrency(selectedPayroll.totalDeduction)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 bg-slate-800 text-white shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-300 text-sm mb-1">Thực nhận (Net Salary)</p>
                  <h2 className="text-3xl font-bold text-emerald-400">
                    {isEditing 
                      ? formatCurrency(((selectedPayroll.baseSalary / selectedPayroll.standardWorkDays * editForm.actualWorkDays) + editForm.allowances + editForm.bonus) - selectedPayroll.totalDeduction)
                      : formatCurrency(selectedPayroll.netSalary)
                    }
                  </h2>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600">
                      Hủy
                    </button>
                    <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20">
                      Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <>
                    {!selectedPayroll.month && ( // Allow editing only if not historical
                      <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600">
                        Sửa dữ liệu
                      </button>
                    )}
                    <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
                      Xuất PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
