import { Link } from "react-router-dom";
import MyContainer from "../Container/MyContainer";

const Hero = () => {
  return (
    <MyContainer
      className="hero relative bg-cover bg-center bg-no-repeat bg-[#1D232A]"
      style={{
        backgroundImage:
          "url(https://img.freepik.com/free-vector/modern-desktop-background-geometric-blue-design-vector_53876-135923.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="hero-overlay absolute  bg-opacity-60"></div>
      <div className="hero-content relative z-10 flex flex-col items-center justify-center text-center text-neutral-content min-h-screen">
        <div className="max-w-3xl md:min-h-96">
          <h1 className="mb-5 text-5xl font-bold font-Nunito md:text-7xl text-[#13131a]">
            CONSOLE BUSTERS
          </h1>
          <p className="mb-5">
            Welcome to Console Busters Portfolio Builder! This web application
            allows users to create and manage their own professional portfolios,
            showcasing their skills and projects.
          </p>
          <Link to={"/profile/create-portfolio"}>
            <button className="btn text-base-300 btn-ghost bg-[#cfbdec]">
              Create Portfolio
            </button>
          </Link>
        </div>
      </div>
    </MyContainer>
  );
};

export default Hero;
