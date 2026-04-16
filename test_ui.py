import re

with open('src/components/ui/PaperDoll.tsx', 'r') as f:
    content = f.read()
    if 'max-w-xs' in content:
        print('PaperDoll.tsx updated correctly.')
    else:
        print('PaperDoll.tsx failed update.')

with open('src/components/startGame/TitleScreenHero.tsx', 'r') as f:
    content = f.read()
    if 'max-w-[240px]' not in content and 'max-w-xs' in content:
        print('TitleScreenHero.tsx updated max-w-xs correctly.')
    else:
        print('TitleScreenHero.tsx failed max-w update.')
    if 'className="bg-[#0C0806]"' in content:
        print('TitleScreenHero.tsx inline style updated.')
    else:
        print('TitleScreenHero.tsx failed inline style update.')

with open('src/components/orphanage/StoryBeginsStep.tsx', 'r') as f:
    content = f.read()
    if 'max-w-xs' in content and 'max-w-[280px]' not in content:
        print('StoryBeginsStep.tsx updated max-w-xs correctly.')
    else:
        print('StoryBeginsStep.tsx failed max-w update.')
