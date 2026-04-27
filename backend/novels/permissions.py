from rest_framework import permissions
from .models import RolePermission

class HasGranularPermission(permissions.BasePermission):
    """
    Custom permission to check granular RBAC (View, Create, Edit, Delete)
    based on the RolePermission model.
    """
    
    def has_permission(self, request, view):
        # 1. Allow if not authenticated (or let other permission classes handle it)
        if not request.user or not request.user.is_authenticated:
            return False
            
        # 2. Get resource name from view
        resource_name = getattr(view, 'resource_name', None)
        action = getattr(view, 'action', None)
        print(f"DEBUG PERM: User={request.user.email}, Resource={resource_name}, Action={action}, Method={request.method}")
        
        if not resource_name:
            # If no resource name defined, we might want to default to deny or allow
            # For this project, we'll allow if it's not a protected resource
            return True

        # NEW: Always allow 'me' action for any authenticated user
        if action == 'me':
            return True
            
        # 3. Admin bypass (Optional, but safe)
        user_role = request.user.role
        if user_role and user_role.name.lower() == 'admin':
            return True
            
        # 4. Map DRF actions to granular permissions
        # view.action is available for ViewSets
        action = getattr(view, 'action', None)
        
        # Mapping DRF actions to our RolePermission fields
        action_mapping = {
            'list': 'can_view',
            'retrieve': 'can_view',
            'create': 'can_create',
            'update': 'can_edit',
            'partial_update': 'can_edit',
            'destroy': 'can_delete',
            # Custom actions
            'confirm_payment': 'can_edit',
            'cancel_order': 'can_edit',
            'stats': 'can_view',
            'update_permissions': 'can_edit',
            'my_coupons': 'can_view',
            'me': 'can_view',
            'checkout': 'can_create',
            'bulk_assign': 'can_create',
        }
        
        required_permission = action_mapping.get(action)
        
        # If action is not in mapping, we might be using standard HTTP methods (APIView)
        if not required_permission:
            method_mapping = {
                'GET': 'can_view',
                'POST': 'can_create',
                'PUT': 'can_edit',
                'PATCH': 'can_edit',
                'DELETE': 'can_delete',
            }
            required_permission = method_mapping.get(request.method)

        if not required_permission:
            return False

        # 5. Check database for the specific permission
        try:
            perm = RolePermission.objects.get(role=user_role, resource=resource_name)
            return getattr(perm, required_permission, False)
        except RolePermission.DoesNotExist:
            return False
