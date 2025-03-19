const User = require("../features/users/User.model"); 

const createValidatedUser = async ({ username, email, password, confirmPassword, urls, isAdmin, plan }) => {

  if (!password || password.length < 5 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
    throw new Error("La contraseña debe tener al menos 5 caracteres, incluir una mayúscula, un número y un símbolo especial.");
  }

  if (password !== confirmPassword) {
    throw new Error("Las contraseñas no coinciden.");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Este correo ya está registrado.");
  }

  const newUser = await User.signup(username, email, isAdmin, urls, password, plan);

  return newUser;
};

module.exports = createValidatedUser;

  