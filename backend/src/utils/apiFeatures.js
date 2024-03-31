class ApiFeatures {
  // Step 1: initialize the queryObject via a specific DB collection and url queryString from params
  constructor(queryObject, queryString) {
    this.queryObject = queryObject;
    this.queryString = queryString;
  }

  //* API Feature 1: Searching user via username from User DB collection
  searchUser() {
    // Step 1: First create the query keyword (username)
    const keyword = this.queryString.username
      ? { username: { $regex: this.queryString.username, $options: "i" } }
      : {};

    // Step 2: get documents from DB collection
    // (this.queryObject.find({}) it is equal to User.find({}))
    this.queryObject = this.queryObject.find({ ...keyword });
    return this;
  }

  //* API Feature 2: Filter user via role and isBlocked from User DB collection
  filterUser() {
    // Step 1: First create the query keyword (role & isBlocked)
    /* 
    Copy queryString object as a duplicate (actual copy) due to modification. 
    we have to modify the queryString object according to filter user specifications (query keyword)
    */
    const copyQueryString = { ...this.queryString };

    // Remove some fields from copyQueryString to get the role keyword
    const removeFields = ["username", "page", "limit"];
    removeFields.forEach((key) => delete copyQueryString[key]);

    // Step 2: get documents from DB collection
    this.queryObject = this.queryObject.find(copyQueryString);
    return this;
  }

  //* API Feature 3: Pagination we want to show 5 document per page
  paginateUser(resultPerPage) {
    // Step 1: First create the query keyword (page)
    const currentPage = Number(this.queryString.page) || 1;
    const skipResult = resultPerPage * (currentPage - 1);

    // Step 2: get documents from DB collection
    this.queryObject = this.queryObject.limit(resultPerPage).skip(skipResult);
    return this;
  }
}

export { ApiFeatures };
