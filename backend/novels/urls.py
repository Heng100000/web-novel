from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("books", views.BookViewSet, basename="book")
router.register("authors", views.AuthorViewSet, basename="author")
router.register("categories", views.CategoryViewSet, basename="category")
router.register("events", views.EventViewSet, basename="event")
router.register("add-to-cart", views.AddToCartViewSet, basename="add-to-cart")
router.register("orders", views.OrderViewSet, basename="order")
router.register("users", views.UserViewSet, basename="user")
router.register("roles", views.RoleViewSet, basename="role")
router.register("coupons", views.CouponViewSet, basename="coupon")
router.register("user-coupons", views.UserCouponViewSet, basename="user-coupon")
router.register("notifications", views.NotificationViewSet, basename="notification")
router.register("favorites", views.FavoriteViewSet, basename="favorite")


urlpatterns = [
    path("health/", views.health, name="health"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/google/", views.GoogleLoginView.as_view(), name="google-login"),
    path("auth/facebook/", views.FacebookLoginView.as_view(), name="facebook-login"),
    path("auth/profile/", views.UserProfileView.as_view(), name="user-profile"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("payway/initiate/", views.PayWayInitiateView.as_view(), name="payway-initiate"),
    path("payway/callback/", views.PayWayCallbackView.as_view(), name="payway-callback"),
    path("payway/check-status/", views.PayWayCheckStatusView.as_view(), name="payway-check-status"),
    path("track-visit/", views.track_site_visit, name="track-site-visit"),
    path("analytics/", views.admin_analytics, name="admin-analytics"),
    *router.urls,
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)