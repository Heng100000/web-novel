
import sys

def fix_file(input_path, output_path):
    with open(input_path, 'rb') as f:
        content = f.read()
    
    # Remove the specific invalid byte at 8198
    # We can also just decode with ignore and encode back to utf-8
    fixed_content = content.decode('utf-8', errors='ignore').encode('utf-8')
    
    with open(output_path, 'wb') as f:
        f.write(fixed_content)
    print(f"Fixed file written to {output_path}")

if __name__ == "__main__":
    fix_file(r'd:\Project\book-novel\frontend\src\app\dashboard\_components\checkout-modal.tsx', 
             r'd:\Project\book-novel\frontend\src\app\dashboard\_components\checkout-modal.tsx.fixed')
