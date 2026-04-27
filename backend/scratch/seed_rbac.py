import os
import sys
import django

# Add the project root to sys.path
sys.path.append(os.getcwd())

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Role, RolePermission

def seed_rbac():
    roles_data = [
        {
            "name": "Admin",
            "name_km": "អ្នកគ្រប់គ្រង",
            "description": "មានសិទ្ធិពេញលេញលើប្រព័ន្ធទាំងមូល រួមទាំងការគ្រប់គ្រងអ្នកប្រើប្រាស់ និងហិរញ្ញវត្ថុ។"
        },
        {
            "name": "Staff",
            "name_km": "បុគ្គលិក",
            "description": "អាចគ្រប់គ្រងសៀវភៅ អ្នកនិពន្ធ និងការបញ្ជាទិញ ប៉ុន្តែមិនអាចកែប្រែការកំណត់ប្រព័ន្ធបានទេ។"
        },
        {
            "name": "Customer",
            "name_km": "អតិថិជន",
            "description": "អ្នកប្រើប្រាស់ទូទៅដែលអាចទិញសៀវភៅ និងមើលប្រវត្តិនៃការបញ្ជាទិញរបស់ពួកគេ។"
        }
    ]

    resources = ["books", "authors", "categories", "events", "cart", "orders", "users", "roles"]

    for r_data in roles_data:
        role, created = Role.objects.get_or_create(name=r_data["name"], defaults={
            "name_km": r_data["name_km"],
            "description": r_data["description"]
        })
        
        if created:
            print(f"Created role: {role.name}")
        
        for res in resources:
            perm_defaults = {
                "can_view": True,
                "can_create": False,
                "can_edit": False,
                "can_delete": False
            }
            
            # Admin gets everything
            if role.name == "Admin":
                perm_defaults = {k: True for k in perm_defaults}
            
            # Staff permissions
            elif role.name == "Staff":
                if res in ["books", "authors", "categories", "events"]:
                    perm_defaults = {"can_view": True, "can_create": True, "can_edit": True, "can_delete": False}
                elif res == "orders":
                    perm_defaults = {"can_view": True, "can_create": False, "can_edit": True, "can_delete": False}
            
            # Customer permissions
            elif role.name == "Customer":
                if res in ["cart", "orders"]:
                    perm_defaults = {"can_view": True, "can_create": True, "can_edit": False, "can_delete": False}
                elif res in ["books", "authors", "categories"]:
                    perm_defaults = {"can_view": True, "can_create": False, "can_edit": False, "can_delete": False}
                else:
                    perm_defaults = {"can_view": False, "can_create": False, "can_edit": False, "can_delete": False}

            RolePermission.objects.get_or_create(
                role=role,
                resource=res,
                defaults=perm_defaults
            )
            
    print("RBAC Seeding completed successfully!")

if __name__ == "__main__":
    seed_rbac()
