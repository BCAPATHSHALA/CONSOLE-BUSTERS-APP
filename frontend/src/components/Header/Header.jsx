import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Header = () => {
  const { isAuthenticated } = useSelector((state) => state.user);

  return (
    <>
      <div className="navbar bg-base-100 p-5 text-[#cfbdec]">
        {/* Section One */}
        <div className="flex-1">
          <Link to={"/"}>
            <a className="link no-underline text-2xl font-Nunito">
              CONSOLE BUSTERS
            </a>
          </Link>
        </div>
        {/* Section Two */}
        <div className="flex-none gap-2">
          {/* Search Section */}
          <div className="form-control">
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered w-24 md:w-auto"
            />
          </div>
          {/* Non Authentication Section */}
          {!isAuthenticated && (
            <>
              <div className=" flex gap-4">
                <Link to={"/login"}>
                  <a className="btn btn-ghost text-[#252525] bg-[#742ff6]">
                    Login
                  </a>
                </Link>
                <Link to={"/signup"}>
                  <a className="btn btn-ghost">Signup</a>
                </Link>
              </div>
            </>
          )}
          {/* Authentication Section */}
          {isAuthenticated && (
            <>
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle avatar"
                >
                  <div className="w-10 rounded-full">
                    <img
                      alt="Tailwind CSS Navbar component"
                      src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
                    />
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
                >
                  <li>
                    <a className="justify-between">
                      Profile
                      <span className="badge">New</span>
                    </a>
                  </li>
                  <li>
                    <a>Settings</a>
                  </li>
                  <li>
                    <a>Logout</a>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
