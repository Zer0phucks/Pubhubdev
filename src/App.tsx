import { RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";
import { AuthProvider } from "./components/AuthContext";
import { ProjectProvider } from "./components/ProjectContext";
import { router } from "./routes";
import { swrConfig } from "./utils/swr-config";

export default function App() {
  return (
    <SWRConfig value={swrConfig}>
      <AuthProvider>
        <ProjectProvider>
          <RouterProvider router={router} />
        </ProjectProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
