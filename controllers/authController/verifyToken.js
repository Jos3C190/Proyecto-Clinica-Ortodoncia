const auth = require('../../middleware/auth');
const Paciente = require('../../models/Paciente'); // Corregida la ruta
const Odontologo = require('../../models/Odontologo'); // Corregida la ruta

const verifyToken = [
  // Aplicamos el middleware de autenticación.
  // Si el token es válido y el usuario tiene un rol permitido (en este caso, permitimos cualquier rol que pase el middleware),
  // la ejecución continuará al siguiente handler.
  // Si el token es inválido o falta, el middleware auth enviará una respuesta de error (401 o 403).
  // Pasar un array vacío [] a auth() significa que cualquier rol autenticado es aceptado para este endpoint de verificación.
  // Si quisieras restringir quién puede verificar su token (aunque no es común), podrías poner roles como ['admin'].
  auth([]),

  async (req, res) => { // Hacemos la función asíncrona para usar await
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      let user = null;

      // Buscar al usuario en la base de datos según su rol
      if (userRole === 'paciente') {
        user = await Paciente.findById(userId).select('nombre apellido');
      } else if (userRole === 'odontologo' || userRole === 'admin') {
        user = await Odontologo.findById(userId).select('nombre apellido');
      }
      // Puedes añadir más roles aquí si es necesario

      if (!user) {
        // Esto no debería ocurrir si el middleware auth funciona correctamente con IDs válidos
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Si llegamos aquí, el token fue válido y encontramos al usuario
      res.status(200).json({
        message: 'Token válido',
        user: {
          id: userId,
          role: userRole,
          nombre: user.nombre,
          apellido: user.apellido // Incluir apellido si aplica
        }
      });

    } catch (error) {
      console.error('Error al verificar token y obtener datos de usuario:', error);
      res.status(500).json({ message: 'Error interno del servidor al verificar token' });
    }
  }
];

module.exports = verifyToken; 