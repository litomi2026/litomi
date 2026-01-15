import type { CharacterDefinition } from '../types/characterDefinition'

import arisJSON from './alice_tendou.json'
import aruJSON from './aru_rikuhachima.json'
import { buildCharacter, type CharacterJsonDefinition } from './buildCharacter'
import neoJSON from './neo.json'
import shiyeonJSON from './shiyeon.json'
import yumiJSON from './yumi.json'

const typedArisJSON = arisJSON satisfies CharacterJsonDefinition
const typedAruJSON = aruJSON satisfies CharacterJsonDefinition
const typedYumiJSON = yumiJSON satisfies CharacterJsonDefinition
const typedShiyeonJSON = shiyeonJSON satisfies CharacterJsonDefinition
const typedNeoJSON = neoJSON satisfies CharacterJsonDefinition

export const CHARACTERS = [
  buildCharacter(typedArisJSON),
  buildCharacter(typedAruJSON),
  buildCharacter(typedYumiJSON),
  buildCharacter(typedShiyeonJSON),
  buildCharacter(typedNeoJSON),
] as const satisfies readonly CharacterDefinition[]
