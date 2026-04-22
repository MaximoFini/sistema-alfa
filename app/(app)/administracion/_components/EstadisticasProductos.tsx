"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, TrendingUp, Package, CreditCard } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

interface Producto {
  id: string;
  activo: boolean;
  stock: number;
  stock_minimo: number;
}

interface Venta {
  id: string;
  total: number;
  ganancia: number;
  forma_pago?: string;
  metodo_pago?: string;
  medio_pago?: string; // Por las dudas
}

const COLORS = ["#16A34A", "#2563EB", "#DC2626", "#D97706", "#8B5CF6"];

export default function EstadisticasProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: prodData } = await supabase.from("productos").select("*");
      if (prodData) setProductos(prodData);

      const { data: ventasData } = await supabase.from("ventas").select("*");
      if (ventasData) setVentas(ventasData as Venta[]);
    } catch (err) {
      console.error("Error cargando estadísticas de productos:", err);
    } finally {
      setLoading(false);
    }
  }

  // Estadísticas
  const totalVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalGanancias = ventas.reduce((acc, v) => acc + (v.ganancia || 0), 0);

  // Stats por forma de pago
  const formasDePago = ventas.reduce((acc: any, v: Venta) => {
    // Some flexibility in case the column is named slightly differently
    const fp = v.forma_pago || v.metodo_pago || v.medio_pago || "Efectivo";
    // capitalize
    const fpCap = fp.charAt(0).toUpperCase() + fp.slice(1).toLowerCase();

    if (!acc[fpCap]) acc[fpCap] = 0;
    acc[fpCap] += v.total || 0;
    return acc;
  }, {});

  const pieData = Object.keys(formasDePago).map((fp) => ({
    name: fp,
    value: formasDePago[fp],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"
            style={{ borderTopColor: "#DC2626" }}
          />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full mx-auto flex flex-col gap-6 bg-[#FAFAFA] min-h-screen">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#FEF2F2" }}
              >
                <DollarSign size={20} style={{ color: "#DC2626" }} />
              </div>
              <h3 className="text-sm font-bold text-gray-600">
                VENTAS TOTALES
              </h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#DC2626" }}>
              ${totalVentas.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {ventas.length} ventas registradas
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                <TrendingUp size={20} style={{ color: "#16A34A" }} />
              </div>
              <h3 className="text-sm font-bold text-gray-600">
                GANANCIAS TOTALES
              </h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#16A34A" }}>
              ${totalGanancias.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Margen promedio:{" "}
              {totalVentas > 0
                ? ((totalGanancias / totalVentas) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#EFF6FF" }}
              >
                <Package size={20} style={{ color: "#2563EB" }} />
              </div>
              <h3 className="text-sm font-bold text-gray-600">
                PRODUCTOS ACTIVOS
              </h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#2563EB" }}>
              {productos.filter((p) => p.activo).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {
                productos.filter((p) => p.activo && p.stock <= p.stock_minimo)
                  .length
              }{" "}
              con stock bajo
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50">
              <CreditCard size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                VENTAS POR FORMA DE PAGO
              </h3>
              <p className="text-xs text-gray-500">
                Monto transaccionado según medio de pago
              </p>
            </div>
          </div>

          {pieData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="w-full max-w-[300px] h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [
                        "$" + value.toFixed(2),
                        "Total",
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full flex flex-col gap-3">
                {pieData
                  .sort((a, b) => b.value - a.value)
                  .map((entry, idx) => {
                    const percentage =
                      totalVentas > 0
                        ? ((entry.value / totalVentas) * 100).toFixed(1)
                        : 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                          <span className="font-semibold text-gray-700 text-sm">
                            {entry.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">
                            ${entry.value.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {percentage}% del total
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">
                Aún no hay ventas para mostrar esta estadística.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
