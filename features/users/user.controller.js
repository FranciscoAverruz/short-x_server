const User = require('../users/User.model.js');

// GET All users _______________________________________________________________
async function retUsersAll(req, res) {
  try {
    const users = await User.find();
    console.log("Users not found: ", users);
    res.status(200).json(users);
  } catch (err) {
    console.log("Error retrieving users ", err);
    res.status(400).json({ error: err.message });
  }
}

// GET User per ID _____________________________________________________________
async function retUserById(req, res) {
  try {
    const userDoc = await User.findById(req.params.id);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...noPasswordUser } = userDoc.toObject();

    console.log("User found by ID: ", noPasswordUser);
    res.status(200).json(noPasswordUser);
  } catch (err) {
    console.log("Error retrieving user by ID ", err);
    res.status(400).json({ error: err.message });
  }
}

// Update User _____________________________________________________________
async function updateUser(req, res) {
  try {
    const { password, urls, isAdmin, ...userData } = req.body;

    if (isAdmin !== undefined && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to change the role.' });
    }

    if (isAdmin !== undefined) {
      userData.isAdmin = isAdmin;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userData },
      { new: true, runValidators: true }
    ); 

    if (!updatedUser) {
      return res.status(404).json({ message: "user not found" });
    }

    console.log("User updated succesfully: ", updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log("Error updating the user: ", err);
    res.status(400).json({ error: err.message });
  }
}


// change pasword ___________________________________________________________
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mismatching password" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log("Password changed succesfully");
    res.status(200).json({ message: "Password changed succesfully" });
  } catch (err) {
    console.log("Error changing the password ", err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  retUsersAll,
  retUserById,
  updateUser,
  changePassword
};
