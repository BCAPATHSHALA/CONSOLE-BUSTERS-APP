import { Outlet, useNavigate } from "react-router-dom";
import { Footer, Header } from "./components";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { loadUser } from "./app/actions/userAction";
import {
  clearAccessToken,
  clearError,
  clearMessage,
} from "./app/reducers/userAccountSlice";
import toast, { Toaster } from "react-hot-toast";

const App = () => {
  const { message, error, accessToken } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  console.log("message: ", message);
  console.log("error: ", error);
  console.log("accessToken: ", accessToken);

  // Dispatching the user state while rendering the home page at the beginning
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Showing the toast message or error while dispatching the action of state
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
    }
  }, [dispatch, error, message]);

  // Redirection on page while loading web page
  useEffect(() => {
    const checkAccessToken = async () => {
      if (!accessToken) {
        if (window.location.pathname !== "/login") {
          console.log("Path: ", window.location.pathname);
          navigate(window.location.pathname);
        }
        return;
      }

      try {
        dispatch(loadUser());
      } catch (error) {
        if (error.response?.status === 401) {
          dispatch(clearAccessToken());
        }
      }
    };
    checkAccessToken();
  }, [accessToken, dispatch, navigate]);

  return (
    <div className="App min-h-scree">
      <div className="w-full relative">
        <div className="z-20 w-full fixed top-0">
          <Header />
        </div>
        <main className="w-full relative">
          <Outlet />
        </main>
        <Footer />
        <Toaster position="bottom-right" reverseOrder={false} />
      </div>
    </div>
  );
};

export default App;

/*
#742ff6
#cfbdec
#252525
#ffffff
#fdf395
#ee8352
#a7c5fa
#13131a
*/
