function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const adjectives = [
  '지배적인',
  '순종적인',
  '강력한',
  '기쁨을주는',
  '체벌하는',
  '절제된',
  '관능적인',
  '자극적인',
  '엄격한',
  '유혹적인',
  '거친',
  '부드러운',
  '지배받는',
  '통제하는',
  '복종하는',
  '사랑하는',
  '격렬한',
  '열정적인',
  '침착한',
  '긴장된',
]

const nouns = [
  '마스터',
  '슬레이브',
  '도미나',
  '서번트',
  '사디스트',
  '마조히스트',
  '주인',
  '복종자',
  '교관',
  '처벌자',
  '지배자',
  '피조물',
  '제왕',
  '추종자',
  '기쁨의주인',
  '통제자',
  '유혹자',
  '감독관',
  '안내자',
  '명령자',
]

const descriptions = [
  '의 미소',
  '의 손길',
  '의 채찍',
  '의 속삭임',
  '의 감시',
  '의 눈빛',
  '의 욕망',
  '의 명령',
  '의 질서',
  '의 통제',
  '의 심장',
  '의 포옹',
  '의 귓속말',
  '의 지배',
  '의 격려',
  '의 위로',
  '의 손짓',
  '의 발걸음',
  '의 그림자',
  '의 노래',
]

export function generateRandomNickname() {
  const adjective = getRandomElement(adjectives)
  const noun = getRandomElement(nouns)
  const description = getRandomElement(descriptions)
  return `${adjective} ${noun}${description}`
}
