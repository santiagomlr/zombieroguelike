# Impact Sound Assets

Place the category-specific impact audio files in the folders below using the exact filenames so they match the paths referenced by the game code. These sounds are grouped by enemy category; the runtime selects a random variant for the category of the enemy that was hit.

## Zombie (`public/audio/impacts/zombie`)
- `zombie_hit_1.wav`
- `zombie_hit_2.wav`
- `zombie_hit_3.wav`
- `zombie_growl_1.mp3`
- `zombie_growl_2.wav`
- `zombie_short_grunt.wav`
- `snarling_zombie.wav`

## Zombie Animal (`public/audio/impacts/zombie-animal`)
- `zombie_dog_hit.wav`
- `zombie_dog_growl_1.wav`
- `zombie_dog_growl_2.wav`

## Insect (`public/audio/impacts/insect`)
- `insect_smash_01.mp3`
- `insect_smash_02.mp3`
- `larva_move_1.wav`
- `larva_move_2.wav`

These filenames correspond to the new impact sounds that should be uploaded to the repository. The game will automatically preload them when present. See `src/audio/enemyImpactSounds.ts` for the category mappings used at runtime.
