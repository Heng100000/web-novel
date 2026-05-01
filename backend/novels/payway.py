import hmac
import hashlib
import base64
import datetime
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class PayWayService:
    @staticmethod
    def generate_hash(data_string):
        """Generates HMAC-SHA512 hash as required by ABA PayWay"""
        secret = settings.ABA_PAYWAY_API_KEY.encode('utf-8')
        message = data_string.encode('utf-8')
        # Using standard SHA512 for ABA PayWay
        signature = hmac.new(secret, message, digestmod=hashlib.sha512).digest()
        return base64.b64encode(signature).decode('utf-8')

    @staticmethod
    def get_payment_data(order, items_data, shipping_amount="0.00", return_url=None, continue_success_url=None):
        """
        Prepares the data payload for ABA PayWay Checkout.
        """
        req_time = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        merchant_id = settings.ABA_PAYWAY_MERCHANT_ID
        tran_id = f"ORDER-{order.id}-{req_time[-6:]}"
        
        # Amount: 2 decimal places
        amount = "{:.2f}".format(float(order.total_amount))
        
        # Format items correctly
        formatted_items = []
        for item in items_data:
            formatted_items.append({
                "name": item.get("name", "Book"),
                "quantity": str(item.get("quantity", "1")),
                "price": "{:.2f}".format(float(item.get("price", 0)))
            })
        
        # Add shipping workaround
        ship_val = float(shipping_amount)
        if ship_val > 0:
            formatted_items.append({
                "name": "Shipping Fee",
                "quantity": "1",
                "price": "{:.2f}".format(ship_val)
            })
            
        items_json = json.dumps(formatted_items, separators=(',', ':'))
        items_base64 = base64.b64encode(items_json.encode('utf-8')).decode('utf-8')
        
        shipping = "0"
        type_val = "purchase"
        payment_option = "abapay"
        
        # Default URLs
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://our-novel.com')
        return_url = return_url or f"{frontend_url}/payment-status"
        continue_success_url = continue_success_url or f"{frontend_url}/dashboard"
        return_url_base64 = base64.b64encode(return_url.encode('utf-8')).decode('utf-8')
        continue_success_url_base64 = base64.b64encode(continue_success_url.encode('utf-8')).decode('utf-8')

        first_name = "Customer"
        last_name = "User"
        email = order.user.email if order.user else "guest@example.com"
        phone = order.user.phone if order.user and order.user.phone else "012345678"

        currency = "USD"

        # V1/V3 STANDARD ORDER:
        hash_str = (
            str(req_time) + 
            str(merchant_id) + 
            str(tran_id) + 
            str(amount) + 
            str(items_base64) + 
            str(shipping) + 
            str(first_name) + 
            str(last_name) + 
            str(email) + 
            str(phone) + 
            str(type_val) + 
            str(payment_option) + 
            str(return_url_base64) + 
            str(continue_success_url_base64) +
            str(currency)
        )
        
        print("-" * 50)
        print(f"DEBUG: ABA HMAC-SHA512 Hash String -> |{hash_str}|")
        print("-" * 50)
        
        hash_value = PayWayService.generate_hash(hash_str)
        
        return {
            'req_time': req_time,
            'merchant_id': merchant_id,
            'tran_id': tran_id,
            'amount': amount,
            'items': items_base64,
            'hash': hash_value,
            'firstName': first_name,
            'lastName': last_name,
            'email': email,
            'phone': phone,
            'type': type_val,
            'payment_option': payment_option,
            'currency': 'USD',
            'return_url': return_url_base64,
            'continue_success_url': continue_success_url_base64,
            'shipping': shipping,
            'api_url': settings.ABA_PAYWAY_API_URL
        }
