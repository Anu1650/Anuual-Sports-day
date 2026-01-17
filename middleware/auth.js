const authMiddleware = {
    // Check if user is authenticated as admin
    isAuthenticated: (req, res, next) => {
      if (req.session.admin) {
        return next();
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access. Please login as admin.' 
      });
    },
  
    // Check if admin has specific role
    isAdmin: (req, res, next) => {
      if (req.session.admin && (req.session.admin.role === 'admin' || req.session.admin.role === 'superadmin')) {
        return next();
      }
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. Admin access required.' 
      });
    }
  };
  
  module.exports = authMiddleware;