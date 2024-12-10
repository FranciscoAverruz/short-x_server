const User = require('../users/User.model.js');

// GET Create a new User _______________________________________________________
async function createUser(req, res) {
  try {
    const newUser = await User.create(req.body);
    console.log(`Usuario creado correctamente: ${newUser}`);
    res.status(200).json(newUser);
  } catch (err) {
    console.log(`La creación de un nuevo usuario ha fallado: ${err}`);
    res.status(400).json({ error: err.message });
  }
}

// GET All users _______________________________________________________________
async function retUsersAll(req, res) {
  try {
    const users = await User.find();
    console.log("Usuarios encontrados: ", users);
    res.status(200).json(users);
  } catch (err) {
    console.log("Error al obtener los usuarios: ", err);
    res.status(400).json({ error: err.message });
  }
}

// GET User per ID _____________________________________________________________
async function retUserById(req, res) {
  try {
    const userDoc = await User.findById(req.params.id);
    if (!userDoc) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const { password, ...noPasswordUser } = userDoc.toObject();

    console.log("Usuario encontrado por ID: ", noPasswordUser);
    res.status(200).json(noPasswordUser);
  } catch (err) {
    console.log("Error al obtener el usuario por ID: ", err);
    res.status(400).json({ error: err.message });
  }
}

// Update User _____________________________________________________________
async function updateUser(req, res) {
  try {
    const { password, urls, ...userData } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userData },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    console.log("Usuario actualizado: ", updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log("Error al actualizar el usuario: ", err);
    res.status(400).json({ error: err.message });
  }
}

// change pasword ___________________________________________________________
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "La contraseña actual es incorrecta" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log("Contraseña cambiada exitosamente");
    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.log("Error al cambiar la contraseña: ", err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createUser,
  retUsersAll,
  retUserById,
  updateUser,
  changePassword
};
