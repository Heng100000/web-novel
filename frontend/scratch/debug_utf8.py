
import sys

def find_corruption(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()
        
    try:
        content.decode('utf-8')
        print("No corruption found by decoder")
    except UnicodeDecodeError as e:
        print(f"Corruption at index: {e.start}")
        print(f"Line number: {content[:e.start].count(b'\n') + 1}")
        
        # Print context
        start_context = max(0, e.start - 50)
        end_context = min(len(content), e.start + 100)
        context = content[start_context:end_context]
        print(f"Context (hex): {context.hex(' ')}")
        print(f"Context (repr): {repr(context)}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    find_corruption(r'd:\Project\book-novel\frontend\src\app\dashboard\_components\checkout-modal.tsx')
