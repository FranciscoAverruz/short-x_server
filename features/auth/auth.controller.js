const User = require  ("../users/User.model.js");
const BlacklistedToken = require("./BlacklistedToken.js");

//login user
const loginUser = async (req, res) => {
  const {email, password } = req.body

  try{
    const exists = await User.findOne({email});
    if (!exists){
      return res.status(404).json({msg: 'usuario no encontrado, por favor registrate'});
    }
    if (!exists.comparePassword(password)) {
      return res.status(400).json({ error: { password: 'Invalid Password' } });
    }
      return res.status(200).json({token: exists.generateJWT()});

  } catch (error){

      return res.status(500).json(error);
  }
}

//signup user
const signupUser = async (req, res) => {
  const {username, email, isAdmin, urls, password} = req.body

  try {
    const user = await User.signup(username, email, isAdmin, urls, password);
    return res.status(200).json({email, user});
  } catch (error){
    return res.status(400).json({error: error.message});
  }
}

// Logout user and invalidate the token on the server.
const logoutUser = async (req, res) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    await BlacklistedToken.create({ token }); // Blacklist the token.

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Error during logout" });
  }
};

module.exports = {
  loginUser,
  signupUser,
  logoutUser
}