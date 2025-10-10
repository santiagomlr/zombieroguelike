# Impact Sound Assets

Place the category-specific impact audio files in the folders below using the exact filenames so they match the paths referenced by the game code. These sounds are grouped by enemy category; the runtime selects a random variant for the category of the enemy that was hit.

## Zombie (`public/audio/impacts/zombie`)
- `Zombie hit.wav`
- `zombie hit 2.wav`
- `zombie hit 3.wav`
- `zombie growl.mp3`
- `Zombie growl 2.wav`
- `Zombie short grunt.wav`
- `Snarling Zombie.wav`

## Zombie Animal (`public/audio/impacts/zombie-animal`)
- `Zombie dog hit.wav`
- `Zombie Dog.wav`

## Insect (`public/audio/impacts/insect`)
- `Insect Smash 01.mp3`
- `Insect Smash 02.mp3`
- `Larva move 1.wav`
- `Larva move 2.wav`

These filenames correspond to the impact sounds that ship with the game. Because the runtime resolves assets by exact path, keep the names—including spaces and capitalization—identical to the originals. The game will automatically preload them when present. See `src/audio/enemyImpactSounds.ts` for the category mappings used at runtime.
