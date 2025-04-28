const jwt = require('jsonwebtoken');

const auth = (rolesPermitidos) => {
    return (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token proporcionado' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { id, role }

            if (!rolesPermitidos.includes(req.user.role)) {
                return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Token inválido' });
        }
    };
};

module.exports = auth;