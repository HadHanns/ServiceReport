import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.tsx";
import { AuthProvider } from "./hooks/useAuth";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
