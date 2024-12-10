const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
const token = req.header('Authorization')?.split(' ')[1];
console.log('Token recibido:', token);
if (!token) {
  return res.status(401).json({ message: messages.Unauthorized });
}

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token decodificado:', decoded); 

  if (!decoded.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. No eres administrador.' });
  }

  req.user = decoded; 
  next();
} catch (err) {
  return res.status(400).json({ message: 'Token inválido o expirado.' });
}


};

module.exports = verifyAdmin;
