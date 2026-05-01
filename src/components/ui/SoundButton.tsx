/**
 * SoundButton — Button wrapper with tactile audio feedback
 * Automatically plays ui_click sound on pointer down
 */
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Button, type ButtonProps } from '@/components/ui/button';
import { audioManager } from '@/lib/AudioManager';

export interface SoundButtonProps extends ButtonProps {
  /** Disable click sound for this button */
  mute?: boolean;
  /** Sound type to play (default: 'ui_click') */
  sound?: 'ui_click' | 'hit' | 'crit' | 'clash' | 'coin';
}

/**
 * SoundButton — Button with automatic click sound feedback
 *
 * Usage:
 * ```tsx
 * <SoundButton onClick={handleAction}>Click Me</SoundButton>
 * <SoundButton variant="ghost" mute>Silent Button</SoundButton>
 * ```
 */
const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ onPointerDown, mute = false, sound = 'ui_click', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : Button;

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        if (!mute) {
          audioManager.play(sound);
        }
        onPointerDown?.(e);
      },
      [mute, sound, onPointerDown]
    );

    return <Comp ref={ref} onPointerDown={handlePointerDown} {...props} />;
  }
);

SoundButton.displayName = 'SoundButton';

export { SoundButton };
