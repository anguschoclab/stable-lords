import re
import os

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Fix max-w-[px] and w-[px] with Tailwind standard classes
    content = re.sub(r'max-w-\[200px\]', 'max-w-xs', content)
    content = re.sub(r'max-w-\[220px\]', 'max-w-xs', content)
    content = re.sub(r'max-w-\[240px\]', 'max-w-xs', content)
    content = re.sub(r'max-w-\[280px\]', 'max-w-xs', content)
    content = re.sub(r'max-w-\[420px\]', 'max-w-md', content)
    content = re.sub(r'w-\[200px\]', 'w-48', content)
    content = re.sub(r'w-\[400px\]', 'w-96', content)
    content = re.sub(r'w-\[60%\]', 'w-3/5', content)
    content = re.sub(r'w-\[1px\]', 'w-px', content)
    content = re.sub(r'h-\[1px\]', 'h-px', content)
    content = re.sub(r'h-\[2px\]', 'h-0.5', content)
    content = re.sub(r'w-\[2px\]', 'w-0.5', content)

    # 2. Add aria-label to buttons
    parts = content.split('<button')
    new_content = parts[0]
    for part in parts[1:]:
        in_string = False
        string_char = None
        in_jsx = 0
        tag_end = -1
        for i, char in enumerate(part):
            if in_string:
                if char == string_char:
                    in_string = False
            else:
                if char in ['"', "'"]:
                    in_string = True
                    string_char = char
                elif char == '{':
                    in_jsx += 1
                elif char == '}':
                    in_jsx -= 1
                elif char == '>' and in_jsx == 0:
                    tag_end = i
                    break

        if tag_end != -1:
            button_attrs = part[:tag_end]
            if 'aria-label' not in button_attrs and '{...props}' not in button_attrs and 'dangerouslySetInnerHTML' not in button_attrs:
                # Add it right after <button
                part = ' aria-label="button"' + part
        new_content += '<button' + part

    content = new_content

    # 3. Fix inline styles. `style={{ color: 'red' }}` -> standard Tailwind.
    content = re.sub(r'style=\{\{\s*background:\s*"#0C0806"\s*\}\}', 'className="bg-[#0C0806]"', content)
    content = re.sub(r'style=\{\{\s*top:\s*"-60px"\s*\}\}', 'className="-top-[60px]"', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for subdir, dirs, files in os.walk("src/components"):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(subdir, file)
            # Skip primitive files which are likely wrapping native elements properly already.
            # e.g., src/components/ui/button.tsx
            if 'ui/button.tsx' in filepath: continue
            process_file(filepath)
