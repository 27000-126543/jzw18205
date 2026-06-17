import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Target,
  PieChart,
  Leaf,
  FileBarChart,
  TrendingUp,
  Menu,
  X,
  LeafIcon,
  User,
} from "lucide-react";

const navItems = [
  { path: "/", label: "数据总览", icon: LayoutDashboard },
  { path: "/data-entry", label: "数据录入", icon: PlusCircle },
  { path: "/targets", label: "目标管理", icon: Target },
  { path: "/analysis", label: "排放分析", icon: PieChart },
  { path: "/measures", label: "减排措施", icon: Leaf },
  { path: "/reports", label: "ESG报告", icon: FileBarChart },
  { path: "/history", label: "历史对比", icon: TrendingUp },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-100 to-forest-50 flex">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white/80 backdrop-blur-lg border-r border-forest-100 transition-all duration-300 flex flex-col sticky top-0 h-screen z-20`}
      >
        <div className="p-5 border-b border-forest-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-forest-500/30">
              <LeafIcon className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="opacity-100 transition-opacity duration-300">
                <h1 className="font-display font-bold text-lg text-forest-700 leading-tight">碳迹云</h1>
                <p className="text-xs text-forest-500">ESG管理平台</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-forest-600 to-forest-500 text-white shadow-lg shadow-forest-500/25"
                    : "text-slate-850 hover:bg-forest-50 hover:text-forest-700"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-forest-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-forest-50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-forest-800 truncate">ESG管理员</p>
                <p className="text-xs text-forest-500 truncate">admin@company.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
