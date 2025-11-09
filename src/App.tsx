import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { ProjectProvider } from "./components/ProjectContext";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <RouterProvider router={router} />
      </ProjectProvider>
    </AuthProvider>
  );
}
