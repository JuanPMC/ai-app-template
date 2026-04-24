import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { ManagerPage } from "@/pages/ManagerPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ManagerPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
