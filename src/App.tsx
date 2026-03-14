import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { TaxPeriodProvider } from "./context/TaxPeriodContext";
import AuthCallback from "@/pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy Load Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FileReturnsPage = lazy(() => import("./components/FileReturnsPage"));
const Gstr1PrepareOnlinePage = lazy(() => import("@/components/Gstr1PrepareOnlinePage"));
const B2BPage = lazy(() => import("@/components/B2BPage"));
const AddB2BRecordPage = lazy(() => import("@/components/AddB2BRecordPage"));
const B2CSPage = lazy(() => import("@/components/B2CSPage"));
const AddB2CSDetailsPage = lazy(() => import("@/components/AddB2CSDetailsPage"));
const NilRatedSuppliesPage = lazy(() => import("@/components/NilRatedSuppliesPage"));
const HsnSummaryPage = lazy(() => import("@/components/HsnSummaryPage"));
const DocumentsIssuedPage = lazy(() => import("@/components/DocumentsIssuedPage"));
const Gstr1SummaryPage = lazy(() => import("@/components/Gstr1SummaryPage"));
const Gstr3bPrepareOnlinePage = lazy(() => import("@/components/Gstr3bPrepareOnlinePage"));
const Gstr3bSection31Page = lazy(() => import("@/components/Gstr3bSection31Page"));
const Gstr3bEligibleItcPage = lazy(() => import("@/components/Gstr3bEligibleItcPage"));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const Gstr3bPaymentOfTaxPage = lazy(() => import("./pages/Gstr3bPaymentOfTaxPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));

const queryClient = new QueryClient();

/**
 * App Component
 * UI ONLY - No backend, no authentication logic
 * Routes: /login
 */

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <TaxPeriodProvider>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Returns Routes - Protected */}
                <Route path="/returns" element={
                  <ProtectedRoute>
                    <FileReturnsPage />
                  </ProtectedRoute>
                } />
                <Route path="/file-returns" element={
                  <ProtectedRoute>
                    <FileReturnsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/returns/gstr1/prepare-online" element={
                  <ProtectedRoute>
                    <Gstr1PrepareOnlinePage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/b2b" element={
                  <ProtectedRoute>
                    <B2BPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/b2b/add" element={
                  <ProtectedRoute>
                    <AddB2BRecordPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/b2cs" element={
                  <ProtectedRoute>
                    <B2BPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/b2cs/add" element={
                  <ProtectedRoute>
                    <AddB2CSDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/nil-rated" element={
                  <ProtectedRoute>
                    <NilRatedSuppliesPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/hsn-summary" element={
                  <ProtectedRoute>
                    <HsnSummaryPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/documents-issued" element={
                  <ProtectedRoute>
                    <DocumentsIssuedPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr1/summary" element={
                  <ProtectedRoute>
                    <Gstr1SummaryPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr3b/prepare-online" element={
                  <ProtectedRoute>
                    <Gstr3bPrepareOnlinePage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr3b/3-1" element={
                  <ProtectedRoute>
                    <Gstr3bSection31Page />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr3b/eligible-itc" element={
                  <ProtectedRoute>
                    <Gstr3bEligibleItcPage />
                  </ProtectedRoute>
                } />
                <Route path="/returns/gstr3b/payment-of-tax" element={
                  <ProtectedRoute>
                    <Gstr3bPaymentOfTaxPage />
                  </ProtectedRoute>
                } />

                <Route path="/ledger" element={
                  <ProtectedRoute adminOnly={true}>
                    <LedgerPage />
                  </ProtectedRoute>
                } />

                <Route path="/payment-success" element={
                  <ProtectedRoute>
                    <PaymentSuccessPage />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TaxPeriodProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
