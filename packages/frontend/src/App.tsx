import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./store/AuthContext";
import { WordBookProvider } from "./store/WordBookContext";
import AppRouter from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WordBookProvider>
          <AppRouter />
        </WordBookProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
