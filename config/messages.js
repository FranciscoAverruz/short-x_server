const messages = {
    // user
    OkEmpty: "An error occurred while retrieving Data", // 200
    BadRequest: " The authentication token is missing from the request.", // 400
    Unauthorized: "The authentication token is invalid or has expired.",  // 401
    UserNotFound: "The User was not found", // 404

    // general
    ServerError: "Internal Error, Please try later" // 500

  };
  
  module.exports = messages;
