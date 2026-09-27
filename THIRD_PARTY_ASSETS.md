# Third-Party Assets

## Cute Character Cat

- Creator: kikkojinji1
- Original source: https://rive.app/marketplace/27883-52700-cute-character-cat/
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- License URL: https://creativecommons.org/licenses/by/4.0/
- Date obtained: August 24, 2026
- Local asset: `public/assets/task-coach/cute-character-cat.riv`
- SHA-256: `3fcd8006f0739ac03a136c5bd61f9edfcd0fac7eeabf2aad14efbac47ebc7b96`

The original `.riv` artwork and rig are unchanged. Kids Task Calendar adds an application-level semantic adapter that maps assistant states to the asset's inspected numeric state-machine modes and adds small status badges for states the original asset does not provide. The inspected original supports idle/wink, hi, and fish reactions; it does not provide dedicated listening, thinking, speaking, error, or sleeping animations. Runtime inspection confirms native pointer listeners, including the fish and greeting controls. `Number 1` selects idle/wink (0), greeting (1), and fish play (2); duplicate animation names are not invoked directly.

The creator does not endorse Kids Task Calendar. This artwork is third-party content licensed under CC BY 4.0; it is not owned by this project and is not treated as an exclusive project trademark.

## Cat Simple Edit

- Creator: nvr
- Original source: https://rive.app/marketplace/8999-17412-cat-simple-edit/
- Remix of: Cat following the mouse by Pedro Alpera
- Remix source: https://rive.app/marketplace/3920-8202-cat-following-the-mouse/
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- License URL: https://creativecommons.org/licenses/by/4.0/
- Date obtained: August 25, 2026
- Local asset: `public/assets/task-coach/cat-simple-edit.riv`
- SHA-256: `e04ad49141e3ead61d683e8010fa9d4d2d2f7b7ef118ed81a4abd77b021f875f`

The original `.riv` artwork and rig are unchanged. The inspected runtime file contains the 500-by-500 `Cat` artboard, `State Machine 1`, and native `Idle` and `Blink` animations. It has no exposed state-machine inputs but does have native pointer listeners and pupil/head targets for cursor interaction. There is no separately exposed walking animation. Kids Task Calendar retains the asset's native motion and adds application-level status badges for assistant states the original does not provide. The asset renders on a transparent canvas without an opaque square background.

The creators do not endorse Kids Task Calendar. This artwork is third-party content licensed under CC BY 4.0; it is not owned by this project and is not treated as an exclusive project trademark.

The matching `.png` files beside both `.riv` assets are 256×256 still frames rendered locally from those unchanged assets. They are used as loading, failure, and reduced-motion posters and retain the same CC BY 4.0 attribution. The cute cat uses input 1 (hi/wave) for arrival, celebration, and the Wave action; input 2 (fish) is available through Play. Unsupported semantic states retain native idle with a status badge. Play actions cannot interrupt thinking, speaking, or celebration. Both state machines remain mounted and pause while hidden; reduced motion uses the still posters. Native orange hit areas are normalized to the original square artboard and transformed with Fit.Contain; labelled 44px controls provide accessible equivalents.
