import { pick } from '@/utils/random';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

const ORIGINS = [
  'Found as an infant in the collapsed mines beneath Ironveil',
  'Survived alone in the Ashwood after bandits razed a village',
  'Pulled from the wreckage of a merchant caravan on the Dread Road',
  'Abandoned at the orphanage gates during the Crimson Winter',
  'A dock rat from the harbor slums of Port Kethara',
  'Discovered wandering the battlefield after the Siege of Thornwall',
  "Born in a debtors' prison, raised by the wardens' charity",
  'The sole survivor of a plague ship that washed ashore near Gulltown',
  'Grew up scrapping for scraps in the fighting pits of Dusthollow',
  'A runaway from a traveling circus, scarred but unbroken',
  'Taken from a slave caravan by arena scouts before reaching market',
  'Left on the steps of the Temple of Iron during a blood moon',
  'Raised feral in the sewers beneath the Colosseum district',
  'Escaped a collapsed quarry at age seven, dragging two others to safety',
  'The child of a disgraced gladiator, born in the shadow of the arena',
  'Found clutching a broken sword in the ruins of Fort Ashenmere',
  'A former temple acolyte who traded prayers for a practice sword',
  'Left at a roadside inn during a summer festival, raised by the kitchen staff',
  'Found in the ruins of a library, clutching a scroll on anatomy',
  'Escaped from a salt mine after a cave-in killed the guards',
  'The child of a fallen knight, found wandering the high mountain passes',
  'A stowaway from the distant Southern Isles, discovered in a spice crate',
  'Born during a solar eclipse, considered an omen of blood and iron',
  'Survived the burning of the Great Forest by hiding in a hollow log',
  'A street urchin who won a bet with an arena recruiter',
  'Found under the floorboards of a tailor shop after a city riot',
  'The only survivor of a mountain pass avalanche',
  'Raised by a retired trainer in a remote fishing village',
  'Found adrift on a raft in the middle of the Great Sea',
  'Discovered in the heart of a hedge maze, silent and watchful',
];

const CHILDHOOD_TRAITS = [
  'was known for stealing bread from the temple kitchen',
  'spent nights watching the stars from the orphanage roof',
  'often got into fights with the older boys and won',
  'preferred the company of stray dogs to other children',
  'secretly practiced with a heavy wooden branch in the woods',
  'would spend hours drawing technical diagrams in the dirt',
  'earned a reputation as a peacemaker among the street urchins',
  'could hold their breath for three minutes in the harbor pits',
  'was obsessed with the stories of the old arena champions',
  'learned to move without making a single sound in the shadows',
  'developed a freakish grip strength from climbing the quarry walls',
  'spent their few coins on medical scrolls instead of food',
  'would sit in silence for hours, observing the birds of prey',
  'was the only one brave enough to explore the haunted ruins',
  'taught themselves to fight by imitating the arena trainees',
  'became a local legend for never backing down from a challenge',
];

const DEFINING_MOMENTS = [
  'until a recruiter saw them handle a practice sword with natural grace',
  'but everything changed when they saved the Headmistress from a fire',
  "growing into a restless youth with a hunger for the arena's glory",
  'waiting for the day they could finally leave the slums behind',
  'now seeking a master who can turn that raw potential into lethality',
  'possessing a gaze that suggests they have seen more than their share of blood',
  'driven by a quiet, burning desire to prove their worth to the world',
  'carrying the weight of their past with a grim, unyielding determination',
  'ready to trade their freedom for the chance to strike back at fate',
  'looking for the one fight that will finally set them free',
  'with a spirit that refuses to be broken by the grinding poverty of the pits',
  'now standing at the threshold of a legacy they are eager to claim',
];

export function generateLore(name: string, rng: IRNGService): string {
  const r = () => rng.next();
  const childhood = pick(CHILDHOOD_TRAITS, r);
  const defining = pick(DEFINING_MOMENTS, r);
  return `${name} ${childhood}, ${defining}.`;
}

export function generateOrigin(rng: IRNGService): string {
  return pick(ORIGINS, () => rng.next());
}
