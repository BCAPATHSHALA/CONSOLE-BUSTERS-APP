const MyContainer = ({ children, className = "", ...rest }) => {
  return (
    <div className={`w-full min-h-screen mx-auto ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default MyContainer;
