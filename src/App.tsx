import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PaginaRifa from "./features/rifa/pages/PaginaRifa";
import PaginaCheckout from "./features/checkout/pages/PaginaCheckout";
import PaginaMeusBilhetes from "./features/meus-bilhetes/pages/PaginaMeusBilhetes";
import AdminLayout from "./features/admin/AdminLayout";
import Dashboard from "./features/admin/pages/Dashboard";
import Pedidos from "./features/admin/pages/Pedidos";
import Sorteio from "./features/admin/pages/Sorteio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/rifa/00000000-0000-0000-0000-000000000001" replace />} />
          <Route path="/rifa/:id" element={<PaginaRifa />} />
          <Route path="/checkout" element={<PaginaCheckout />} />
          <Route path="/meus-bilhetes" element={<PaginaMeusBilhetes />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="sorteio" element={<Sorteio />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
