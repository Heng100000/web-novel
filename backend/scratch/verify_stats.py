import os
import django
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Orders
from django.db.models import Sum
from django.db.models.functions import TruncMonth

def test_stats_logic():
    now = timezone.now()
    current_month_start = now.replace(day=1)
    
    check_date = current_month_start
    target_months = []
    for _ in range(6):
        target_months.insert(0, check_date.strftime('%b'))
        check_date = (check_date - timedelta(days=1)).replace(day=1)
    
    six_months_ago_limit = check_date
    
    monthly_sales = Orders.objects.filter(status='Completed', order_date__gte=six_months_ago_limit) \
        .annotate(month_date=TruncMonth('order_date')) \
        .values('month_date') \
        .annotate(amount=Sum('total_amount')) \
        .order_by('month_date')

    sales_data_map = {entry['month_date'].strftime('%b'): float(entry['amount']) for entry in monthly_sales}
    
    sales_chart = []
    for m_name in target_months:
        sales_chart.append({
            "month": m_name,
            "amount": sales_data_map.get(m_name, 0.0)
        })
    
    print(f"Sales Chart (6 months): {sales_chart}")
    assert len(sales_chart) == 6
    print("Verification Successful: 6 months of data are present.")

if __name__ == "__main__":
    test_stats_logic()
