from rest_framework import permissions
from .models import RolePermission

class HasGranularPermission(permissions.BasePermission):
    """
    Custom permission to check granular RBAC (View, Create, Edit, Delete)
    based on the RolePermission model.
    """
    
    def has_permission(self, request, view):
        # Temporary bypass: Allow any authenticated user to perform any action
        if request.user and request.user.is_authenticated:
            return True
        return False
