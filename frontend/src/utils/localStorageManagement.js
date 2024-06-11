//* LOGIN
function setItem(key, value) {
  // This method is invoked while user logged in to save the accessToken in local storage
  localStorage.setItem(key, value);
}

//* LOGGED IN ALLREADY
function getItem(key) {
  // This method is invoked when user is already logged in to access the accessToken from local storage
  return localStorage.getItem(key);
}

//* LOGGED OUT
function removeItem(key) {
  // This method is invoked when refreshToken has been expired
  localStorage.removeItem(key);
}

export { setItem, getItem, removeItem };
