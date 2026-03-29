import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { WordListsPage } from "@/pages/WordListsPage";
import { SessionPage } from "@/pages/SessionPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WordListsPage />} />
          <Route path="/session" element={<SessionPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
