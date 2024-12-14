const User = require  ("../users/User.model.js");
const BlacklistedToken = require("./BlacklistedToken.js");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../../utils/email");
const path = require("path");
const verifyAdmin = require("../../middlewares/verifyAdmin.js"); // Importar el middleware

async function createUser({ username, email, isAdmin, urls, password }) {
  return await User.signup(username, email, isAdmin, urls, password);
}

//login user _____________________________________________________________________________
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

//signup user _____________________________________________________________________________
const signupUser = async (req, res) => {
  const { username, email, password, confirmPassword, urls, isAdmin } = req.body;

  try {
    // 1. Verificar si el usuario es administrador, usando el middleware `verifyAdmin`
    if (req.user && req.user.isAdmin) {
      // Si es un administrador, crea un usuario con la opción de ser administrador o no
      const provisionalPassword = Math.random().toString(36).slice(-8);

      // Si no se pasa el campo `isAdmin` en el cuerpo de la solicitud, por defecto será false
      const newUserIsAdmin = isAdmin !== undefined ? isAdmin : false;

      const user = await createUser({ username, email, urls, password: provisionalPassword, isAdmin: newUserIsAdmin });

      // Crear un token para permitir que el usuario configure su contraseña (solo si es un administrador)
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      // Enviar correo para configurar la contraseña
      const templatePath = path.join(__dirname, "../templates/passwordSetupTemplate.html");
      const setupLink = `${process.env.CLIENT_URL}/setup-password?token=${token}`;
      await sendEmail(email, "Configura tu contraseña", templatePath, { username, setupLink });

      return res.status(201).json({
        message: "User created successfully. An email has been sent for password setup.",
        user,
      });
    }

    // 2. Si no es un administrador (es un usuario normal), creamos al usuario normalmente
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Si no se especifica `isAdmin`, se asume que el usuario no es administrador
    const newUserIsAdmin = isAdmin !== undefined ? isAdmin : false;
    
    // Crear el usuario para un usuario normal
    const user = await createUser({ username, email, urls, password, isAdmin: newUserIsAdmin });

    // Enviar correo de confirmación de registro (para usuarios no administradores)
    const templatePath = path.join(__dirname, "../templates/userRegistrationTemplate.html");
    await sendEmail(email, "¡Registro Exitoso!", templatePath, { username });

    return res.status(201).json({ message: "User registered successfully.", user });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

// Logout user and invalidate the token on the server ____________________________________________
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