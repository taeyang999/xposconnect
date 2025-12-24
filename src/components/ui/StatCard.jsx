import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, trend, trendUp, className, iconClassName }) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trendUp ? "text-emerald-600" : "text-red-500"
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl",
            iconClassName || "bg-slate-100"
          )}>
            <Icon className="h-6 w-6 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
}