import type { CharacterDefinition } from '../types/characterDefinition'

import arisJSON from './alice_tendou.json'
import aruJSON from './aru_rikuhachima.json'
import { buildCharacter, type CharacterJsonDefinition } from './buildCharacter'
import neoJSON from './neo.json'
import shiyeonJSON from './shiyeon.json'
import yumiJSON from './yumi.json'

const typedArisJSON = arisJSON as CharacterJsonDefinition
const typedAruJSON = aruJSON as CharacterJsonDefinition
const typedYumiJSON = yumiJSON as CharacterJsonDefinition
const typedShiyeonJSON = shiyeonJSON as CharacterJsonDefinition
const typedNeoJSON = neoJSON as CharacterJsonDefinition

export const CHARACTERS = [
  buildCharacter(typedArisJSON),
  buildCharacter(typedAruJSON),
  buildCharacter(typedYumiJSON),
  buildCharacter(typedShiyeonJSON),
  buildCharacter(typedNeoJSON),
] as const satisfies readonly CharacterDefinition[]
