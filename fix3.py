import re

with open('src/pages/AdminTools.tsx', 'r') as f:
    content = f.read()

secure_code_new = """      try {
        const jsonString = event.target?.result as string;
        const parsedData = parseImportedSave(jsonString) as any;

        // Handle both raw GameState and wrapped { state: GameState, slotId?: string } formats
        const newState = (parsedData.state && parsedData.player === undefined)
          ? parsedData.state
          : parsedData;

        setState(newState);
        toast.success('Save imported successfully');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to parse save file');
      }"""

# replace the block
content = re.sub(
    r"      try \{.*?toast\.success\('Save imported successfully'\);\n      \} catch \(err\) \{.*?\}",
    secure_code_new,
    content,
    flags=re.DOTALL
)

with open('src/pages/AdminTools.tsx', 'w') as f:
    f.write(content)
