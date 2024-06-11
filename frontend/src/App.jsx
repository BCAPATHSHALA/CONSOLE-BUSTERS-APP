import { Outlet } from "react-router-dom";
import { Footer, Header } from "./components";

const App = () => {
  return (
    <div className="App min-h-scree">
      <div className="w-full">
        <Header />
        <main className="w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;
