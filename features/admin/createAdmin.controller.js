const bcrypt = require('bcryptjs');
const User = require('../users/User.model.js');

// Creates an administrator (firt register) when the BD is empty
async function createAdmin() {
  try {
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('Ya existe un administrador en la base de datos.');
      return;
    }
    
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const admin = new User({
      username: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true, 
    });

    await admin.save();
    console.log('Administrador creado exitosamente');
  } catch (err) {
    console.error('Error al crear el administrador:', err);
  }
}

module.exports = createAdmin;
