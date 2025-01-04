const User = require("../users/User.model.js");
const getPaginationParams = require("../../utils/pagination.js");

// GET All users _______________________________________________________________
async function retUsersAll(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      return res.json({
        users: [],
        pagination: {
          totalUsers: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
      });
    }
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error("Error retrieving users:", err);
    res
      .status(500)
      .json({ error: "Error retrieving users", details: err.message });
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
    console.log("req.body user.controller ==== ", req.body);
    console.log("User ID user.controller ==== ", req.params.id);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User updated successfully: ", updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log("Error updating the user: ", err);
    res.status(400).json({ error: err.message });
  }
}


module.exports = {
  retUsersAll,
  retUserById,
  updateUser
};
