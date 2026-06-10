export type TagDictionaryTypeKey =
  | 'activity'
  | 'animal'
  | 'attribute'
  | 'change'
  | 'contextual'
  | 'costume'
  | 'creature'
  | 'format'
  | 'galleryWide'
  | 'highPresence'
  | 'location'
  | 'lowPresence'
  | 'reclass'
  | 'technical'
  | 'tool'
  | 'visual'

type TagDictionaryEntryShape = {
  key: string
  name: string
  tagTypes: readonly [TagDictionaryTypeKey, ...TagDictionaryTypeKey[]]
}

export const TAG_DICTIONARY = [
  {
    key: 'tag_3d',
    name: '3d',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_3d_imageset',
    name: '3d imageset',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_abortion',
    name: 'abortion',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_absorption',
    name: 'absorption',
    tagTypes: ['activity', 'change', 'visual'],
  },
  {
    key: 'tag_additional_eyes',
    name: 'additional eyes',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_adventitious_mouth',
    name: 'adventitious mouth',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_adventitious_penis',
    name: 'adventitious penis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_adventitious_vagina',
    name: 'adventitious vagina',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_afro',
    name: 'afro',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_age_progression',
    name: 'age progression',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_age_regression',
    name: 'age regression',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_ahegao',
    name: 'ahegao',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ai_generated',
    name: 'ai generated',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_albino',
    name: 'albino',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_alien',
    name: 'alien',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_alien_girl',
    name: 'alien girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_all_the_way_through',
    name: 'all the way through',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_already_uploaded',
    name: 'already uploaded',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_amputee',
    name: 'amputee',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_anaglyph',
    name: 'anaglyph',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_anal',
    name: 'anal',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_anal_birth',
    name: 'anal birth',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_anal_intercourse',
    name: 'anal intercourse',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_anal_prolapse',
    name: 'anal prolapse',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_analphagia',
    name: 'analphagia',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_angel',
    name: 'angel',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_animal_on_animal',
    name: 'animal on animal',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_animal_on_furry',
    name: 'animal on furry',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_animated',
    name: 'animated',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_animegao',
    name: 'animegao',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_anorexic',
    name: 'anorexic',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_anthology',
    name: 'anthology',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_apparel_bukkake',
    name: 'apparel bukkake',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_apron',
    name: 'apron',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_armpit_licking',
    name: 'armpit licking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_armpit_sex',
    name: 'armpit sex',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_artbook',
    name: 'artbook',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_asianporn',
    name: 'asianporn',
    tagTypes: ['reclass', 'visual'],
  },
  {
    key: 'tag_asphyxiation',
    name: 'asphyxiation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ass_expansion',
    name: 'ass expansion',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_assjob',
    name: 'assjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_aunt',
    name: 'aunt',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_autofellatio',
    name: 'autofellatio',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_autopaizuri',
    name: 'autopaizuri',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_bald',
    name: 'bald',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_ball_caressing',
    name: 'ball caressing',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ball_sucking',
    name: 'ball sucking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ball_less_shemale',
    name: 'ball-less shemale',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_balljob',
    name: 'balljob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_balls_expansion',
    name: 'balls expansion',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_bandages',
    name: 'bandages',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bandaid',
    name: 'bandaid',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bat_boy',
    name: 'bat boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_bat_girl',
    name: 'bat girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_bathing_room',
    name: 'bathing room',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_bbm',
    name: 'bbm',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_bbw',
    name: 'bbw',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_bdsm',
    name: 'bdsm',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_beach',
    name: 'beach',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_bear',
    name: 'bear',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_bear_boy',
    name: 'bear boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_bear_girl',
    name: 'bear girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_beauty_mark',
    name: 'beauty mark',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_bee_boy',
    name: 'bee boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_bee_girl',
    name: 'bee girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_bestiality',
    name: 'bestiality',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_big_areolae',
    name: 'big areolae',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_ass',
    name: 'big ass',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_balls',
    name: 'big balls',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_breasts',
    name: 'big breasts',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_clit',
    name: 'big clit',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_lips',
    name: 'big lips',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_muscles',
    name: 'big muscles',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_nipples',
    name: 'big nipples',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_penis',
    name: 'big penis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_big_vagina',
    name: 'big vagina',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_bike_shorts',
    name: 'bike shorts',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bikini',
    name: 'bikini',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bird_boy',
    name: 'bird boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_bird_girl',
    name: 'bird girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_bisexual',
    name: 'bisexual',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_bite_mark',
    name: 'bite mark',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_blackmail',
    name: 'blackmail',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_blind',
    name: 'blind',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_blindfold',
    name: 'blindfold',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_blood',
    name: 'blood',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_bloomers',
    name: 'bloomers',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_blowjob',
    name: 'blowjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_blowjob_face',
    name: 'blowjob face',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_body_modification',
    name: 'body modification',
    tagTypes: ['attribute', 'change', 'visual'],
  },
  {
    key: 'tag_body_painting',
    name: 'body painting',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_body_swap',
    name: 'body swap',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_body_writing',
    name: 'body writing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bodystocking',
    name: 'bodystocking',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bodysuit',
    name: 'bodysuit',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_bondage',
    name: 'bondage',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_braces',
    name: 'braces',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_brain_fuck',
    name: 'brain fuck',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_breast_expansion',
    name: 'breast expansion',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_breast_feeding',
    name: 'breast feeding',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_breast_reduction',
    name: 'breast reduction',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_bride',
    name: 'bride',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_brother',
    name: 'brother',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_bukkake',
    name: 'bukkake',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_bull',
    name: 'bull',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_bunny_boy',
    name: 'bunny boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_bunny_girl',
    name: 'bunny girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_burping',
    name: 'burping',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_business_suit',
    name: 'business suit',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_butler',
    name: 'butler',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_butt_plug',
    name: 'butt plug',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_camel',
    name: 'camel',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_cannibalism',
    name: 'cannibalism',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_caption',
    name: 'caption',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_cashier',
    name: 'cashier',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_cat',
    name: 'cat',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_catboy',
    name: 'catboy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_catfight',
    name: 'catfight',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_catgirl',
    name: 'catgirl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_cbt',
    name: 'cbt',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_centaur',
    name: 'centaur',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_cervix_penetration',
    name: 'cervix penetration',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cervix_prolapse',
    name: 'cervix prolapse',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_chastity_belt',
    name: 'chastity belt',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_cheating',
    name: 'cheating',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_cheerleader',
    name: 'cheerleader',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_chikan',
    name: 'chikan',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_chinese_dress',
    name: 'chinese dress',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_chloroform',
    name: 'chloroform',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_christmas',
    name: 'christmas',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_clamp',
    name: 'clamp',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_classroom',
    name: 'classroom',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_clit_growth',
    name: 'clit growth',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_clit_insertion',
    name: 'clit insertion',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_clit_stimulation',
    name: 'clit stimulation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cloaca_insertion',
    name: 'cloaca insertion',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_clone',
    name: 'clone',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_closed_eyes',
    name: 'closed eyes',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_clothed_female_nude_male',
    name: 'clothed female nude male',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_clothed_male_nude_female',
    name: 'clothed male nude female',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_clothed_paizuri',
    name: 'clothed paizuri',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_clown',
    name: 'clown',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_coach',
    name: 'coach',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_cock_ring',
    name: 'cock ring',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_cockphagia',
    name: 'cockphagia',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cockslapping',
    name: 'cockslapping',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_collar',
    name: 'collar',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_comic',
    name: 'comic',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_compilation',
    name: 'compilation',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_condom',
    name: 'condom',
    tagTypes: ['tool', 'costume', 'visual'],
  },
  {
    key: 'tag_confinement',
    name: 'confinement',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_conjoined',
    name: 'conjoined',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_coprophagia',
    name: 'coprophagia',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_corpse',
    name: 'corpse',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_corruption',
    name: 'corruption',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_corset',
    name: 'corset',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_cosplaying',
    name: 'cosplaying',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_cousin',
    name: 'cousin',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_cow',
    name: 'cow',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_cowgirl',
    name: 'cowgirl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_cowman',
    name: 'cowman',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_crab',
    name: 'crab',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_crossdressing',
    name: 'crossdressing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_crotch_tattoo',
    name: 'crotch tattoo',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_crown',
    name: 'crown',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_crying',
    name: 'crying',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cum_bath',
    name: 'cum bath',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cum_in_eye',
    name: 'cum in eye',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cum_swap',
    name: 'cum swap',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cumflation',
    name: 'cumflation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cunnilingus',
    name: 'cunnilingus',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_cuntboy',
    name: 'cuntboy',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_cuntbusting',
    name: 'cuntbusting',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_dakimakura',
    name: 'dakimakura',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_dark_nipples',
    name: 'dark nipples',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_dark_sclera',
    name: 'dark sclera',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_dark_skin',
    name: 'dark skin',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_daughter',
    name: 'daughter',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_deepthroat',
    name: 'deepthroat',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_deer',
    name: 'deer',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_deer_boy',
    name: 'deer boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_deer_girl',
    name: 'deer girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_defaced',
    name: 'defaced',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_defloration',
    name: 'defloration',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_demon',
    name: 'demon',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_demon_girl',
    name: 'demon girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_denki_anma',
    name: 'denki anma',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_depth_grading',
    name: 'depth grading',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_detached_sleeves',
    name: 'detached sleeves',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_diaper',
    name: 'diaper',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_dickgirl_on_dickgirl',
    name: 'dickgirl on dickgirl',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_dickgirl_on_female',
    name: 'dickgirl on female',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_dickgirl_on_male',
    name: 'dickgirl on male',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_dickgirls_only',
    name: 'dickgirls only',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_dicknipples',
    name: 'dicknipples',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_dilf',
    name: 'dilf',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_dinosaur',
    name: 'dinosaur',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_dismantling',
    name: 'dismantling',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_dog',
    name: 'dog',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_dog_boy',
    name: 'dog boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_dog_girl',
    name: 'dog girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_doll_joints',
    name: 'doll joints',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_dolphin',
    name: 'dolphin',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_domination_loss',
    name: 'domination loss',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_donkey',
    name: 'donkey',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_double_anal',
    name: 'double anal',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_double_blowjob',
    name: 'double blowjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_double_penetration',
    name: 'double penetration',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_double_vaginal',
    name: 'double vaginal',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_dougi',
    name: 'dougi',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_draenei',
    name: 'draenei',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_dragon',
    name: 'dragon',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_drill_hair',
    name: 'drill hair',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_drugs',
    name: 'drugs',
    tagTypes: ['activity', 'tool', 'visual'],
  },
  {
    key: 'tag_drunk',
    name: 'drunk',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ear_fuck',
    name: 'ear fuck',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_eel',
    name: 'eel',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_eggs',
    name: 'eggs',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_electric_shocks',
    name: 'electric shocks',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_elephant',
    name: 'elephant',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_elephant_boy',
    name: 'elephant boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_elephant_girl',
    name: 'elephant girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_elf',
    name: 'elf',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_emotionless_sex',
    name: 'emotionless sex',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_enema',
    name: 'enema',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_exhibitionism',
    name: 'exhibitionism',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_exposed_clothing',
    name: 'exposed clothing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_extraneous_ads',
    name: 'extraneous ads',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_eye_penetration',
    name: 'eye penetration',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_eye_covering_bang',
    name: 'eye-covering bang',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_eyemask',
    name: 'eyemask',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_eyepatch',
    name: 'eyepatch',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_facesitting',
    name: 'facesitting',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_facial_hair',
    name: 'facial hair',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_fairy',
    name: 'fairy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_fanny_packing',
    name: 'fanny packing',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_farting',
    name: 'farting',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_father',
    name: 'father',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_females_only',
    name: 'females only',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_femdom',
    name: 'femdom',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_feminization',
    name: 'feminization',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_fff_threesome',
    name: 'fff threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ffm_threesome',
    name: 'ffm threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_fft_threesome',
    name: 'fft threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_figure',
    name: 'figure',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_filming',
    name: 'filming',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_fingering',
    name: 'fingering',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_first_person_perspective',
    name: 'first person perspective',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_fish',
    name: 'fish',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_fishnets',
    name: 'fishnets',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_fisting',
    name: 'fisting',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_focus_anal',
    name: 'focus anal',
    tagTypes: ['highPresence', 'visual'],
  },
  {
    key: 'tag_focus_blowjob',
    name: 'focus blowjob',
    tagTypes: ['highPresence', 'visual'],
  },
  {
    key: 'tag_focus_cunnilingus',
    name: 'focus cunnilingus',
    tagTypes: ['highPresence', 'visual'],
  },
  {
    key: 'tag_focus_paizuri',
    name: 'focus paizuri',
    tagTypes: ['highPresence', 'visual'],
  },
  {
    key: 'tag_focus_rimjob',
    name: 'focus rimjob',
    tagTypes: ['highPresence', 'visual'],
  },
  {
    key: 'tag_food_on_body',
    name: 'food on body',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_foot_insertion',
    name: 'foot insertion',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_foot_licking',
    name: 'foot licking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_footjob',
    name: 'footjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_forbidden_content',
    name: 'forbidden content',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_forced_exposure',
    name: 'forced exposure',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_forniphilia',
    name: 'forniphilia',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_fox',
    name: 'fox',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_fox_boy',
    name: 'fox boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_fox_girl',
    name: 'fox girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_freckles',
    name: 'freckles',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_frog',
    name: 'frog',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_frog_boy',
    name: 'frog boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_frog_girl',
    name: 'frog girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_frottage',
    name: 'frottage',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_full_censorship',
    name: 'full censorship',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_full_color',
    name: 'full color',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_full_tour',
    name: 'full tour',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_full_packaged_futanari',
    name: 'full-packaged futanari',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_fundoshi',
    name: 'fundoshi',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_furry',
    name: 'furry',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_futanari',
    name: 'futanari',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_futanarization',
    name: 'futanarization',
    tagTypes: ['attribute', 'change', 'visual'],
  },
  {
    key: 'tag_gag',
    name: 'gag',
    tagTypes: ['tool', 'costume', 'visual'],
  },
  {
    key: 'tag_gang_rape',
    name: 'gang rape',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_gaping',
    name: 'gaping',
    tagTypes: ['activity', 'attribute', 'visual'],
  },
  {
    key: 'tag_garter_belt',
    name: 'garter belt',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_gasmask',
    name: 'gasmask',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_gender_change',
    name: 'gender change',
    tagTypes: ['attribute', 'change', 'visual'],
  },
  {
    key: 'tag_gender_morph',
    name: 'gender morph',
    tagTypes: ['attribute', 'change', 'visual'],
  },
  {
    key: 'tag_genital_piercing',
    name: 'genital piercing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_ghost',
    name: 'ghost',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_giant',
    name: 'giant',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_giant_sperm',
    name: 'giant sperm',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_giantess',
    name: 'giantess',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_gigantic_breasts',
    name: 'gigantic breasts',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_gijinka',
    name: 'gijinka',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_giraffe_boy',
    name: 'giraffe boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_giraffe_girl',
    name: 'giraffe girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_glasses',
    name: 'glasses',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_glory_hole',
    name: 'glory hole',
    tagTypes: ['activity', 'tool', 'visual'],
  },
  {
    key: 'tag_gloves',
    name: 'gloves',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_goat',
    name: 'goat',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_goblin',
    name: 'goblin',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_gokkun',
    name: 'gokkun',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_gorilla',
    name: 'gorilla',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_gothic_lolita',
    name: 'gothic lolita',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_goudoushi',
    name: 'goudoushi',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_granddaughter',
    name: 'granddaughter',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_grandfather',
    name: 'grandfather',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_grandmother',
    name: 'grandmother',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_group',
    name: 'group',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_growth',
    name: 'growth',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_guro',
    name: 'guro',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_gyaru',
    name: 'gyaru',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_gyaru_oh',
    name: 'gyaru-oh',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_gymshorts',
    name: 'gymshorts',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_haigure',
    name: 'haigure',
    tagTypes: ['activity', 'costume', 'visual'],
  },
  {
    key: 'tag_hair_buns',
    name: 'hair buns',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_hairjob',
    name: 'hairjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_hairy',
    name: 'hairy',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_hairy_armpits',
    name: 'hairy armpits',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_halo',
    name: 'halo',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_handicapped',
    name: 'handicapped',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_handjob',
    name: 'handjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_hanging',
    name: 'hanging',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_hardcore',
    name: 'hardcore',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_harem',
    name: 'harem',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_harness',
    name: 'harness',
    tagTypes: ['tool', 'costume', 'visual'],
  },
  {
    key: 'tag_harpy',
    name: 'harpy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_headless',
    name: 'headless',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_headphones',
    name: 'headphones',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_hedgehog_boy',
    name: 'hedgehog boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_hedgehog_girl',
    name: 'hedgehog girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_heterochromia',
    name: 'heterochromia',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_hidden_sex',
    name: 'hidden sex',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_hidden_toy',
    name: 'hidden toy',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_high_heels',
    name: 'high heels',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_hijab',
    name: 'hijab',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_hippo_boy',
    name: 'hippo boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_hippo_girl',
    name: 'hippo girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_hood',
    name: 'hood',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_horns',
    name: 'horns',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_horse',
    name: 'horse',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_horse_boy',
    name: 'horse boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_horse_cock',
    name: 'horse cock',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_horse_girl',
    name: 'horse girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_hotpants',
    name: 'hotpants',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_how_to',
    name: 'how to',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_huge_breasts',
    name: 'huge breasts',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_huge_penis',
    name: 'huge penis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_human_cattle',
    name: 'human cattle',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_human_on_furry',
    name: 'human on furry',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_humiliation',
    name: 'humiliation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_hyena_boy',
    name: 'hyena boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_hyena_girl',
    name: 'hyena girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_impregnation',
    name: 'impregnation',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_incest',
    name: 'incest',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_incomplete',
    name: 'incomplete',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_infantilism',
    name: 'infantilism',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_infirmary',
    name: 'infirmary',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_inflation',
    name: 'inflation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_insect',
    name: 'insect',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_insect_boy',
    name: 'insect boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_insect_girl',
    name: 'insect girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_inseki',
    name: 'inseki',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_internal_urination',
    name: 'internal urination',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_inverted_nipples',
    name: 'inverted nipples',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_invisible',
    name: 'invisible',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_josou_seme',
    name: 'josou seme',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_kangaroo',
    name: 'kangaroo',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_kangaroo_boy',
    name: 'kangaroo boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_kangaroo_girl',
    name: 'kangaroo girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_kappa',
    name: 'kappa',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_kemonomimi',
    name: 'kemonomimi',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_kigurumi_pajama',
    name: 'kigurumi pajama',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_kimono',
    name: 'kimono',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_kindergarten_uniform',
    name: 'kindergarten uniform',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_kissing',
    name: 'kissing',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_kneepit_sex',
    name: 'kneepit sex',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_knotted_penis',
    name: 'knotted penis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_kodomo_doushi',
    name: 'kodomo doushi',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_kodomo_only',
    name: 'kodomo only',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_kunoichi',
    name: 'kunoichi',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_lab_coat',
    name: 'lab coat',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_lactation',
    name: 'lactation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_large_insertions',
    name: 'large insertions',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_large_tattoo',
    name: 'large tattoo',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_latex',
    name: 'latex',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_layer_cake',
    name: 'layer cake',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_leash',
    name: 'leash',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_leg_lock',
    name: 'leg lock',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_legjob',
    name: 'legjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_leotard',
    name: 'leotard',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_lingerie',
    name: 'lingerie',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_lion',
    name: 'lion',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_lioness',
    name: 'lioness',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_lipstick_mark',
    name: 'lipstick mark',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_living_clothes',
    name: 'living clothes',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_lizard_girl',
    name: 'lizard girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_lizard_guy',
    name: 'lizard guy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_lolicon',
    name: 'lolicon',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_long_tongue',
    name: 'long tongue',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_low_bestiality',
    name: 'low bestiality',
    tagTypes: ['lowPresence', 'visual'],
  },
  {
    key: 'tag_low_guro',
    name: 'low guro',
    tagTypes: ['lowPresence', 'visual'],
  },
  {
    key: 'tag_low_incest',
    name: 'low incest',
    tagTypes: ['lowPresence', 'activity', 'contextual'],
  },
  {
    key: 'tag_low_lolicon',
    name: 'low lolicon',
    tagTypes: ['lowPresence', 'visual'],
  },
  {
    key: 'tag_low_scat',
    name: 'low scat',
    tagTypes: ['lowPresence', 'visual'],
  },
  {
    key: 'tag_low_shotacon',
    name: 'low shotacon',
    tagTypes: ['lowPresence', 'visual'],
  },
  {
    key: 'tag_low_smegma',
    name: 'low smegma',
    tagTypes: ['lowPresence', 'visual'],
  },
  {
    key: 'tag_machine',
    name: 'machine',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_maggot',
    name: 'maggot',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_magical_girl',
    name: 'magical girl',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_maid',
    name: 'maid',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_makeup',
    name: 'makeup',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_male_on_dickgirl',
    name: 'male on dickgirl',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_males_only',
    name: 'males only',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_masked_face',
    name: 'masked face',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_masturbation',
    name: 'masturbation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_mecha_boy',
    name: 'mecha boy',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_mecha_girl',
    name: 'mecha girl',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_menstruation',
    name: 'menstruation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_mermaid',
    name: 'mermaid',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_merman',
    name: 'merman',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_mesugaki',
    name: 'mesugaki',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_mesuiki',
    name: 'mesuiki',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_metal_armor',
    name: 'metal armor',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_midget',
    name: 'midget',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_miko',
    name: 'miko',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_milf',
    name: 'milf',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_military',
    name: 'military',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_milking',
    name: 'milking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_mind_break',
    name: 'mind break',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_mind_control',
    name: 'mind control',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_minigirl',
    name: 'minigirl',
    tagTypes: ['attribute', 'creature', 'visual'],
  },
  {
    key: 'tag_miniguy',
    name: 'miniguy',
    tagTypes: ['attribute', 'creature', 'visual'],
  },
  {
    key: 'tag_minotaur',
    name: 'minotaur',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_missing_cover',
    name: 'missing cover',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_mmf_threesome',
    name: 'mmf threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_mmm_threesome',
    name: 'mmm threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_mmt_threesome',
    name: 'mmt threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_monkey',
    name: 'monkey',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_monkey_boy',
    name: 'monkey boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_monkey_girl',
    name: 'monkey girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_monoeye',
    name: 'monoeye',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_monster',
    name: 'monster',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_monster_girl',
    name: 'monster girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_moral_degeneration',
    name: 'moral degeneration',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_mosaic_censorship',
    name: 'mosaic censorship',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_moth_boy',
    name: 'moth boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_moth_girl',
    name: 'moth girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_mother',
    name: 'mother',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_mouse',
    name: 'mouse',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_mouse_boy',
    name: 'mouse boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_mouse_girl',
    name: 'mouse girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_mouth_mask',
    name: 'mouth mask',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_mtf_threesome',
    name: 'mtf threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multi_work_series',
    name: 'multi-work series',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_multimouth_blowjob',
    name: 'multimouth blowjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multipanel_sequence',
    name: 'multipanel sequence',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_multiple_arms',
    name: 'multiple arms',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_multiple_assjob',
    name: 'multiple assjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multiple_breasts',
    name: 'multiple breasts',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_multiple_footjob',
    name: 'multiple footjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multiple_handjob',
    name: 'multiple handjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multiple_nipples',
    name: 'multiple nipples',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_multiple_orgasms',
    name: 'multiple orgasms',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multiple_pairings',
    name: 'multiple pairings',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_multiple_paizuri',
    name: 'multiple paizuri',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multiple_penises',
    name: 'multiple penises',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_multiple_straddling',
    name: 'multiple straddling',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_multiple_tails',
    name: 'multiple tails',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_multiple_vaginas',
    name: 'multiple vaginas',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_muscle',
    name: 'muscle',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_muscle_growth',
    name: 'muscle growth',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_mushroom_boy',
    name: 'mushroom boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_mushroom_girl',
    name: 'mushroom girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_mute',
    name: 'mute',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_nakadashi',
    name: 'nakadashi',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_navel_birth',
    name: 'navel birth',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_navel_fuck',
    name: 'navel fuck',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_nazi',
    name: 'nazi',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_necrophilia',
    name: 'necrophilia',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_netorare',
    name: 'netorare',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_netorase',
    name: 'netorase',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_niece',
    name: 'niece',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_ninja',
    name: 'ninja',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_nipple_birth',
    name: 'nipple birth',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_nipple_expansion',
    name: 'nipple expansion',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_nipple_fuck',
    name: 'nipple fuck',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_nipple_piercing',
    name: 'nipple piercing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_nipple_stimulation',
    name: 'nipple stimulation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_no_balls',
    name: 'no balls',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_no_penetration',
    name: 'no penetration',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_non_h_game_manual',
    name: 'non-h game manual',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_non_h_imageset',
    name: 'non-h imageset',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_non_nude',
    name: 'non-nude',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_nose_fuck',
    name: 'nose fuck',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_nose_hook',
    name: 'nose hook',
    tagTypes: ['tool', 'costume', 'visual'],
  },
  {
    key: 'tag_novel',
    name: 'novel',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_nudism',
    name: 'nudism',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_nudity_only',
    name: 'nudity only',
    tagTypes: ['technical', 'galleryWide', 'contextual'],
  },
  {
    key: 'tag_nun',
    name: 'nun',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_nurse',
    name: 'nurse',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_object_insertion_only',
    name: 'object insertion only',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_octopus',
    name: 'octopus',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_oil',
    name: 'oil',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_old_lady',
    name: 'old lady',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_old_man',
    name: 'old man',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_omorashi',
    name: 'omorashi',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_onahole',
    name: 'onahole',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_oni',
    name: 'oni',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_onsen',
    name: 'onsen',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_oppai_loli',
    name: 'oppai loli',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_orc',
    name: 'orc',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_orgasm_denial',
    name: 'orgasm denial',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_original',
    name: 'original',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_ostrich',
    name: 'ostrich',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_otokofutanari',
    name: 'otokofutanari',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_otter_boy',
    name: 'otter boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_otter_girl',
    name: 'otter girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_out_of_order',
    name: 'out of order',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_oyakodon',
    name: 'oyakodon',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_painted_nails',
    name: 'painted nails',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_paizuri',
    name: 'paizuri',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_panda_boy',
    name: 'panda boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_panda_girl',
    name: 'panda girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_panther',
    name: 'panther',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_pantyhose',
    name: 'pantyhose',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_pantyjob',
    name: 'pantyjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_paperchild',
    name: 'paperchild',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_parasite',
    name: 'parasite',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_pasties',
    name: 'pasties',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_pegasus',
    name: 'pegasus',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_pegging',
    name: 'pegging',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_penis_birth',
    name: 'penis birth',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_penis_bumps',
    name: 'penis bumps',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_penis_enlargement',
    name: 'penis enlargement',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_penis_reduction',
    name: 'penis reduction',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_personality_excretion',
    name: 'personality excretion',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_petplay',
    name: 'petplay',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_petrification',
    name: 'petrification',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_phimosis',
    name: 'phimosis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_phone_sex',
    name: 'phone sex',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_piercing',
    name: 'piercing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_pig',
    name: 'pig',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_pig_girl',
    name: 'pig girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_pig_man',
    name: 'pig man',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_pillory',
    name: 'pillory',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_pirate',
    name: 'pirate',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_piss_drinking',
    name: 'piss drinking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_pixel_art',
    name: 'pixel art',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_pixie_cut',
    name: 'pixie cut',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_plant_boy',
    name: 'plant boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_plant_girl',
    name: 'plant girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_pole_dancing',
    name: 'pole dancing',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_policeman',
    name: 'policeman',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_policewoman',
    name: 'policewoman',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_ponygirl',
    name: 'ponygirl',
    tagTypes: ['activity', 'costume', 'visual'],
  },
  {
    key: 'tag_ponytail',
    name: 'ponytail',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_possession',
    name: 'possession',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_pregnant',
    name: 'pregnant',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_prehensile_hair',
    name: 'prehensile hair',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_priest',
    name: 'priest',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_prolapse',
    name: 'prolapse',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_property_tag',
    name: 'property tag',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_prostate_massage',
    name: 'prostate massage',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_prostitution',
    name: 'prostitution',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_pubic_stubble',
    name: 'pubic stubble',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_public_use',
    name: 'public use',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_pussyboys_only',
    name: 'pussyboys only',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_rabbit',
    name: 'rabbit',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_raccoon_boy',
    name: 'raccoon boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_raccoon_girl',
    name: 'raccoon girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_race_queen',
    name: 'race queen',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_randoseru',
    name: 'randoseru',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_rape',
    name: 'rape',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_real_doll',
    name: 'real doll',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_realporn',
    name: 'realporn',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_redraw',
    name: 'redraw',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_replaced',
    name: 'replaced',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_reptile',
    name: 'reptile',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_retractable_penis',
    name: 'retractable penis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_rewrite',
    name: 'rewrite',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_rhinoceros',
    name: 'rhinoceros',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_rhinoceros_boy',
    name: 'rhinoceros boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_rhinoceros_girl',
    name: 'rhinoceros girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_rimjob',
    name: 'rimjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_robot',
    name: 'robot',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_rough_grammar',
    name: 'rough grammar',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_rough_translation',
    name: 'rough translation',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_ruined_orgasm',
    name: 'ruined orgasm',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ryona',
    name: 'ryona',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_saliva',
    name: 'saliva',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sample',
    name: 'sample',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_sarashi',
    name: 'sarashi',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_sauna',
    name: 'sauna',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_scanmark',
    name: 'scanmark',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_scar',
    name: 'scar',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_scat',
    name: 'scat',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_scat_insertion',
    name: 'scat insertion',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_school_gym_uniform',
    name: 'school gym uniform',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_school_swimsuit',
    name: 'school swimsuit',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_schoolboy_uniform',
    name: 'schoolboy uniform',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_schoolgirl_uniform',
    name: 'schoolgirl uniform',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_screenshots',
    name: 'screenshots',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_scrotal_lingerie',
    name: 'scrotal lingerie',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_selfcest',
    name: 'selfcest',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sentou',
    name: 'sentou',
    tagTypes: ['location', 'visual'],
  },
  {
    key: 'tag_sex_toys',
    name: 'sex toys',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_shapening',
    name: 'shapening',
    tagTypes: ['activity', 'attribute', 'visual'],
  },
  {
    key: 'tag_shared_senses',
    name: 'shared senses',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_shark',
    name: 'shark',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_shark_boy',
    name: 'shark boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_shark_girl',
    name: 'shark girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_shaved_head',
    name: 'shaved head',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_sheep',
    name: 'sheep',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_sheep_boy',
    name: 'sheep boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_sheep_girl',
    name: 'sheep girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_shemale',
    name: 'shemale',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_shibari',
    name: 'shibari',
    tagTypes: ['tool', 'costume', 'visual'],
  },
  {
    key: 'tag_shimaidon',
    name: 'shimaidon',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_shimapan',
    name: 'shimapan',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_shotacon',
    name: 'shotacon',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_shrinking',
    name: 'shrinking',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_sister',
    name: 'sister',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_skeleton',
    name: 'skeleton',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_sketch_lines',
    name: 'sketch lines',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_skinsuit',
    name: 'skinsuit',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_skunk_boy',
    name: 'skunk boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_skunk_girl',
    name: 'skunk girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_slave',
    name: 'slave',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sleeping',
    name: 'sleeping',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_slime',
    name: 'slime',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_slime_boy',
    name: 'slime boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_slime_girl',
    name: 'slime girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_slug',
    name: 'slug',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_small_breasts',
    name: 'small breasts',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_small_penis',
    name: 'small penis',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_smalldom',
    name: 'smalldom',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_smegma',
    name: 'smegma',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_smell',
    name: 'smell',
    tagTypes: ['activity', 'attribute', 'visual'],
  },
  {
    key: 'tag_smoking',
    name: 'smoking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_snail_girl',
    name: 'snail girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_snake',
    name: 'snake',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_snake_boy',
    name: 'snake boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_snake_girl',
    name: 'snake girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_snuff',
    name: 'snuff',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_sockjob',
    name: 'sockjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sole_dickgirl',
    name: 'sole dickgirl',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_sole_female',
    name: 'sole female',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_sole_male',
    name: 'sole male',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_sole_pussyboy',
    name: 'sole pussyboy',
    tagTypes: ['galleryWide', 'contextual'],
  },
  {
    key: 'tag_solo_action',
    name: 'solo action',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_soushuuhen',
    name: 'soushuuhen',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_spanking',
    name: 'spanking',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_speculum',
    name: 'speculum',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_speechless',
    name: 'speechless',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_spider',
    name: 'spider',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_spider_boy',
    name: 'spider boy',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_spider_girl',
    name: 'spider girl',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_split_tongue',
    name: 'split tongue',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_squid_boy',
    name: 'squid boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_squid_girl',
    name: 'squid girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_squirrel_boy',
    name: 'squirrel boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_squirrel_girl',
    name: 'squirrel girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_squirting',
    name: 'squirting',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ssbbm',
    name: 'ssbbm',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_ssbbw',
    name: 'ssbbw',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_stereoscopic',
    name: 'stereoscopic',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_steward',
    name: 'steward',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_stewardess',
    name: 'stewardess',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_stirrup_legwear',
    name: 'stirrup legwear',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_stockings',
    name: 'stockings',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_stomach_deformation',
    name: 'stomach deformation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_story_arc',
    name: 'story arc',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_straitjacket',
    name: 'straitjacket',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_strap_on',
    name: 'strap-on',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_stretching',
    name: 'stretching',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_stuck_in_wall',
    name: 'stuck in wall',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sumata',
    name: 'sumata',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sundress',
    name: 'sundress',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_sunglasses',
    name: 'sunglasses',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_suspended',
    name: 'suspended',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_sweating',
    name: 'sweating',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_swimsuit',
    name: 'swimsuit',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_swinging',
    name: 'swinging',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_syringe',
    name: 'syringe',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_tabi_socks',
    name: 'tabi socks',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_table_masturbation',
    name: 'table masturbation',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_tail',
    name: 'tail',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_tail_plug',
    name: 'tail plug',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_tailjob',
    name: 'tailjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_tailphagia',
    name: 'tailphagia',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_tall_girl',
    name: 'tall girl',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_tall_man',
    name: 'tall man',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_tankoubon',
    name: 'tankoubon',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_tanlines',
    name: 'tanlines',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_teacher',
    name: 'teacher',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_tentacles',
    name: 'tentacles',
    tagTypes: ['activity', 'creature', 'visual'],
  },
  {
    key: 'tag_text_cleaned',
    name: 'text cleaned',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_themeless',
    name: 'themeless',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_thick_eyebrows',
    name: 'thick eyebrows',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_thigh_high_boots',
    name: 'thigh high boots',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_tiara',
    name: 'tiara',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_tickling',
    name: 'tickling',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_tiger',
    name: 'tiger',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_tights',
    name: 'tights',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_time_stop',
    name: 'time stop',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_toddlercon',
    name: 'toddlercon',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_tomboy',
    name: 'tomboy',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_tomgirl',
    name: 'tomgirl',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_tooth_brushing',
    name: 'tooth brushing',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_torture',
    name: 'torture',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_tracksuit',
    name: 'tracksuit',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_trampling',
    name: 'trampling',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_transformation',
    name: 'transformation',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_translated',
    name: 'translated',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_transparent_clothing',
    name: 'transparent clothing',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_tribadism',
    name: 'tribadism',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_triple_anal',
    name: 'triple anal',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_triple_penetration',
    name: 'triple penetration',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_triple_vaginal',
    name: 'triple vaginal',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ttf_threesome',
    name: 'ttf threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ttm_threesome',
    name: 'ttm threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_ttt_threesome',
    name: 'ttt threesome',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_tube',
    name: 'tube',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_turtle',
    name: 'turtle',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_tutor',
    name: 'tutor',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_twins',
    name: 'twins',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_twintails',
    name: 'twintails',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_unbirth',
    name: 'unbirth',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_uncensored',
    name: 'uncensored',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_uncle',
    name: 'uncle',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_underwater_sex',
    name: 'underwater sex',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_unicorn',
    name: 'unicorn',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_unusual_insertions',
    name: 'unusual insertions',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_unusual_pupils',
    name: 'unusual pupils',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_unusual_teeth',
    name: 'unusual teeth',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_urethra_insertion',
    name: 'urethra insertion',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_urination',
    name: 'urination',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_vacbed',
    name: 'vacbed',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_vaginal_birth',
    name: 'vaginal birth',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_vaginal_sticker',
    name: 'vaginal sticker',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_vampire',
    name: 'vampire',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_variant_set',
    name: 'variant set',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_various',
    name: 'various',
    tagTypes: ['technical', 'galleryWide', 'visual'],
  },
  {
    key: 'tag_very_long_hair',
    name: 'very long hair',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_virginity',
    name: 'virginity',
    tagTypes: ['activity', 'contextual'],
  },
  {
    key: 'tag_vomit',
    name: 'vomit',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_vore',
    name: 'vore',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_voyeurism',
    name: 'voyeurism',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_vtuber',
    name: 'vtuber',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_waiter',
    name: 'waiter',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_waitress',
    name: 'waitress',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_watermarked',
    name: 'watermarked',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_webtoon',
    name: 'webtoon',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_weight_gain',
    name: 'weight gain',
    tagTypes: ['change', 'visual'],
  },
  {
    key: 'tag_western_cg',
    name: 'western cg',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_western_imageset',
    name: 'western imageset',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_western_non_h',
    name: 'western non-h',
    tagTypes: ['format', 'visual'],
  },
  {
    key: 'tag_wet_clothes',
    name: 'wet clothes',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_whale',
    name: 'whale',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_whip',
    name: 'whip',
    tagTypes: ['activity', 'tool', 'visual'],
  },
  {
    key: 'tag_widow',
    name: 'widow',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_widower',
    name: 'widower',
    tagTypes: ['attribute', 'contextual'],
  },
  {
    key: 'tag_wingjob',
    name: 'wingjob',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_wings',
    name: 'wings',
    tagTypes: ['attribute', 'visual'],
  },
  {
    key: 'tag_witch',
    name: 'witch',
    tagTypes: ['costume', 'visual'],
  },
  {
    key: 'tag_wolf',
    name: 'wolf',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_wolf_boy',
    name: 'wolf boy',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_wolf_girl',
    name: 'wolf girl',
    tagTypes: ['costume', 'creature', 'visual'],
  },
  {
    key: 'tag_wooden_horse',
    name: 'wooden horse',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_worm',
    name: 'worm',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_wormhole',
    name: 'wormhole',
    tagTypes: ['tool', 'visual'],
  },
  {
    key: 'tag_wrestling',
    name: 'wrestling',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_x_ray',
    name: 'x-ray',
    tagTypes: ['technical', 'visual'],
  },
  {
    key: 'tag_yandere',
    name: 'yandere',
    tagTypes: ['activity', 'attribute', 'contextual'],
  },
  {
    key: 'tag_yaoi',
    name: 'yaoi',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_yukkuri',
    name: 'yukkuri',
    tagTypes: ['creature', 'visual'],
  },
  {
    key: 'tag_yuri',
    name: 'yuri',
    tagTypes: ['activity', 'visual'],
  },
  {
    key: 'tag_zebra',
    name: 'zebra',
    tagTypes: ['animal', 'visual'],
  },
  {
    key: 'tag_zombie',
    name: 'zombie',
    tagTypes: ['creature', 'visual'],
  },
] as const satisfies readonly TagDictionaryEntryShape[]

export type TagDictionaryEntry = (typeof TAG_DICTIONARY)[number]

export type TagDictionaryEntryKey = TagDictionaryEntry['key']
